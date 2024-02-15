export function roundTime(time: number, interval: number) {
  return Math.floor(time / interval) * interval;
}

export function trimNumber(num: number, decimals: number = 4) {
  const p = Math.pow(10, decimals);
  return Math.floor(num * p) / p;
}
