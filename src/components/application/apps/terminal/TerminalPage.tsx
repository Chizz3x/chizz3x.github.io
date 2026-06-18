import React from 'react';
import styled from 'styled-components';
import { NTerminalApp } from './types';
import { TerminalBuffer } from './TerminalBuffer';
import { applyResize, renderCanvas } from './TerminalRenderer';
import {
  getCursorFromMouse,
  getHighlightedText,
  scrollBy as calcScrollBy,
  scrollTo as calcScrollTo,
  scrollIntoCursorView as calcScrollIntoCursor,
} from './TerminalInput';
import {
  useScrollbar,
  ScrollbarTrack,
  ScrollbarThumb,
} from '../../../../hooks/useScrollbar';
import { MouseButton } from '../../../../const';
import { NCommandBase } from './command-base';

// ─── Constants ────────────────────────────────────────────────────────────

const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const CURSOR_BLINK_FPS = 1;
const CURSOR_BLINK_INTERVAL = 1000 / CURSOR_BLINK_FPS;
const MAX_DELTA = 100;
const MAX_COMMAND_MEMORY = 100;

const cellSize: NTerminalApp.ICellSize = {
  width: 8,
  height: 14,
};
const maxRow = 1000;
const maxBuffer = 1000;

// ─── Component ────────────────────────────────────────────────────────────

const TerminalPage = (props: NTerminalApp.IProps) => {
  const { newLinePrefix, initData, commands } = props;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const init = React.useRef(false);

  const termBuffer = React.useRef<TerminalBuffer>(
    new TerminalBuffer(cellSize.width, cellSize.height, maxRow, maxBuffer),
  );
  const commandMemory = React.useRef<string[]>([]);
  const commandMemoryIndex = React.useRef(-1);

  const rafRef = React.useRef<number>();
  const lastTimeRef = React.useRef(0);
  const accRef = React.useRef(0);
  const pendingResizeRef = React.useRef<{
    w: number;
    h: number;
  } | null>(null);

  const gridSize = React.useRef<NTerminalApp.IGridSize>({
    cols: 0,
    rows: 0,
  });
  const scrollOffset = React.useRef(0);

  const scrollbar = useScrollbar({
    scrollOffset,
    clamp: calcScrollTo,
  });

  const highlight = React.useRef<{
    start: NTerminalApp.TCursor;
    end: NTerminalApp.TCursor;
  } | null>(null);
  const highlightStartRef = React.useRef<NTerminalApp.TCursor | null>(null);
  const blinkAccRef = React.useRef(0);
  const cursorVisible = React.useRef(true);

  // Convenience wrapper: push data + rebuild virtual ranges
  const pushData = async (data: NTerminalApp.TPushData[][], inline = false) => {
    await termBuffer.current.pushData(data, inline);
    termBuffer.current.updateVirtualBufferRanges(gridSize.current.cols);
  };

  const updateVR = () => {
    termBuffer.current.updateVirtualBufferRanges(gridSize.current.cols);
  };

  // ── Command execution ─────────────────────────────────────────────

  const performAction = async (action: NCommandBase.TAction) => {
    switch (action.name) {
      case 'clear':
        termBuffer.current.buffer = [];
        updateVR();
        break;
      case 'write':
        await pushData(action.data);
        break;
    }
  };

  const noCommand = async (cmd: string) => {
    await pushData([
      [
        {
          type: 'text',
          value: `Command '${cmd}' does not exist`,
        },
      ],
      [
        {
          type: 'text',
          value: `Use 'help' or 'h' for a list of available commands`,
        },
      ],
    ]);
  };

  const runCommand = async (command: string) => {
    const cmdParts = command.trim().split(/\s+/);
    const firstArg = cmdParts[0].toLowerCase();
    let noData = true;
    if (commands?.has(firstArg)) {
      noData = false;
      const action = commands.get(firstArg)?.execute({
        argStr: cmdParts.slice(1).join(' '),
        buffer: termBuffer.current.buffer,
      });
      if (action) await performAction(action);
    } else if (firstArg) {
      noData = false;
      await noCommand(firstArg);
    }
    return noData;
  };

  const autoTypeAndSubmit = async (text: string) => {
    await pushData(
      [
        [
          {
            type: 'text',
            value: text,
          },
        ],
      ],
      true,
    );
    await submit();
  };

  const submit = async () => {
    const cmdCells = termBuffer.current.getLastRow().filter((f) => !f.locked);
    const cmdText = cmdCells
      .map((m) => (m.type === 'char' ? m.value : ''))
      .join('');

    commandMemory.current.push(cmdText);
    if (commandMemory.current.length > MAX_COMMAND_MEMORY)
      commandMemory.current.shift();

    const noData = await runCommand(
      cmdCells
        .map((m) => m.value)
        .join('')
        .trim(),
    );

    const doNewLine = !!termBuffer.current.rowCount && !noData;

    termBuffer.current.buffer.push([]);
    if (termBuffer.current.buffer.length > maxBuffer)
      termBuffer.current.buffer.shift();

    newLinePrep(doNewLine);
    scrollIntoCursorView();
  };

  // ── Scroll helpers ────────────────────────────────────────────────

  const scrollIntoCursorView = () => {
    const cursorPosition = termBuffer.current.findVirtualCursor(
      gridSize.current.cols,
    );
    const newOffset = calcScrollIntoCursor(
      cursorPosition,
      scrollOffset.current,
      gridSize.current.rows,
    );
    if (newOffset !== null) scrollOffset.current = newOffset;
  };

  const onWheel = (e: React.WheelEvent) => {
    scrollOffset.current = calcScrollBy(
      e.deltaY,
      1,
      termBuffer.current.virtualBufferRanges.length,
      gridSize.current.rows,
      scrollOffset.current,
    );
  };

  const lastTouchY = React.useRef(0);
  const touchAccum = React.useRef(0);

  const onTouchStartScroll = (e: React.TouchEvent) => {
    lastTouchY.current = e.touches[0].clientY;
    touchAccum.current = 0;
  };

  const onTouchMoveScroll = (e: React.TouchEvent) => {
    const deltaY = lastTouchY.current - e.touches[0].clientY;
    lastTouchY.current = e.touches[0].clientY;
    touchAccum.current += deltaY;

    const threshold = 12; // px before scrolling one line
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

  // Scrollbar is handled by the useScrollbar hook (see initialization above)

  // ── Insert / Backspace ───────────────────────────────────────────

  const insertChar = (ch: string, locked = false) => {
    const row = termBuffer.current.buffer[termBuffer.current.buffer.length - 1];
    if (row.length >= maxRow) return;
    row.push({
      type: 'char',
      value: ch,
      locked,
    });
    scrollIntoCursorView();
  };

  const backspace = () => {
    const row = termBuffer.current.buffer[termBuffer.current.buffer.length - 1];
    const cell = row[row.length - 1];
    if (!cell) return;
    if (!cell.locked) {
      termBuffer.current.buffer[termBuffer.current.buffer.length - 1].pop();
    }
    scrollIntoCursorView();
  };

  // ── Command memory ───────────────────────────────────────────────

  const readCommandMemory = async (dir: 1 | -1) => {
    if (!commandMemory.current.length) return;

    if (dir === 1) {
      if (commandMemoryIndex.current === -1)
        commandMemoryIndex.current = commandMemory.current.length - 1;
      else
        commandMemoryIndex.current = Math.max(
          0,
          commandMemoryIndex.current - 1,
        );
      termBuffer.current.clearLine();
      await pushData(
        [
          [
            {
              type: 'text',
              value: commandMemory.current[commandMemoryIndex.current],
            },
          ],
        ],
        true,
      );
    } else if (commandMemoryIndex.current < commandMemory.current.length - 1) {
      commandMemoryIndex.current++;
      termBuffer.current.clearLine();
      await pushData(
        [
          [
            {
              type: 'text',
              value: commandMemory.current[commandMemoryIndex.current],
            },
          ],
        ],
        true,
      );
    }
    scrollIntoCursorView();
  };

  // ── New line prep ────────────────────────────────────────────────

  const newLinePrep = async (doNewLine = true) => {
    if (newLinePrefix) {
      await pushData(
        [
          [
            {
              type: 'text',
              value: newLinePrefix,
              locked: true,
              color: 'aqua',
            },
          ],
        ],
        !doNewLine,
      );
    }
  };

  const pushInitData = async () => {
    if (initData) {
      await pushData(initData);
    }
  };

  // ── Mouse ────────────────────────────────────────────────────────

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.button === MouseButton.Left) {
      const pos = getCursorFromMouse(
        e.clientX,
        e.clientY,
        rect,
        scrollOffset.current,
        cellSize,
      );
      highlightStartRef.current = pos;
      highlight.current = {
        start: pos,
        end: pos,
      };
    }
    if (e.button === MouseButton.Right) {
      highlight.current = null;
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!highlightStartRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = getCursorFromMouse(
      e.clientX,
      e.clientY,
      rect,
      scrollOffset.current,
      cellSize,
    );
    if (
      pos.row < highlightStartRef.current.row ||
      (pos.row === highlightStartRef.current.row &&
        pos.col < highlightStartRef.current.col)
    ) {
      highlight.current = {
        start: pos,
        end: highlightStartRef.current,
      };
    } else {
      highlight.current = {
        start: highlightStartRef.current,
        end: pos,
      };
    }
  };

  const onMouseUp = () => {
    highlightStartRef.current = null;
  };

  const removeHighlight = () => {
    highlight.current = null;
  };

  // ── Render loop update ───────────────────────────────────────────

  const onUpdate = (delta: number) => {
    blinkAccRef.current += delta;
    while (blinkAccRef.current >= CURSOR_BLINK_INTERVAL) {
      blinkAccRef.current -= CURSOR_BLINK_INTERVAL;
      cursorVisible.current = !cursorVisible.current;
    }

    // Check for pending resize
    const resize = pendingResizeRef.current;
    pendingResizeRef.current = null;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (resize && canvas && parent) {
      const newGrid = applyResize(canvas, parent, resize, cellSize);
      if (newGrid) {
        if (newGrid.cols !== gridSize.current.cols) removeHighlight();
        scrollOffset.current = calcScrollBy(
          0,
          0,
          termBuffer.current.virtualBufferRanges.length,
          gridSize.current.rows,
          scrollOffset.current,
        );
        gridSize.current = newGrid;
      }
    }

    // Render
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const virtualCursor = termBuffer.current.findVirtualCursor(
      gridSize.current.cols,
    );

    if (
      termBuffer.current.rowCount > 0 &&
      !termBuffer.current.virtualBufferRanges.length
    ) {
      updateVR();
    }

    renderCanvas(
      ctx,
      termBuffer.current.buffer,
      termBuffer.current.virtualBufferRanges,
      scrollOffset.current,
      gridSize.current,
      cellSize,
      virtualCursor,
      cursorVisible.current,
      highlight.current,
    );

    scrollbar.update(
      termBuffer.current.virtualBufferRanges.length,
      gridSize.current.rows,
    );
  };

  // ── Init ─────────────────────────────────────────────────────────

  const doInit = async () => {
    await pushInitData();
    await newLinePrep();
    await autoTypeAndSubmit('whoami');
    scrollOffset.current = 0;
  };

  // ── Effects ──────────────────────────────────────────────────────

  // Keyboard listener
  React.useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (!init.current) return;

      let actionTaken = false;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        commandMemoryIndex.current = -1;
        insertChar(e.key);
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'Enter') {
        commandMemoryIndex.current = -1;
        if (!highlight.current) await submit();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'Backspace') {
        commandMemoryIndex.current = -1;
        backspace();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowUp') {
        await readCommandMemory(1);
      } else if (e.key === 'ArrowDown') {
        await readCommandMemory(-1);
      }

      blinkAccRef.current = 0;
      cursorVisible.current = true;

      if (e.ctrlKey) {
        if (e.key?.toLowerCase() === 'c') {
          const text = getHighlightedText(
            termBuffer.current.buffer,
            termBuffer.current.virtualBufferRanges,
            highlight.current,
          );
          navigator.clipboard.writeText(text);
          removeHighlight();
        }
      } else {
        removeHighlight();
      }

      if (actionTaken) {
        updateVR();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Resize observer
  React.useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return () => {};

    const parentObserver = new ResizeObserver(() => {
      pendingResizeRef.current = {
        w: parent.clientWidth,
        h: parent.clientHeight,
      };
    });
    parentObserver.observe(parent);

    const canvasObserver = new ResizeObserver(() => {
      updateVR();
    });
    if (canvasRef.current) {
      canvasObserver.observe(canvasRef.current);
    }

    return () => {
      parentObserver.disconnect();
      canvasObserver.disconnect();
    };
  }, []);

  // Render loop
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

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Init
  React.useEffect(() => {
    if (!init.current) {
      init.current = true;
      doInit();
    }
  }, []);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <TerminalPageStyle>
      <canvas
        ref={canvasRef}
        className="char-grid"
        onWheel={onWheel}
        onTouchStart={onTouchStartScroll}
        onTouchMove={onTouchMoveScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <ScrollbarTrack
        ref={scrollbar.trackRef}
        onPointerDown={scrollbar.onTrackPointerDown}
      >
        <ScrollbarThumb ref={scrollbar.thumbRef} />
      </ScrollbarTrack>
    </TerminalPageStyle>
  );
};

export { TerminalPage };

// ─── Styles ───────────────────────────────────────────────────────────────

const TerminalPageStyle = styled.div`
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  .char-grid {
    width: 100%;
    height: 100%;
    user-select: none;
    touch-action: none;
  }
`;
