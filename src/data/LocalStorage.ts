import { Satellite, LatLong } from "../util/SharedTypes";
import { WindowTypeMap } from "../containers/TrackerContainer";
import { MosaicNode } from "react-mosaic-component";

export function getSavedSatellites(): Array<Satellite> {
  const sats: Array<Satellite> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const satKey = localStorage.key(i);
    if (satKey && satKey.startsWith("SAT:")) {
      const satJson = localStorage.getItem(satKey);
      if (satJson) {
        const sat = JSON.parse(satJson) as Satellite;
        sats.push(sat);
      }
    }
  }
  return sats;
}

export function getSavedSatellite(name: string): Satellite | null {
  const sat = localStorage.getItem(`SAT:${name}`);
  if (sat) {
    return JSON.parse(sat) as Satellite;
  } else {
    return null;
  }
}

export function saveSatellite(sat: Satellite): boolean {
  localStorage.setItem(`SAT:${sat.name}`, JSON.stringify(sat));
  return true;
}

export function deleteSavedSatellite(name: string): void {
  localStorage.removeItem(`SAT:${name}`);
}

export function getSavedUserLocation(): LatLong | null {
  const savedLocation = localStorage.getItem("userLocation");
  if (savedLocation) {
    return JSON.parse(savedLocation) as LatLong;
  } else {
    return null;
  }
}

export function saveUserLocation(newLocation: LatLong): boolean {
  if (
    newLocation.latitude !== 0 &&
    newLocation.latitude !== null &&
    newLocation.longitude !== 0 &&
    newLocation.longitude !== null
  ) {
    localStorage.setItem("userLocation", JSON.stringify(newLocation));
    return true;
  } else {
    return false;
  }
}

export function saveMosaicLayout(
  condensed: boolean,
  node: MosaicNode<number> | null
): boolean {
  if (node && condensed) {
    localStorage.setItem("mosaicLayoutCondensed", JSON.stringify(node));
  } else if (node && !condensed) {
    localStorage.setItem("mosaicLayoutExpanded", JSON.stringify(node));
  }
  return true;
}

export function getMosaicLayout(condensed: boolean): MosaicNode<number> | null {
  const savedLayout = localStorage.getItem(
    condensed ? "mosaicLayoutCondensed" : "mosaicLayoutExpanded"
  );
  if (savedLayout) {
    return JSON.parse(savedLayout) as MosaicNode<number>;
  } else {
    return null;
  }
}

export function saveWindowTypeMap(windowTypeMap: WindowTypeMap): boolean {
  localStorage.setItem("windowTypeMap", JSON.stringify(windowTypeMap));
  return true;
}

export function getWindowTypeMap(): WindowTypeMap | null {
  const savedWindows = localStorage.getItem("windowTypeMap");
  if (savedWindows) {
    return JSON.parse(savedWindows) as WindowTypeMap;
  } else {
    return null;
  }
}

export function clearLocalData(): void {
  localStorage.clear();
  window.location.reload();
}
