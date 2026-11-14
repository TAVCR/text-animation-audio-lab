'use client';

import React from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { Resizable } from 're-resizable';

type PanelLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

type MovableResizablePanelProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
};

const STORAGE_KEY = 'remotion-fx:movable-panels-layout:v3';
const PANEL_ACTIVE_EVENT = 'remotion-fx:movable-panel-active';

const parseStoredLayouts = (): Record<string, PanelLayout> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, PanelLayout>;
  } catch {
    return {};
  }
};

const persistLayout = (id: string, layout: PanelLayout) => {
  if (typeof window === 'undefined') return;
  const current = parseStoredLayouts();
  current[id] = layout;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore persistence errors.
  }
};

export default function MovableResizablePanel({
  id,
  children,
  className,
  defaultX = 0,
  defaultY = 0,
  defaultWidth = 360,
  defaultHeight = 120,
  minWidth = 220,
  minHeight = 80,
}: MovableResizablePanelProps) {
  const [layout, setLayout] = React.useState<PanelLayout>({
    x: defaultX,
    y: defaultY,
    width: defaultWidth,
    height: defaultHeight,
    z: 1,
  });
  const [isActive, setIsActive] = React.useState(false);

  const layoutRef = React.useRef(layout);
  React.useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  React.useEffect(() => {
    const stored = parseStoredLayouts()[id];
    if (!stored) return;
    setLayout({
      x: Number.isFinite(stored.x) ? stored.x : defaultX,
      y: Number.isFinite(stored.y) ? stored.y : defaultY,
      width: Number.isFinite(stored.width) ? Math.max(minWidth, stored.width) : defaultWidth,
      height: Number.isFinite(stored.height) ? Math.max(minHeight, stored.height) : defaultHeight,
      z: Number.isFinite(stored.z) ? stored.z : 1,
    });
  }, [defaultHeight, defaultWidth, defaultX, defaultY, id, minHeight, minWidth]);

  React.useEffect(() => {
    const onActivate = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      setIsActive(customEvent.detail?.id === id);
    };
    window.addEventListener(PANEL_ACTIVE_EVENT, onActivate as EventListener);
    return () => {
      window.removeEventListener(PANEL_ACTIVE_EVENT, onActivate as EventListener);
    };
  }, [id]);

  const activatePanel = React.useCallback(() => {
    setIsActive(true);
    window.dispatchEvent(new CustomEvent(PANEL_ACTIVE_EVENT, { detail: { id } }));
  }, [id]);

  const bringToFront = React.useCallback(() => {
    activatePanel();
    setLayout((prev) => {
      const next = { ...prev, z: Date.now() };
      persistLayout(id, next);
      return next;
    });
  }, [activatePanel, id]);

  const handleDragStart = React.useCallback((event: DraggableEvent) => {
    if ('preventDefault' in event) event.preventDefault();
    bringToFront();
  }, [bringToFront]);

  const handleDrag = React.useCallback((_event: DraggableEvent, data: DraggableData) => {
    setLayout((prev) => ({
      ...prev,
      x: data.x,
      y: data.y,
    }));
  }, []);

  const handleDragStop = React.useCallback(() => {
    persistLayout(id, layoutRef.current);
  }, [id]);

  const handleResizeStart = React.useCallback(() => {
    bringToFront();
  }, [bringToFront]);

  const handleResize = React.useCallback(
    (_event: MouseEvent | TouchEvent, _direction: unknown, ref: HTMLElement) => {
      const width = Math.max(minWidth, ref.offsetWidth);
      const height = Math.max(minHeight, ref.offsetHeight);
      setLayout((prev) => ({
        ...prev,
        width,
        height,
      }));
    },
    [minHeight, minWidth]
  );

  const handleResizeStop = React.useCallback(() => {
    persistLayout(id, layoutRef.current);
  }, [id]);

  return (
    <Draggable
      bounds="parent"
      position={{ x: layout.x, y: layout.y }}
      handle=".panel-drag-handle"
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
    >
      <div
        className={`absolute left-0 top-0 ${isActive ? 'ring-1 ring-cyan-400/70 rounded-md' : ''}`}
        onPointerDown={activatePanel}
        style={{ zIndex: layout.z }}
      >
        <Resizable
          size={{ width: layout.width, height: layout.height }}
          minWidth={minWidth}
          minHeight={minHeight}
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeStop={handleResizeStop}
          enable={
            isActive
              ? {
                  top: false,
                  right: true,
                  bottom: true,
                  left: false,
                  topRight: false,
                  bottomRight: true,
                  bottomLeft: false,
                  topLeft: false,
                }
              : {
                  top: false,
                  right: false,
                  bottom: false,
                  left: false,
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }
          }
          handleStyles={{
            right: { width: '8px', right: 0, cursor: isActive ? 'e-resize' : 'default' },
            bottom: { height: '8px', bottom: 0, cursor: isActive ? 's-resize' : 'default' },
            bottomRight: { width: '12px', height: '12px', right: 0, bottom: 0, cursor: isActive ? 'se-resize' : 'default' },
          }}
          handleComponent={{
            bottomRight: isActive ? (
              <div className="flex h-3 w-3 items-center justify-center rounded-sm border border-emerald-700/50 bg-emerald-900/35 text-[9px] leading-none text-emerald-200">
                +
              </div>
            ) : undefined,
          }}
          className={`relative min-w-0 min-h-0 overflow-auto ${className ?? ''}`}
          style={{ contain: 'layout paint style' }}
        >
          <button
            type="button"
            title="Mover contenedor"
            aria-label="Mover contenedor"
            className={`panel-drag-handle absolute right-6 top-1 z-20 h-4 w-4 rounded-sm border text-[10px] leading-none cursor-move ${
              isActive
                ? 'border-cyan-500/70 bg-cyan-900/35 text-cyan-200'
                : 'border-neutral-700/70 bg-neutral-900/35 text-neutral-500'
            }`}
          >
            +
          </button>
          <div className="h-full w-full min-w-0 min-h-0">{children}</div>
        </Resizable>
      </div>
    </Draggable>
  );
}
