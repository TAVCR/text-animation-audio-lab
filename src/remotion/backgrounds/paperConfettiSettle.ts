export type PaperConfettiState = { x: number; y: number; rotation: number; face: 1 | -1; opacity: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getPaperConfettiState = (ageSeconds: number, seed: number, gravity: number, wind: number, tumbleRate: number, settleSeconds: number): PaperConfettiState => {
  const fallSeconds = clamp(2 / Math.sqrt(Math.max(0.2, gravity)), 1.6, 4);
  const cycle = Math.max(5, fallSeconds + settleSeconds + 0.3);
  const age = ((ageSeconds + seed * cycle) % cycle + cycle) % cycle;
  const startX = 0.1 + (seed * 0.73 % 0.8);
  const floorY = 0.78 + (seed * 0.17 % 0.12);
  if (age < fallSeconds) {
    const t = age / fallSeconds;
    return { x: startX + wind * t, y: -0.1 + (floorY + 0.1) * t * t, rotation: age * tumbleRate * Math.PI, face: Math.cos(age * tumbleRate * Math.PI) >= 0 ? 1 : -1, opacity: 1 };
  }
  if (age < fallSeconds + settleSeconds) {
    const settle = age - fallSeconds;
    return { x: startX + wind, y: floorY, rotation: tumbleRate * Math.PI * (1 - settle / Math.max(0.1, settleSeconds)), face: 1, opacity: 1 };
  }
  return { x: startX + wind, y: floorY, rotation: 0, face: 1, opacity: clamp(1 - (age - fallSeconds - settleSeconds) / 0.3, 0, 1) };
};
