export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const easeInOut = t => (t < 0.5) ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
export const formatScore = n => n.toLocaleString('ko-KR') + '점';
