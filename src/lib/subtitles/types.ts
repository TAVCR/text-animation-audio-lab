export type SubtitleCue = { id: string; start: number; end: number; text: string };
export type SubtitleWord = { word: string; start: number; end: number };
export type SubtitleTranscriber = { transcribe: (input: { bytes: Uint8Array; mimeType: string; fileName: string; language?: string; maxWords?: number }) => Promise<SubtitleWord[]> };
export type SubtitleStyle = { fontFamily: string; fontSize: number; color: string; positionY: number };
export type SubtitleDocument = { cues: SubtitleCue[]; style: SubtitleStyle };
