import { Moment } from "moment";

export function inCondensedMode(): boolean {
  return window.innerWidth <= 850;
}

export function formatDate(d: Moment): string {
  return d.format("MM-DD HH:mm ZZ");
}

export function radiansToDegrees(rad: number): string {
  return `${((rad * 180) / Math.PI).toFixed(2)}°`;
}
