import React from 'react';
import styled from 'styled-components';
import { NTerminalApp } from './types';
import { renderCanvas } from './TerminalRenderer';
import {
  getCursorFromMouse,
  getHighlightedText,
  getLinkAtCursor,
} from './TerminalInput';
import {
  useCanvasTerminal,
  ScrollbarTrack,
  ScrollbarThumb,
} from '../../../../hooks/useCanvasTerminal';
import {
  useHiddenInput,
  skipIfInputFocused,
} from '../../../../hooks/useHiddenInput';
import { MouseButton } from '../../../../const';
import { NCommandBase } from './command-base';

// --- Constants ------------------------------------------------------------

const CURSOR_BLINK_FPS = 1;
const CURSOR_BLINK_INTERVAL = 1000 / CURSOR_BLINK_FPS;
const MAX_COMMAND_MEMORY = 100;

// --- Component ------------------------------------------------------------

const TerminalPage = (props: NTerminalApp.IProps) => {
  const { newLinePrefix, initData, commands, onAppLaunch } = props;

  // -- Canvas lifecycle ----------------------------------------------------

  const init = React.useRef(false);
  const cursorInputCol = React.useRef(0);
  const prevColsRef = React.useRef(0);
  /** True until the init phase completes and layout has settled. While set,
   *  onResize and submit skip scroll-to-cursor / scroll-to-bottom so the
   *  initial content stays at the top of the viewport. */
  const skipScrollRef = React.useRef(false);

  const {
    canvasRef,
    termBuffer,
    gridSize,
    scrollOffset,
    pushData,
    updateVR,
    scrollIntoCursorView,
    onWheel,
    onTouchStartScroll,
    onTouchMoveScroll,
    touchMoved,
    scrollbar,
  } = useCanvasTerminal({
    onRender: (
      ctx,
      { buffer, virtualBufferRanges, scrollOffset: so, gridSize: gs },
    ) => {
      // Cursor blink
      blinkAccRef.current += FRAME_TIME_HACK;
      while (blinkAccRef.current >= CURSOR_BLINK_INTERVAL) {
        blinkAccRef.current -= CURSOR_BLINK_INTERVAL;
        cursorVisible.current = !cursorVisible.current;
      }

      const virtualCursor = findTerminalCursor(gs.cols);

      renderCanvas(
        ctx,
        buffer,
        virtualBufferRanges,
        so,
        gs,
        cellSize,
        virtualCursor,
        cursorVisible.current,
        highlight.current,
      );
    },
    onResize: (newGrid) => {
      if (newGrid.cols !== prevColsRef.current) {
        removeHighlight();
        prevColsRef.current = newGrid.cols;
      }
      // The hook's runResize already forces scrollOffset to 0 on the very
      // first resize (rows went 0 → non-zero).  But if the terminal has
      // already produced output by then, findVirtualCursor will point at
      // the prompt at the bottom and scrollIntoCursorViewFromEdit would
      // scroll us right back down.  During init we skip that and stay at
      // the top so the banner / initial output is visible.
      if (!skipScrollRef.current) {
        scrollIntoCursorViewFromEdit();
      }
    },
  });

  // HACK: used inside onRender which is captured once. All state it reads
  // must be in refs, so we use a ref for the blink accumulator.
  const FRAME_TIME_HACK = 1000 / 60;
  // Refs for cursor blink + highlight
  const blinkAccRef = React.useRef(0);
  const cursorVisible = React.useRef(true);
  const highlight = React.useRef<{
    start: NTerminalApp.TCursor;
    end: NTerminalApp.TCursor;
  } | null>(null);
  const highlightStartRef = React.useRef<NTerminalApp.TCursor | null>(null);

  // Helper: compute virtual cursor for the terminal command line
  const findTerminalCursor = (cols: number) => {
    const editStart = getEditStart();
    const lastRowIdx = termBuffer.current.buffer.length - 1;
    const bufferCol = editStart >= 0 ? editStart + cursorInputCol.current : 0;
    return termBuffer.current.findVirtualCursor(cols, lastRowIdx, bufferCol);
  };

  const scrollIntoCursorViewFromEdit = () => {
    const vc = findTerminalCursor(gridSize.current.cols);
    scrollIntoCursorView(vc.virtualRow, vc.virtualCol);
  };

  const cellSize = { width: 8, height: 14 };

  // -- Command execution ---------------------------------------------------

  const performAction = async (action: NCommandBase.TAction) => {
    switch (action.name) {
      case 'clear':
        termBuffer.current.buffer = [];
        updateVR();
        break;
      case 'write':
        await pushData(action.data);
        break;
      case 'open':
        onAppLaunch?.(action.aid);
        break;
    }
  };

  const noCommand = async (cmd: string) => {
    await pushData([
      [{ type: 'text', value: `Command '${cmd}' does not exist` }],
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
    await pushData([[{ type: 'text', value: text }]], true);
    await submit();
  };

  // -- Edit helpers --------------------------------------------------------

  /** Index of the first unlocked cell in the last row.
   *  When all cells are locked, returns the row length so the cursor
   *  sits right after the last locked cell. */
  const getEditStart = (): number => {
    const lastRow = termBuffer.current.getLastRow();
    const idx = lastRow.findIndex((c) => !c.locked);
    return idx >= 0 ? idx : lastRow.length;
  };

  const insertChar = (ch: string, locked = false) => {
    const row = termBuffer.current.buffer[termBuffer.current.buffer.length - 1];
    if (row.length >= 1000) return;
    const editStart = getEditStart();
    if (locked) {
      row.push({ type: 'char', value: ch, locked });
    } else {
      const insCol = editStart + cursorInputCol.current;
      row.splice(insCol, 0, { type: 'char', value: ch, locked: false });
      cursorInputCol.current++;
    }
    scrollIntoCursorViewFromEdit();
  };

  const backspace = () => {
    const editStart = getEditStart();
    if (cursorInputCol.current === 0) return;
    const row = termBuffer.current.buffer[termBuffer.current.buffer.length - 1];
    const delCol = editStart + cursorInputCol.current - 1;
    if (row[delCol] && !row[delCol].locked) {
      row.splice(delCol, 1);
      cursorInputCol.current--;
    }
    scrollIntoCursorViewFromEdit();
  };

  // -- Command memory ------------------------------------------------------

  const commandMemory = React.useRef<string[]>([]);
  const commandMemoryIndex = React.useRef(-1);

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
    } else if (commandMemoryIndex.current < commandMemory.current.length - 1) {
      commandMemoryIndex.current++;
    } else {
      return;
    }

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
    // Place cursor at the end of the loaded command text
    cursorInputCol.current =
      commandMemory.current[commandMemoryIndex.current]?.length ?? 0;
    scrollIntoCursorViewFromEdit();
  };

  // -- New line prep -------------------------------------------------------

  const newLinePrep = async (doNewLine = true) => {
    if (newLinePrefix) {
      await pushData(
        [[{ type: 'text', value: newLinePrefix, locked: true, color: 'aqua' }]],
        !doNewLine,
      );
    }
  };

  const pushInitData = async () => {
    if (initData) {
      await pushData(initData);
    }
  };

  // -- Submit --------------------------------------------------------------

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
    if (termBuffer.current.buffer.length > 1000)
      termBuffer.current.buffer.shift();

    cursorInputCol.current = 0;
    newLinePrep(doNewLine);
    if (!skipScrollRef.current) {
      // Rebuild virtual ranges so they include the new prompt row, then
      // scroll so the prompt sits at the bottom of the viewport.
      updateVR();
      const lastVR = termBuffer.current.virtualBufferRanges.length - 1;
      scrollOffset.current = Math.max(0, lastVR - gridSize.current.rows + 1);
    }
  };

  // -- Init ----------------------------------------------------------------

  const doInit = async () => {
    skipScrollRef.current = true;
    await pushInitData();
    await newLinePrep();
    await autoTypeAndSubmit('whoami');
    // Allow normal scroll behavior from now on.  The hook's runResize
    // already forces scrollOffset to 0 on the first resize, so we're
    // still at the top after layout settles.
    skipScrollRef.current = false;
  };

  // -- Mouse handling ------------------------------------------------------

  const removeHighlight = () => {
    highlight.current = null;
  };

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
      highlight.current = { start: pos, end: pos };
    }
    if (e.button === MouseButton.Right) highlight.current = null;
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
      highlight.current = { start: pos, end: highlightStartRef.current };
    } else {
      highlight.current = { start: highlightStartRef.current, end: pos };
    }
  };

  const onMouseUp = () => {
    highlightStartRef.current = null;
  };

  const onDoubleClickLink = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursor = getCursorFromMouse(
      e.clientX,
      e.clientY,
      rect,
      scrollOffset.current,
      cellSize,
    );
    const url = getLinkAtCursor(
      cursor,
      termBuffer.current.buffer,
      termBuffer.current.virtualBufferRanges,
    );
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  // -- Hidden input --------------------------------------------------------

  const { hiddenInputRef, onFocusInput, inputHandlers } = useHiddenInput({
    onChar: (ch) => {
      commandMemoryIndex.current = -1;
      insertChar(ch);
    },
    onEnter: () => {
      commandMemoryIndex.current = -1;
      if (!highlight.current) submit();
    },
    onBackspace: () => {
      commandMemoryIndex.current = -1;
      backspace();
    },
    onArrowLeft: () => {
      if (cursorInputCol.current > 0) cursorInputCol.current--;
    },
    onArrowRight: () => {
      const editStart = getEditStart();
      const lastRow = termBuffer.current.getLastRow();
      if (editStart >= 0) {
        const unlockedLength =
          lastRow.length - lastRow.filter((c) => c.locked).length;
        if (cursorInputCol.current < unlockedLength) cursorInputCol.current++;
      }
    },
  });

  // -- Effect: keyboard ----------------------------------------------------

  React.useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      if (!init.current) return;
      if (skipIfInputFocused(hiddenInputRef)) return;

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
      } else if (e.key === 'ArrowLeft') {
        if (cursorInputCol.current > 0) cursorInputCol.current--;
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowRight') {
        const editStart = getEditStart();
        const lastRow = termBuffer.current.getLastRow();
        if (editStart >= 0) {
          const unlockedLength =
            lastRow.length - lastRow.filter((c) => c.locked).length;
          if (cursorInputCol.current < unlockedLength) cursorInputCol.current++;
        }
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowUp') {
        await readCommandMemory(1);
      } else if (e.key === 'ArrowDown') {
        await readCommandMemory(-1);
      }

      blinkAccRef.current = 0;
      cursorVisible.current = true;

      if (e.ctrlKey && e.key?.toLowerCase() === 'c') {
        const text = getHighlightedText(
          termBuffer.current.buffer,
          termBuffer.current.virtualBufferRanges,
          highlight.current,
        );
        navigator.clipboard.writeText(text);
        removeHighlight();
      } else {
        removeHighlight();
      }

      if (actionTaken) updateVR();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // -- Effect: init --------------------------------------------------------

  React.useEffect(() => {
    if (!init.current) {
      init.current = true;
      doInit();
    }
  }, []);

  // -- Render --------------------------------------------------------------

  const lastTouchY = React.useRef(0);
  const touchAccum = React.useRef(0);

  return (
    <TerminalPageStyle>
      <canvas
        ref={canvasRef}
        className="char-grid"
        onWheel={onWheel}
        onTouchStart={onTouchStartScroll}
        onTouchMove={onTouchMoveScroll}
        onTouchEnd={() => {
          if (!touchMoved.current) onFocusInput();
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={onDoubleClickLink}
        onContextMenu={(e) => e.preventDefault()}
      />
      <input
        ref={hiddenInputRef}
        className="hidden-input"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        onInput={inputHandlers.onInput}
        onKeyDown={inputHandlers.onKeyDown}
        onBlur={inputHandlers.onBlur}
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

// --- Styles ---------------------------------------------------------------

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
  .hidden-input {
    position: absolute;
    left: -9999px;
    top: -9999px;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
`;
