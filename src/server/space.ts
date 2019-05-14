import rp, { RequestPromise } from 'request-promise';
import satellite from 'satellite.js';
import moment from 'moment';
import NodeCache from 'node-cache';
import { Satellite, LatLong, SatellitePass, SatellitePosition } from '../util/SharedTypes';

const satCache = new NodeCache( { stdTTL: 60 * 60 * 12 } );

export function getTleData(): RequestPromise {
  return rp('https://www.amsat.org/tle/current/nasa.all');
}

export async function parseTleData(forceCacheRefresh: boolean): Promise<Array<Satellite>> {
  if (forceCacheRefresh) {
    satCache.flushAll();
  }
  const cachedSatellites = satCache.keys();
  if (cachedSatellites.length > 0) {
    return Object.values(satCache.mget(cachedSatellites));
  }
  
  // The cache was flushed or is empty, so reload from source.
  console.log("Loading satellite TLE data from Amsat");
  let data = await getTleData();
  const parsed = [];
  const beginValue = "TO ALL RADIO AMATEURS BT";
  const endValue = "/EX"
  data = data.substring(data.indexOf(beginValue) + beginValue.length + 2,
                        data.indexOf(endValue) - 1).split("\n")
  for (let i = 0; i < data.length; i += 3) {
    const firstStanza = data[i + 1].split(" ").filter(function(i: string) { return i != "" });
    const secondStanza = data[i + 2].split(" ").filter(function(i: string ) { return i != "" });
    const sat: Satellite = {
      name: data[i],
      line1: data[i + 1],
      line2: data[i + 2],
      catalogNum: parseFloat(firstStanza[1].substring(0, firstStanza[1].length - 1)),
      epochTime: parseFloat(firstStanza[3]),
      decay: parseFloat(firstStanza[4]),
      elsetnum: parseFloat(firstStanza[8].substring(0, firstStanza[8].length - 1)),
      inclination: parseFloat(secondStanza[2]),
      raan: parseFloat(secondStanza[3]),
      eccentricity: secondStanza[4],
      argPerigree: parseFloat(secondStanza[5]),
      meanAnomaly: parseFloat(secondStanza[6]),
      meanMotion: parseFloat(secondStanza[7].substring(0, 11)),
      orbitNumber: (secondStanza.length === 9) ? parseFloat(secondStanza[8].substring(0, secondStanza[8].length - 1)) : parseFloat(secondStanza[7].substring(11, 16))
    };
    parsed.push(sat);
    satCache.set(sat['name'], sat);
  }
  return parsed;
}

export function calculateSatellitePosition(tleData: Satellite, observerCoords: LatLong, time: Date): SatellitePosition {
  const satRec = satellite.twoline2satrec(tleData['line1'], tleData['line2']);
  const pv = satellite.propagate(satRec, time);

  const observer = {
    longitude: satellite.degreesToRadians(observerCoords.longitude),
    latitude: satellite.degreesToRadians(observerCoords.latitude),
    height: 0
  };
  // GMST = Greenwich Mean Sidereal Time
  const gmst = satellite.gstime(time);
  const positionEcf = satellite.eciToEcf(pv.position, gmst);
  const positionGd = satellite.eciToGeodetic(pv.position, gmst);
  const lookAngles = satellite.ecfToLookAngles(observer, positionEcf);
  //const dopplerFactor = satellite.dopplerFactor(observerEcf, positionEcf, velocityEcf);
  
  return {
    name: tleData['name'],
    longitude: satellite.degreesLong(positionGd.longitude),
    latitude: satellite.degreesLat(positionGd.latitude),
    height: positionGd.height,
    azimuth: lookAngles.azimuth,
    elevation: lookAngles.elevation,
    rangeSat: lookAngles.rangeSat
  }
}

export function getFuturePasses(satellite: string, observerCoords: LatLong): Array<SatellitePass> {
  // First, make sure we have data loaded for this satellite in the cache
  // If we don't, load it.
  let tleData = satCache.get(satellite) as Satellite;
  if(!tleData) {
    parseTleData(true);
    tleData = satCache.get(satellite) as Satellite;
  }
  
  // Now proceed with analyzing the passes for this satellite
  let timeIndex = moment();
  const passes: Array<SatellitePass> = [];
  let inPass = false;
  // Only look up to three days in the future
  const maxSearch = moment(timeIndex).add(3, "days");
  while(timeIndex < maxSearch) {
    const positionData = calculateSatellitePosition(tleData, observerCoords, timeIndex.toDate());
    if (positionData.elevation > 0) {
      if (!inPass) {
        inPass = true;
        passes.push({
          aos: timeIndex.toDate(),
          maxElevation: positionData.elevation,
          aosAzimuth: positionData.azimuth,
          positions: [[timeIndex.toDate(), positionData]],
          los: new Date('2300-01-01T00:00:00'), // will be filled in when we find it
          losAzimuth: Infinity // will be filled in when we find it
        });
      } else {
        const currentPass = passes[passes.length - 1];
        currentPass.positions.push([timeIndex.toDate(), positionData]);
        if (positionData.elevation > currentPass.maxElevation) {
          currentPass.maxElevation = positionData.elevation;
        }
      }
    } else {
      if (inPass) {
        inPass = false;
        const thisPass = passes[passes.length - 1];
        thisPass.los = timeIndex.toDate();
        thisPass.losAzimuth = positionData.azimuth;
      }
    }
    timeIndex = moment(timeIndex).add(1, "minutes");
  }
  return passes;
}