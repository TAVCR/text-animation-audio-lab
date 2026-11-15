import type {AnimationProps} from '@/lib/types/animation';
// Mirrors the visual sequence's integer segment allocation.
const fitDurationsToTotal = (requested: number[], totalFrames: number): number[] => {
  if (requested.length === 0) return [];
  if (requested.length === 1) return [Math.max(1, totalFrames)];

  const sum = requested.reduce((acc, value) => acc + value, 0);
  if (sum <= totalFrames) {
    const result = [...requested];
    result[result.length - 1] += totalFrames - sum;
    return result;
  }

  const scaled = requested.map((value) => Math.max(2, Math.floor((value / sum) * totalFrames)));
  let allocated = scaled.reduce((acc, value) => acc + value, 0);

  while (allocated > totalFrames) {
    let changed = false;
    for (let i = scaled.length - 1; i >= 0 && allocated > totalFrames; i -= 1) {
      if (scaled[i] > 2) {
        scaled[i] -= 1;
        allocated -= 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (allocated < totalFrames) {
    scaled[scaled.length - 1] += totalFrames - allocated;
  }

  return scaled;
};
export function boxLandmarks(p:AnimationProps, words:number, frames:number, fps:number){
  const list=(p.boxSequenceDurationsRaw??'').split(/[\n,]+/).map(Number).filter(n=>Number.isFinite(n) && n>0);
  const fallback=[p.boxSequenceDurationOne,p.boxSequenceDurationTwo,p.boxSequenceDurationThree,p.boxSequenceDurationFour].map((value,i,all)=>value||all.slice(0,i).reverse().find(Boolean)||1);
  const requested=Array.from({length:Math.max(1,words)},(_,i)=>Math.max(2,Math.round((list[i]??Math.max(.15,fallback[Math.min(i,3)]))*fps)));
  const lengths=fitDurationsToTotal(requested,frames);
  let end=0;
  const marks=[1,Math.max(2,Math.min(28,Math.floor(lengths[0]*.4)))];
  lengths.slice(0,-1).forEach((len,i)=>{
    end+=len;
    marks.push(end-Math.max(6,Math.min(24,Math.floor(Math.min(len,lengths[i+1])*.32))),end);
  });
  marks.push(frames-Math.max(6,Math.min(28,Math.floor(lengths[lengths.length-1]*.4))));
  return marks.filter(n=>n>=0);
}
