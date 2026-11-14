from pathlib import Path
import json,wave
from array import array
def measure(path, plan, frames, stops):
    with wave.open(str(path)) as w:
        assert (w.getsampwidth(),w.getframerate(),w.getnchannels())==(3,48000,1)
        raw=w.readframes(w.getnframes())
    samples=array('f',(abs(int.from_bytes(raw[i:i+3],'little',signed=True))/8388608 for i in range(0,len(raw),3)))
    targets=[(frames[i],plan['offset'],'accent') for i in plan['events']]
    if stops and plan['strategy']['landing']=='last':targets.append((stops[-1],0,'landing'))
    targets.sort(key=lambda t:t[0]+t[1]); rows=[]
    centers=[(f+off)*1600 for f,off,_ in targets]
    for j,(f,off,kind) in enumerate(targets):
        center=centers[j]
        left=max(0,(centers[j-1]+center)//2 if j else 0)
        right=min(len(samples),(centers[j+1]+center)//2 if j+1<len(centers) else len(samples))
        peak=max(range(left,right),key=samples.__getitem__)
        # Scan back from the measured transient to its first quiet 1ms block.
        start=peak
        threshold=max(.001,samples[peak]*.03)
        while start>=left+48 and max(samples[start-48:start])>=threshold:start-=48
        onset=next((i for i in range(max(left,start-48),peak+1) if samples[i]>=threshold),peak)
        rows.append(dict(kind=kind,frame=f,visual_ms=f*1000/30,creative_offset=off,onset_ms=onset/48,peak_ms=peak/48,peak=samples[peak],error_ms=(peak-center)/48,error_frames=(peak-center)/1600))
    return rows
if __name__=='__main__':
    p=Path('examples/phase33.json');data=json.loads(p.read_text(encoding='utf8'))
    for r in data:
        inp=r['input'];plan=r['runs'][-1]['plan'];rows=measure(r['wav'],plan,inp['frames'],inp['motion']['settleFrames']);r['measurements']=rows
        print(inp['template'],r['speed'],inp['port'],len(rows),round(max(abs(x['error_ms']) for x in rows),2),plan['strategy']['voice'])
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
