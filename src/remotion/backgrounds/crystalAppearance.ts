export const resolveCrystalOpacity = (value: number): { opacity: number; transparent: boolean } => {
  const opacity = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1));
  return { opacity, transparent: opacity < 1 };
};

export const resolveCrystalShardScale = (sizeMin: number, sizeMax: number, seed: number): number => {
  const min = Math.min(sizeMin, sizeMax);
  const max = Math.max(sizeMin, sizeMax);
  const spread = Math.min(100, Math.max(0, max - min));
  const base = Math.min(100, Math.max(0, min));
  return 0.12 + ((base + spread * Math.min(1, Math.max(0, seed))) / 100) * 0.72;
};
