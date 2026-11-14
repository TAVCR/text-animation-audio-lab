const hash = (value: string): number => {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0) / 4294967295;
};

export const getPaperCutoutPiece = (index: number, frame: number, settleFrames: number, seed: string, floatAmplitude = 48, floatSpeed = 1, fps = 30) => {
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, settleFrames)));
  const finalRotation = (hash(`${seed}:${index}:rotation`) * 2 - 1) * 6;
  const phase = hash(`${seed}:${index}:float`) * Math.PI * 2;
  const settledFrame = Math.max(0, frame - settleFrames);
  const floatY = progress < 1 ? 0 : Math.max(0, floatAmplitude) * Math.sin(phase + settledFrame / fps * Math.max(0, floatSpeed) * Math.PI / 2);
  return { progress, rotation: finalRotation * progress, y: (1 - progress) * -0.25, floatY };
};
