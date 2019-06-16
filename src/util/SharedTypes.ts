export type LatLong = {
  latitude: number;
  longitude: number;
};

export type GeolocationOutput = {
  coords: LatLong;
};

export type GeolocationError = {
  code: number;
  message: string;
};

export type Satellite = {
  name: string;
  line1: string;
  line2: string;
  catalogNum: number;
  epochTime: number;
  decay: number;
  elsetnum: number;
  inclination: number;
  raan: number;
  eccentricity: string;
  argPerigree: number;
  meanAnomaly: number;
  meanMotion: number;
  orbitNumber: number;
  dataUpdatedAt: Date;
  enabled: boolean;
};

export type SatellitePosition = {
  name: string;
  longitude: number;
  latitude: number;
  height: number;
  azimuth: number;
  elevation: number;
  rangeSat: number;
};

export type SatellitePass = {
  aos: Date;
  maxElevation: number;
  aosAzimuth: number;
  positions: Array<[Date, SatellitePosition]>;
  los: Date;
  losAzimuth: number;
};
