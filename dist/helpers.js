export function roundTime(time, interval) {
    return Math.floor(time / interval) * interval;
}
export function trimNumber(num, decimals = 4) {
    const p = Math.pow(10, decimals);
    return Math.floor(num * p) / p;
}
