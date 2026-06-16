import { NTerminalApp } from './types';

// ─── applyResize ──────────────────────────────────────────────────────────

export interface IPendingResize {
  w: number;
  h: number;
}

/**
 * Apply a pending canvas resize if the dimensions actually changed.
 * Returns the new grid size, or null if nothing changed.
 */
export function applyResize(
  canvas: HTMLCanvasElement,
  parent: HTMLElement,
  pendingResize: IPendingResize,
  cellSize: NTerminalApp.ICellSize,
): NTerminalApp.IGridSize | null {
  if (canvas.width === pendingResize.w && canvas.height === pendingResize.h) {
    return null;
  }

  canvas.width = pendingResize.w;
  canvas.height = pendingResize.h;
  canvas.style.width = `${parent.clientWidth}px`;
  canvas.style.height = `${parent.clientHeight}px`;

  return {
    cols: Math.floor(pendingResize.w / cellSize.width),
    rows: Math.floor(pendingResize.h / cellSize.height),
  };
}

// ─── renderCanvas ─────────────────────────────────────────────────────────

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  buffer: NTerminalApp.TCell[][],
  virtualBufferRanges: number[][],
  scrollOffset: number,
  gridSize: NTerminalApp.IGridSize,
  cellSize: NTerminalApp.ICellSize,
  virtualCursor: {
    virtualRow: number;
    virtualCol: number;
  } | null,
  cursorVisible: boolean,
  highlight: {
    start: NTerminalApp.TCursor;
    end: NTerminalApp.TCursor;
  } | null,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.font = '14px Consolas';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const first = scrollOffset;
  const last = first + gridSize.rows;

  const visibleRanges = virtualBufferRanges.slice(first, last);

  // Draw highlight
  if (highlight) {
    const a = highlight.start;
    const b = highlight.end;

    const startVR = Math.min(a.row, b.row);
    const endVR = Math.max(a.row, b.row);

    ctx.fillStyle = 'rgba(0,0,255,0.5)';

    for (let vr = startVR; vr <= endVR; vr++) {
      const screenRow = vr - scrollOffset;
      if (screenRow < 0 || screenRow >= gridSize.rows) continue;

      let startCol = 0;
      let endCol = gridSize.cols - 1;

      if (vr === a.row) startCol = a.col;
      if (vr === b.row) endCol = b.col;

      ctx.fillRect(
        startCol * cellSize.width,
        screenRow * cellSize.height,
        (endCol - startCol + 1) * cellSize.width,
        cellSize.height,
      );
    }
  }

  // Draw cells
  for (let r = 0; r < visibleRanges.length; r++) {
    const [bufferRow, startCol, length] = visibleRanges[r];
    const row = buffer[bufferRow];
    if (!row) continue;

    for (let c = 0; c < length; c++) {
      const cell = row[startCol + c];
      if (!cell) continue;

      if (cell.type === 'char') {
        const x = c * cellSize.width + cellSize.width / 2;
        const y = r * cellSize.height + cellSize.height / 2;

        if (cell.backgroundColor) {
          ctx.fillStyle = cell.backgroundColor || '#000';
          ctx.fillRect(
            c * cellSize.width,
            r * cellSize.height,
            cellSize.width,
            cellSize.height,
          );
        }
        if (cell.color === 'inverse') {
          ctx.globalCompositeOperation = 'difference';
          ctx.fillStyle = '#fff';
          ctx.fillText(cell.value, x, y);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ctx.fillStyle = cell.color || '#fff';
          ctx.fillText(cell.value, x, y);
        }
      } else if (cell.type === 'pixels') {
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(cell.value, c * cellSize.width, r * cellSize.height);
        ctx.globalCompositeOperation = 'source-over';
        if (cell.char) {
          const x = c * cellSize.width + cellSize.width / 2;
          const y = r * cellSize.height + cellSize.height / 2;
          if (!cell.charColor || cell.charColor === 'inverse')
            ctx.globalCompositeOperation = 'difference';
          ctx.fillStyle = cell.charColor || '#fff';
          ctx.fillText(cell.char, x, y);
          if (!cell.charColor || cell.charColor === 'inverse')
            ctx.globalCompositeOperation = 'source-over';
        }
      }
    }
  }

  // Draw cursor
  if (virtualCursor && cursorVisible) {
    const screenRow = virtualCursor.virtualRow - scrollOffset;

    if (screenRow >= 0 && screenRow < gridSize.rows) {
      ctx.strokeStyle = '#f00';
      ctx.strokeRect(
        virtualCursor.virtualCol * cellSize.width,
        screenRow * cellSize.height,
        cellSize.width,
        cellSize.height,
      );
    }
  }
}
