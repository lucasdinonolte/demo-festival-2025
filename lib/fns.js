export const clamp = (min, max, v) => {
  return Math.min(Math.max(v, min), max);
};
