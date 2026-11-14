export const getWordHighlightIndex = (frame: number, wordCount: number, wordSeconds: number, fps = 30): number => {
  if (wordCount <= 0) return -1;
  const safeSeconds = Math.max(0.01, wordSeconds);
  return Math.min(wordCount - 1, Math.max(0, Math.floor(Math.max(0, frame) / (safeSeconds * fps))));
};
