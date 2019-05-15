import {
  twoline2satrec,
  propagate,
  degreesToRadians,
  gstime,
  eciToEcf,
  eciToGeodetic,
  ecfToLookAngles,
  degreesLat,
  degreesLong
} from "satellite.js";
import moment from "moment";
import {
  Satellite,
  LatLong,
  SatellitePass,
  SatellitePosition
} from "../util/SharedTypes";

export function getDefaultTleData(): Promise<string> {
  return fetch("/birds.txt").then(response => response.text());
}

export function parseTleData(
  name: string,
  line1: string,
  line2: string
): Satellite {
  const firstStanza = line1.split(" ").filter(function(i: string) {
    return i !== "";
  });
  const secondStanza = line2.split(" ").filter(function(i: string) {
    return i !== "";
  });
  const sat: Satellite = {
    name: name,
    line1: line1,
    line2: line2,
    catalogNum: parseFloat(
      firstStanza[1].substring(0, firstStanza[1].length - 1)
    ),
    epochTime: parseFloat(firstStanza[3]),
    decay: parseFloat(firstStanza[4]),
    elsetnum: parseFloat(
      firstStanza[8].substring(0, firstStanza[8].length - 1)
    ),
    inclination: parseFloat(secondStanza[2]),
    raan: parseFloat(secondStanza[3]),
    eccentricity: secondStanza[4],
    argPerigree: parseFloat(secondStanza[5]),
    meanAnomaly: parseFloat(secondStanza[6]),
    meanMotion: parseFloat(secondStanza[7].substring(0, 11)),
    orbitNumber:
      secondStanza.length === 9
        ? parseFloat(secondStanza[8].substring(0, secondStanza[8].length - 1))
        : parseFloat(secondStanza[7].substring(11, 16))
  };
  localStorage.setItem(sat.name, JSON.stringify(sat));
  return sat;
}

export async function getDefaultSatellites(): Promise<Array<Satellite>> {
  const rawdata = await getDefaultTleData();
  const parsed: Satellite[] = [];
  let data: string[] = rawdata.split("\n");
  for (let i = 0; i < data.length; i += 3) {
    const sat = parseTleData(data[i], data[i + 1], data[i + 2]);
    parsed.push(sat);
  }
  return parsed;
}

export function calculateSatellitePosition(
  tleData: Satellite,
  observerCoords: LatLong,
  time: Date
): SatellitePosition {
  const satRec = twoline2satrec(tleData["line1"], tleData["line2"]);
  const pv = propagate(satRec, time);

  const observer = {
    longitude: degreesToRadians(observerCoords.longitude),
    latitude: degreesToRadians(observerCoords.latitude),
    height: 0
  };
  // GMST = Greenwich Mean Sidereal Time
  const gmst = gstime(time);
  const positionEcf = eciToEcf(pv.position, gmst);
  const positionGd = eciToGeodetic(pv.position, gmst);
  const lookAngles = ecfToLookAngles(observer, positionEcf);
  //const dopplerFactor = satellite.dopplerFactor(observerEcf, positionEcf, velocityEcf);

  return {
    name: tleData["name"],
    longitude: degreesLong(positionGd.longitude),
    latitude: degreesLat(positionGd.latitude),
    height: positionGd.height,
    azimuth: lookAngles.azimuth,
    elevation: lookAngles.elevation,
    rangeSat: lookAngles.rangeSat
  };
}

export function getFuturePasses(
  tleData: Satellite,
  observerCoords: LatLong
): Array<SatellitePass> {
  // Now proceed with analyzing the passes for this satellite
  let timeIndex = moment();
  const passes: Array<SatellitePass> = [];
  let inPass = false;
  // Only look up to three days in the future
  const maxSearch = moment(timeIndex).add(3, "days");
  while (timeIndex < maxSearch) {
    const positionData = calculateSatellitePosition(
      tleData,
      observerCoords,
      timeIndex.toDate()
    );
    if (positionData.elevation > 0) {
      if (!inPass) {
        inPass = true;
        passes.push({
          aos: timeIndex.toDate(),
          maxElevation: positionData.elevation,
          aosAzimuth: positionData.azimuth,
          positions: [[timeIndex.toDate(), positionData]],
          los: new Date("2300-01-01T00:00:00"), // will be filled in when we find it
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
