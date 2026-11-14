'use client';

import React from 'react';
import Link from 'next/link';
import { Player } from '@remotion/player';
import { REMOTION_FPS } from '@/lib/videoConfig';
import { ProceduralCircuit, type ProceduralCircuitProps } from './ProceduralCircuit';

const PREVIEW_WIDTH = 1920;
const PREVIEW_HEIGHT = 1080;
const PREVIEW_DURATION_IN_FRAMES = 180;

const sliderLabelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 12,
  color: 'rgba(212, 212, 216, 0.92)',
  marginBottom: 8,
};

export default function ProceduralCircuitPreview() {
  const [seed, setSeed] = React.useState<string>('AG-CIRCUIT-001');
  const [flowSpeed, setFlowSpeed] = React.useState<number>(1);
  const [branchDensity, setBranchDensity] = React.useState<number>(0.62);
  const [glowColor, setGlowColor] = React.useState<string>('#57f5ff');
  const [lineWidth, setLineWidth] = React.useState<number>(1.6);

  const inputProps = React.useMemo<ProceduralCircuitProps>(() => {
    return {
      seed,
      flowSpeed,
      branchDensity,
      glowColor,
      lineWidth,
    };
  }, [branchDensity, flowSpeed, glowColor, lineWidth, seed]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <aside className="w-[360px] border-r border-neutral-800/80 p-6 md:p-8 bg-neutral-900/60">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">Procedural Circuit Lab</h1>
          <Link href="/" className="text-xs text-cyan-300 hover:text-cyan-200 underline underline-offset-4">
            Volver
          </Link>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="seed" style={sliderLabelStyle}>
              <span>seed</span>
              <span className="font-mono text-cyan-200">{seed}</span>
            </label>
            <input
              id="seed"
              type="text"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            />
          </div>

          <div>
            <label htmlFor="flowSpeed" style={sliderLabelStyle}>
              <span>flowSpeed</span>
              <span className="font-mono text-cyan-200">{flowSpeed.toFixed(2)}</span>
            </label>
            <input
              id="flowSpeed"
              type="range"
              min={0.05}
              max={4}
              step={0.01}
              value={flowSpeed}
              onChange={(event) => setFlowSpeed(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="branchDensity" style={sliderLabelStyle}>
              <span>branchDensity</span>
              <span className="font-mono text-cyan-200">{branchDensity.toFixed(2)}</span>
            </label>
            <input
              id="branchDensity"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={branchDensity}
              onChange={(event) => setBranchDensity(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="lineWidth" style={sliderLabelStyle}>
              <span>lineWidth</span>
              <span className="font-mono text-cyan-200">{lineWidth.toFixed(2)}</span>
            </label>
            <input
              id="lineWidth"
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={lineWidth}
              onChange={(event) => setLineWidth(Number(event.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="glowColor" style={sliderLabelStyle}>
              <span>glowColor</span>
              <span className="font-mono text-cyan-200">{glowColor}</span>
            </label>
            <input
              id="glowColor"
              type="color"
              value={glowColor}
              onChange={(event) => setGlowColor(event.target.value)}
              className="h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
            />
          </div>
        </div>
      </aside>

      <section className="flex-1 p-6 md:p-8 flex flex-col gap-4">
        <div className="text-xs text-neutral-400">
          Preview aislado del motor procedural experimental (fondo transparente).
        </div>

        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 md:p-6 overflow-auto">
          <div
            className="mx-auto rounded-lg overflow-hidden border border-neutral-700"
            style={{
              width: 'min(100%, 1280px)',
              backgroundColor: 'transparent',
              backgroundImage:
                'linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0',
            }}
          >
            <Player
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              component={ProceduralCircuit as React.FC<any>}
              inputProps={inputProps}
              durationInFrames={PREVIEW_DURATION_IN_FRAMES}
              fps={REMOTION_FPS}
              compositionWidth={PREVIEW_WIDTH}
              compositionHeight={PREVIEW_HEIGHT}
              controls
              autoPlay
              loop
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
