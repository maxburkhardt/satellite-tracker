export function inCondensedMode(): boolean {
  return window.innerWidth <= 850;
}

export function radiansToDegrees(rad: number): string {
  return `${((rad * 180) / Math.PI).toFixed(2)}°`;
}
