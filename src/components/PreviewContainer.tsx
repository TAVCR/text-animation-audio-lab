'use client';

import React from 'react';
import { Player } from '@remotion/player';
import type { PlayerRef } from '@remotion/player';
import { useAnimation } from '@/lib/AnimationContext';
import { SoundPreview, SoundDesign } from './SoundDesign';
import { getCompositionDimensions, REMOTION_FPS, getResolvedDurationInFrames } from '@/lib/videoConfig';

function PlaybackIcon({ kind }: { kind: 'start' | 'back' | 'play' | 'pause' | 'forward' }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  if (kind === 'play') return <svg {...common}><path d="m8 5 11 7-11 7V5Z" /></svg>;
  if (kind === 'pause') return <svg {...common}><path d="M8 5v14M16 5v14" /></svg>;
  if (kind === 'start') return <svg {...common}><path d="M6 5v14M18 5l-9 7 9 7V5Z" /></svg>;
  if (kind === 'back') return <svg {...common}><path d="m5 12 7-7v14l-7-7Zm7 0 7-7v14l-7-7Z" /></svg>;
  return <svg {...common}><path d="m19 12-7-7v14l7-7Zm-7 0L5 5v14l7-7Z" /></svg>;
}

export default function PreviewContainer() {
  const { props, setProps, setPreviewFrame } = useAnimation();
  const [soundUrl,setSoundUrl]=React.useState('');
  const dims = getCompositionDimensions(props.aspectRatio, props.resolutionPreset);
  const totalDurationInFrames = getResolvedDurationInFrames(props, REMOTION_FPS);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = React.useState({ width: dims.width, height: dims.height });
  const playerRef = React.useRef<PlayerRef>(null);
  const [currentFrame, setCurrentFrame] = React.useState(0);
  const playerKey = `${dims.width}x${dims.height}:${props.animationStyle}`;

  const syncFrame = React.useCallback((frame: number) => {
    if (!Number.isFinite(frame)) return;
    const normalized = Math.max(0, Math.min(totalDurationInFrames - 1, Math.round(frame)));
    setCurrentFrame(normalized);
    setPreviewFrame(normalized);
  }, [setPreviewFrame, totalDurationInFrames]);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const frame = playerRef.current?.getCurrentFrame();
      if (typeof frame === 'number') syncFrame(frame);
    }, 100);
    return () => window.clearInterval(timer);
  }, [syncFrame]);

  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handleFrameUpdate = (event: { detail: { frame: number } }) => syncFrame(event.detail.frame);
    const handleSeeked = (event: { detail: { frame: number } }) => syncFrame(event.detail.frame);
    player.addEventListener('frameupdate', handleFrameUpdate);
    player.addEventListener('seeked', handleSeeked);
    syncFrame(player.getCurrentFrame());
    return () => {
      player.removeEventListener('frameupdate', handleFrameUpdate);
      player.removeEventListener('seeked', handleSeeked);
    };
  }, [playerRef, syncFrame, playerKey]);

  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateSize = () => {
      const width = Math.max(1, Math.floor(element.clientWidth));
      const height = Math.max(1, Math.floor(element.clientHeight));
      setViewportSize({ width, height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const availableWidth = Math.max(1, viewportSize.width - 24);
  const availableHeight = Math.max(1, viewportSize.height - 24);
  const scale = Math.min(availableWidth / dims.width, availableHeight / dims.height, 1);
  const playerWidth = Math.max(2, Math.floor(dims.width * scale));
  const playerHeight = Math.max(2, Math.floor(dims.height * scale));
  // A template change must restart its timeline; ordinary visual edits keep the Player mounted.
  // The player automatically renders the MainComposition which dynamically switches templates based on props
  
  return (
    <div className="w-full h-full flex flex-col p-0 overflow-hidden bg-neutral-950">
      <SoundDesign props={props} frames={totalDurationInFrames} onSound={setSoundUrl}/>
      <div ref={viewportRef} className="w-full flex-1 min-h-0 flex items-center justify-center relative p-3">
        {/* Layer Visibility Toggles */}
        <div className="absolute top-3 right-3 z-20 pointer-events-auto">
          <div className="rounded-lg border border-neutral-700/80 bg-neutral-900/90 backdrop-blur-md shadow-lg shadow-black/50 p-1.5 flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-1">Capas</span>
            <button
              type="button"
              onClick={() => setProps((prev) => ({ ...prev, showTextLayer: !prev.showTextLayer }))}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                props.showTextLayer
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-neutral-200'
              }`}
              title="Activar/Desactivar capa de texto"
            >
              Texto
            </button>
            <button
              type="button"
              onClick={() => setProps((prev) => ({ ...prev, enableParticles: !prev.enableParticles }))}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                props.enableParticles
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-neutral-200'
              }`}
              title="Activar/Desactivar fondo"
            >
              Fondo
            </button>
          </div>
        </div>

        {/* Scaled Player Canvas */}
        <div
          style={{
            width: `${playerWidth}px`,
            height: `${playerHeight}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: props.isTransparent ? 'transparent' : props.backgroundColor,
            backgroundImage: props.isTransparent ? 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23303030\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' : 'none',
            outline: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Player
            ref={playerRef}
            key={playerKey}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            component={SoundPreview as React.ComponentType<any>}
            inputProps={{...props,soundUrl}}
            durationInFrames={totalDurationInFrames}
            fps={REMOTION_FPS}
            compositionWidth={dims.width}
            compositionHeight={dims.height}
            style={{
              width: `${playerWidth}px`,
              height: `${playerHeight}px`,
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              backgroundColor: 'transparent',
              backgroundImage: 'none',
            }}
            className="remotion-player-clean"
            controls={false}
            autoPlay
            loop
            renderLoading={() => <div className="text-neutral-500 font-mono text-xs animate-pulse">Cargando composición...</div>}
          />
        </div>
      </div>

      {/* Docked Bottom Playback Controls & Scrubber Timeline */}
      <div className="w-full shrink-0 border-t border-neutral-800 bg-neutral-900/95 backdrop-blur-md px-4 py-2 flex flex-col gap-1.5" aria-label="Controles del preview">
        {/* Timeline Scrubber */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] font-mono text-neutral-400 min-w-[36px] text-right">
            {(currentFrame / REMOTION_FPS).toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1, totalDurationInFrames - 1)}
            value={Math.min(currentFrame, totalDurationInFrames - 1)}
            onChange={(e) => playerRef.current?.seekTo(Number(e.target.value))}
            aria-label="Línea de tiempo"
            className="w-full h-2 accent-emerald-500 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-neutral-500 min-w-[36px]">
            {(totalDurationInFrames / REMOTION_FPS).toFixed(1)}s
          </span>
        </div>

        {/* Button Actions & Frame Counter */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {[
              ['Volver al inicio', 'start', () => playerRef.current?.seekTo(0)],
              ['Retroceder', 'back', () => playerRef.current?.seekTo(Math.max(0, currentFrame - 30))],
              ['Reproducir', 'play', () => playerRef.current?.play()],
              ['Pausar', 'pause', () => playerRef.current?.pause()],
              ['Avanzar', 'forward', () => playerRef.current?.seekTo(Math.min(totalDurationInFrames - 1, currentFrame + 30))],
            ].map(([label, icon, action]) => (
              <button
                key={String(label)}
                type="button"
                onClick={action as () => void}
                className="h-7 px-2.5 rounded border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 hover:text-white text-neutral-300 transition-colors flex items-center gap-1 text-xs"
                aria-label={String(label)}
                title={String(label)}
              >
                <PlaybackIcon kind={icon as 'start' | 'back' | 'play' | 'pause' | 'forward'} />
                <span className="hidden sm:inline text-[11px]">{String(label)}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <span className="rounded bg-neutral-800 px-2 py-0.5 text-neutral-300 text-[11px]" aria-live="polite">
              F: {currentFrame} / {totalDurationInFrames - 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

