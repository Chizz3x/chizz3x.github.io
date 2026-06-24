import React from 'react';
import styled from 'styled-components';
import { NTerminalApp } from '../terminal/types';
import { renderCanvas } from '../terminal/TerminalRenderer';
import {
  getNotepadContent,
  updateNotepadContent,
} from '../../notepad-registry';
import {
  useCanvasTerminal,
  ScrollbarTrack,
  ScrollbarThumb,
} from '../../../../hooks/useCanvasTerminal';
import {
  useHiddenInput,
  skipIfInputFocused,
} from '../../../../hooks/useHiddenInput';

// --- Component ------------------------------------------------------------

interface NotepadPageProps {
  filename: string;
  initialContent?: string;
}

const NotepadPage = (props: NotepadPageProps) => {
  const { filename, initialContent } = props;

  const init = React.useRef(false);
  const cursorPos = React.useRef({ row: 0, col: 0 });
  const cellSize = { width: 8, height: 14 };

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
      const virtualCursor = termBuffer.current.findVirtualCursor(
        gs.cols,
        cursorPos.current.row,
        cursorPos.current.col,
      );

      renderCanvas(
        ctx,
        buffer,
        virtualBufferRanges,
        so,
        gs,
        cellSize,
        virtualCursor,
        true,
        null,
      );
    },
    onResize: () => {
      scrollIntoCursorViewFromCursor();
    },
  });

  // -- Sync content back to registry --------------------------------------

  const syncContent = () => {
    const text = termBuffer.current.buffer
      .map((row) =>
        row
          .map((c) => (c.type === 'char' || c.type === 'link' ? c.value : ''))
          .join(''),
      )
      .join('\n');
    updateNotepadContent(filename, text);
  };

  // -- Scroll into view from cursor ---------------------------------------

  const scrollIntoCursorViewFromCursor = () => {
    const vc = termBuffer.current.findVirtualCursor(
      gridSize.current.cols,
      cursorPos.current.row,
      cursorPos.current.col,
    );
    scrollIntoCursorView(vc.virtualRow, vc.virtualCol);
  };

  // -- Insert / Backspace / Newline at cursor ------------------------------

  const insertChar = (ch: string) => {
    const { row, col } = cursorPos.current;
    const buf = termBuffer.current.buffer;

    while (buf.length <= row) buf.push([]);
    const targetRow = buf[row];
    if (targetRow.length >= 1000) return;

    targetRow.splice(col, 0, { type: 'char', value: ch } as NTerminalApp.TCell);
    cursorPos.current.col = col + 1;

    updateVR();
    scrollIntoCursorViewFromCursor();
    syncContent();
  };

  const doNewLine = () => {
    const { row, col } = cursorPos.current;
    const buf = termBuffer.current.buffer;

    while (buf.length <= row) buf.push([]);
    const rest = buf[row].splice(col);
    buf.splice(row + 1, 0, rest);
    if (buf.length > 1000) buf.shift();

    cursorPos.current = { row: row + 1, col: 0 };
    updateVR();
    scrollIntoCursorViewFromCursor();
    syncContent();
  };

  const doBackspace = () => {
    const { row, col } = cursorPos.current;
    const buf = termBuffer.current.buffer;

    if (col > 0) {
      buf[row].splice(col - 1, 1);
      cursorPos.current.col = col - 1;
    } else if (row > 0) {
      const prevLen = buf[row - 1].length;
      buf[row - 1].push(...buf[row]);
      buf.splice(row, 1);
      cursorPos.current = { row: row - 1, col: prevLen };
    }

    updateVR();
    scrollIntoCursorViewFromCursor();
    syncContent();
  };

  // -- Arrow navigation ----------------------------------------------------

  const moveCursorLeft = () => {
    if (cursorPos.current.col > 0) {
      cursorPos.current.col--;
    } else if (cursorPos.current.row > 0) {
      cursorPos.current.row--;
      cursorPos.current.col =
        termBuffer.current.buffer[cursorPos.current.row]?.length || 0;
    }
    scrollIntoCursorViewFromCursor();
  };

  const moveCursorRight = () => {
    const buf = termBuffer.current.buffer;
    const row = buf[cursorPos.current.row];
    if (row && cursorPos.current.col < row.length) {
      cursorPos.current.col++;
    } else if (cursorPos.current.row < buf.length - 1) {
      cursorPos.current.row++;
      cursorPos.current.col = 0;
    }
    scrollIntoCursorViewFromCursor();
  };

  const moveCursorUp = () => {
    if (cursorPos.current.row > 0) {
      cursorPos.current.row--;
      const row = termBuffer.current.buffer[cursorPos.current.row];
      if (row && cursorPos.current.col > row.length) {
        cursorPos.current.col = row.length;
      }
    }
    scrollIntoCursorViewFromCursor();
  };

  const moveCursorDown = () => {
    const buf = termBuffer.current.buffer;
    if (cursorPos.current.row < buf.length - 1) {
      cursorPos.current.row++;
      const row = buf[cursorPos.current.row];
      if (row && cursorPos.current.col > row.length) {
        cursorPos.current.col = row.length;
      }
    } else {
      cursorPos.current.row = Math.max(0, buf.length - 1);
      const row = buf[cursorPos.current.row];
      cursorPos.current.col = row?.length || 0;
    }
    scrollIntoCursorViewFromCursor();
  };

  // -- Hidden input --------------------------------------------------------

  const { hiddenInputRef, onFocusInput, inputHandlers } = useHiddenInput({
    onChar: insertChar,
    onEnter: doNewLine,
    onBackspace: doBackspace,
    onArrowLeft: moveCursorLeft,
    onArrowRight: moveCursorRight,
    onArrowUp: moveCursorUp,
    onArrowDown: moveCursorDown,
  });

  // -- Effect: keyboard ----------------------------------------------------

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!init.current) return;
      if (skipIfInputFocused(hiddenInputRef)) return;

      let actionTaken = false;
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        insertChar(e.key);
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'Enter') {
        doNewLine();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'Backspace') {
        doBackspace();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowLeft') {
        moveCursorLeft();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowRight') {
        moveCursorRight();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowUp') {
        moveCursorUp();
        e.preventDefault();
        actionTaken = true;
      } else if (e.key === 'ArrowDown') {
        moveCursorDown();
        e.preventDefault();
        actionTaken = true;
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
      loadInitialContent();
    }
  }, []);

  const loadInitialContent = async () => {
    // Read from registry first — picks up edits from a previous session.
    // Fall back to the static initialContent prop for the first open.
    const existing = getNotepadContent(filename);
    const content = existing ?? initialContent;
    if (content) {
      // Split on newlines so each line becomes its own buffer row
      const lines = content.split('\n');
      const data: NTerminalApp.TPushData[][] = lines.map((line) => [
        { type: 'text', value: line || ' ' },
      ]);
      await pushData(data);
      const buf = termBuffer.current.buffer;
      const lastRow = Math.max(0, buf.length - 1);
      cursorPos.current = { row: lastRow, col: buf[lastRow]?.length || 0 };
    }
    scrollOffset.current = 0;
  };

  // -- Render --------------------------------------------------------------

  return (
    <NotepadPageStyle>
      <canvas
        ref={canvasRef}
        className="char-grid"
        onWheel={onWheel}
        onTouchStart={onTouchStartScroll}
        onTouchMove={onTouchMoveScroll}
        onTouchEnd={() => {
          if (!touchMoved.current) onFocusInput();
        }}
        onMouseDown={onFocusInput}
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
    </NotepadPageStyle>
  );
};

export { NotepadPage };

// --- Styles ---------------------------------------------------------------

const NotepadPageStyle = styled.div`
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
