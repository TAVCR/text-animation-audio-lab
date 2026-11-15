"""Incremental, region-level features measured from bounded stereo analysis windows."""
import json
import subprocess
from pathlib import Path

import numpy as np
from scipy.signal import find_peaks

RATE = 16000
HOP = 160
VERSION = 1

def run(args):
    return subprocess.run(args, capture_output=True, check=True, timeout=12).stdout

def features(path, duration):
    length = min(duration, 8.)
    starts = np.linspace(0, max(0.,duration-length), min(4,int(np.ceil(duration/length))))
    regions = []
    for start in starts:
        data = run(['ffmpeg','-nostdin','-v','error','-ss',str(start),'-i',str(path),'-t',str(length),'-ac','2','-ar',str(RATE),'-f','f32le','-'])
        pcm = np.frombuffer(data,dtype='<f4').reshape(-1,2)
        blocks = pcm[:len(pcm)//HOP*HOP].reshape(-1,HOP,2)
        if len(blocks)<2:continue
        level = np.sqrt(np.mean(blocks**2,axis=(1,2)))
        peaks, _ = find_peaks(np.r_[0,level,0],distance=6,prominence=max(.0008,level.max()*.08))
        peaks = peaks-1
        for i in sorted(peaks,key=lambda j:-level[j])[:8]:
            if level[i]<.001:continue
            left=right=i
            floor=max(.0002,level[i]*.13)
            while left>0 and i-left<60 and level[left-1]>floor and level[left-1]<=level[i]:left-=1
            while right+1<len(level) and right-i<80 and level[right+1]>floor and level[right+1]<=level[i]:right+=1
            clip=blocks[left:right+1].reshape(-1,2)
            power=(np.abs(np.fft.rfft(clip*np.hanning(len(clip))[:,None],axis=0))**2).sum(axis=1)
            power/=max(power.sum(),1e-15)
            freq=np.fft.rfftfreq(len(clip),1/RATE)
            hot=float(np.mean(np.max(abs(clip),axis=1)>=.999))
            if hot>.025:continue
            regions.append(dict(start=round(start+left*.01,3),end=round(start+(right+1)*.01,3),
                hit=round(start+i*.01,3),attack=(i-left)*.01,centroid=float(power@freq),
                high=float(power[freq>3000].sum()),crest=float(np.max(abs(clip))/max(np.sqrt(np.mean(clip**2)),1e-6)),overload=hot))
    return regions

def cached(db,path):
    db.execute('CREATE TABLE IF NOT EXISTS acoustic_regions(path TEXT PRIMARY KEY,size INTEGER,mtime INTEGER,version INTEGER,regions TEXT)')
    stat=path.stat()
    row=db.execute('SELECT regions FROM acoustic_regions WHERE path=? AND size=? AND mtime=? AND version=?',
                   (str(path),stat.st_size,stat.st_mtime_ns,VERSION)).fetchone()
    if row:return json.loads(row[0])
    duration=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(path)]))
    regions=features(path,duration) if duration>=.02 else []
    db.execute('INSERT OR REPLACE INTO acoustic_regions VALUES(?,?,?,?,?)',(str(path),stat.st_size,stat.st_mtime_ns,VERSION,json.dumps(regions)))
    db.commit()
    return regions
