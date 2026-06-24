import React from 'react';
import { NTerminalApp } from '../components/application/apps/terminal/types';
import { TerminalBuffer } from '../components/application/apps/terminal/TerminalBuffer';
import { applyResize } from '../components/application/apps/terminal/TerminalRenderer';
import {
  scrollBy as calcScrollBy,
  scrollTo as calcScrollTo,
  scrollIntoCursorView as calcScrollIntoCursor,
} from '../components/application/apps/terminal/TerminalInput';
import { useScrollbar, ScrollbarTrack, ScrollbarThumb } from './useScrollbar';

export { ScrollbarTrack, ScrollbarThumb };

// --- Constants ------------------------------------------------------------

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const MAX_DELTA = 100;

const _defaultCellSize: NTerminalApp.ICellSize = {
  width: 8,
  height: 14,
};

// --- Hook -----------------------------------------------------------------

export interface IUseCanvasTerminalOpts {
  cellSize?: NTerminalApp.ICellSize;
  onRender: (
    ctx: CanvasRenderingContext2D,
    opts: {
      buffer: NTerminalApp.TCell[][];
      virtualBufferRanges: number[][];
      scrollOffset: number;
      gridSize: NTerminalApp.IGridSize;
    },
  ) => void;
  /** called after resize applies – use to re-scroll or rebuild ranges */
  onResize?: (gridSize: NTerminalApp.IGridSize) => void;
}

export interface IUseCanvasTerminalReturn {
  /* Refs every consumer needs */
  canvasRef: React.RefObject<HTMLCanvasElement>;
  termBuffer: React.MutableRefObject<TerminalBuffer>;
  gridSize: React.MutableRefObject<NTerminalApp.IGridSize>;
  scrollOffset: React.MutableRefObject<number>;
  pendingResizeRef: React.MutableRefObject<{ w: number; h: number } | null>;
  /** push data to the buffer and rebuild ranges */
  pushData: (
    data: NTerminalApp.TPushData[][],
    inline?: boolean,
  ) => Promise<void>;
  /** rebuild virtual ranges from current cols */
  updateVR: () => void;
  /** scroll cursor into view */
  scrollIntoCursorView: (virtualRow: number, virtualCol: number) => void;
  /* Wheel + touch scroll handlers (bind to <canvas>) */
  onWheel: (e: React.WheelEvent) => void;
  onTouchStartScroll: (e: React.TouchEvent) => void;
  onTouchMoveScroll: (e: React.TouchEvent) => void;
  touchMoved: React.MutableRefObject<boolean>;
  /** onTouchEnd handler that focuses the hidden input if no scroll happened */
  touchEndFocus: () => void;
  /* Scrollbar */
  scrollbar: ReturnType<typeof useScrollbar>;
  ScrollbarTrack: typeof ScrollbarTrack;
  ScrollbarThumb: typeof ScrollbarThumb;
}

export function useCanvasTerminal(
  opts: IUseCanvasTerminalOpts,
): IUseCanvasTerminalReturn {
  const { onRender, onResize } = opts;
  const cellSize = opts.cellSize ?? _defaultCellSize;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const termBuffer = React.useRef<TerminalBuffer>(
    new TerminalBuffer(cellSize.width, cellSize.height, 1000, 1000),
  );

  const rafRef = React.useRef<number>();
  const lastTimeRef = React.useRef(0);
  const accRef = React.useRef(0);

  const pendingResizeRef = React.useRef<{ w: number; h: number } | null>(null);
  const gridSize = React.useRef<NTerminalApp.IGridSize>({ cols: 0, rows: 0 });
  const scrollOffset = React.useRef(0);

  const scrollbar = useScrollbar({ scrollOffset, clamp: calcScrollTo });

  // -- push / update helpers -----------------------------------------------

  const updateVR = () => {
    termBuffer.current.updateVirtualBufferRanges(gridSize.current.cols);
  };

  const pushData = async (data: NTerminalApp.TPushData[][], inline = false) => {
    await termBuffer.current.pushData(data, inline);
    termBuffer.current.updateVirtualBufferRanges(gridSize.current.cols);
  };

  const scrollIntoCursorView = (virtualRow: number, virtualCol: number) => {
    const newOffset = calcScrollIntoCursor(
      { virtualRow, virtualCol },
      scrollOffset.current,
      gridSize.current.rows,
    );
    if (newOffset !== null) scrollOffset.current = newOffset;
  };

  // -- Resize handling (called from within onUpdate) -----------------------

  const runResize = () => {
    const resize = pendingResizeRef.current;
    pendingResizeRef.current = null;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!resize || !canvas || !parent) return;

    const newGrid = applyResize(canvas, parent, resize, cellSize);
    if (!newGrid) return;

    const prevRows = gridSize.current.rows;
    const colsChanged = newGrid.cols !== gridSize.current.cols;
    gridSize.current = newGrid;

    // Rebuild ranges now that we have real cols (fixes empty-terminal race)
    if (colsChanged) updateVR();

    // On the very first resize (rows just went from 0 to something real) the
    // viewport should start at the top so the initial content is visible.
    // A regular clamp would push us to the middle when content > viewport.
    if (prevRows === 0 && newGrid.rows > 0) {
      scrollOffset.current = 0;
    } else {
      // Clamp scroll
      scrollOffset.current = calcScrollBy(
        0,
        0,
        termBuffer.current.virtualBufferRanges.length,
        gridSize.current.rows,
        scrollOffset.current,
      );
    }

    onResize?.(newGrid);
  };

  // -- Scroll helpers (wheel + touch) --------------------------------------

  const lastTouchY = React.useRef(0);
  const touchAccum = React.useRef(0);
  const touchMoved = React.useRef(false);

  const onWheel = (e: React.WheelEvent) => {
    scrollOffset.current = calcScrollBy(
      e.deltaY,
      1,
      termBuffer.current.virtualBufferRanges.length,
      gridSize.current.rows,
      scrollOffset.current,
    );
  };

  const onTouchStartScroll = (e: React.TouchEvent) => {
    lastTouchY.current = e.touches[0].clientY;
    touchAccum.current = 0;
    touchMoved.current = false;
  };

  const onTouchMoveScroll = (e: React.TouchEvent) => {
    const deltaY = lastTouchY.current - e.touches[0].clientY;
    lastTouchY.current = e.touches[0].clientY;
    touchAccum.current += deltaY;
    if (Math.abs(deltaY) > 5) touchMoved.current = true;

    const threshold = 12;
    const cells = Math.floor(Math.abs(touchAccum.current) / threshold);
    if (cells > 0) {
      const dir = touchAccum.current > 0 ? 1 : -1;
      scrollOffset.current = calcScrollBy(
        dir,
        cells,
        termBuffer.current.virtualBufferRanges.length,
        gridSize.current.rows,
        scrollOffset.current,
      );
      touchAccum.current -= dir * cells * threshold;
    }
  };

  const touchEndFocus = () => {
    if (!touchMoved.current) {
      canvasRef.current?.focus();
    }
  };

  // -- Render loop ---------------------------------------------------------

  React.useEffect(() => {
    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;

      let delta = time - lastTimeRef.current;
      lastTimeRef.current = time;
      delta = Math.min(delta, MAX_DELTA);
      accRef.current += delta;

      while (accRef.current >= FRAME_TIME) {
        accRef.current -= FRAME_TIME;
        onUpdate(FRAME_TIME);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const onUpdate = (delta: number) => {
      runResize();

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      const buf = termBuffer.current.buffer;
      const vRanges = termBuffer.current.virtualBufferRanges;

      // Safety: rebuild ranges if they went empty while data exists
      if (buf.length > 0 && !vRanges.length) {
        updateVR();
      }

      onRender(ctx, {
        buffer: buf,
        virtualBufferRanges: vRanges,
        scrollOffset: scrollOffset.current,
        gridSize: gridSize.current,
      });

      scrollbar.update(vRanges.length, gridSize.current.rows);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // -- Resize observer -----------------------------------------------------

  React.useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return () => {};

    const obs = new ResizeObserver(() => {
      pendingResizeRef.current = {
        w: parent.clientWidth,
        h: parent.clientHeight,
      };
    });
    obs.observe(parent);
    return () => obs.disconnect();
  }, []);

  // -- Return --------------------------------------------------------------

  return {
    canvasRef,
    termBuffer,
    gridSize,
    scrollOffset,
    pendingResizeRef,
    pushData,
    updateVR,
    scrollIntoCursorView,
    onWheel,
    onTouchStartScroll,
    onTouchMoveScroll,
    touchMoved,
    touchEndFocus,
    scrollbar,
    ScrollbarTrack,
    ScrollbarThumb,
  };
}
