import sqlite3
import tempfile
import unittest
from pathlib import Path
import numpy as np
import soundfile as sf
from sfx_regions import cached

class Regions(unittest.TestCase):
    def test_late_impulses_in_opposite_stereo_phase_and_incremental_refresh(self):
        with tempfile.TemporaryDirectory(dir='.audio-lab') as temp:
            path=Path(temp)/'impulses.wav'
            rate=16000
            mono=np.zeros(rate*36,dtype='float32')
            for second in (1,29,30,34):
                t=np.arange(1600)/rate
                mono[rate*second:rate*second+len(t)]=.5*np.exp(-30*t)*np.sin(2*np.pi*840*t)
            sf.write(path,np.column_stack([mono,-mono]),rate)
            con=sqlite3.connect(':memory:')
            initial=cached(con,path)
            self.assertGreaterEqual(sum(r['hit']>20 for r in initial),2)
            self.assertEqual(cached(con,path),initial)
            sf.write(path,np.zeros(rate),rate)
            self.assertEqual(cached(con,path),[])
            con.close()

if __name__=='__main__':unittest.main()
