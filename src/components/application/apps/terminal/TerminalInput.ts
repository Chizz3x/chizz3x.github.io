import { NTerminalApp } from './types';

// ─── Mouse → cursor ───────────────────────────────────────────────────────

export function getCursorFromMouse(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  scrollOffset: number,
  cellSize: NTerminalApp.ICellSize,
): NTerminalApp.TCursor {
  const col = Math.floor((clientX - canvasRect.left) / cellSize.width);
  const row = Math.floor((clientY - canvasRect.top) / cellSize.height);
  return {
    row: row + scrollOffset,
    col,
  };
}

/**
 * Given a cursor position, return the URL of a link cell at that position,
 * or null if there is no link there.
 */
export function getLinkAtCursor(
  cursor: NTerminalApp.TCursor,
  buffer: NTerminalApp.TCell[][],
  virtualBufferRanges: number[][],
): string | null {
  const range = virtualBufferRanges[cursor.row];
  if (!range) return null;

  const [bufferRow, startCol] = range;
  const row = buffer[bufferRow];
  if (!row) return null;

  const cell = row[startCol + cursor.col];
  if (!cell || cell.type !== 'link') return null;

  return cell.url;
}

// ─── Highlight text extraction ────────────────────────────────────────────

export function getHighlightedText(
  buffer: NTerminalApp.TCell[][],
  virtualBufferRanges: number[][],
  highlight: {
    start: NTerminalApp.TCursor;
    end: NTerminalApp.TCursor;
  } | null,
): string {
  if (!highlight) return '';

  const a = highlight.start;
  const b = highlight.end;

  const startVR = Math.min(a.row, b.row);
  const endVR = Math.max(a.row, b.row);

  const lines: string[] = [];

  for (let vr = startVR; vr <= endVR; vr++) {
    const range = virtualBufferRanges[vr];
    if (!range) {
      lines.push('');
      continue;
    }

    const [bufferRow, startIdx, len] = range;
    const row = buffer[bufferRow] || [];

    let from = 0;
    let to = len;

    if (vr === a.row) from = a.col - startIdx;
    if (vr === b.row) to = b.col - startIdx + 1;

    from = Math.max(0, Math.min(from, row.length));
    to = Math.max(from, Math.min(to, row.length));

    const text = row
      .slice(from, to)
      .map((c) => (c.type === 'char' ? c.value : ' '))
      .join('');
    lines.push(text);
  }

  return lines.join('\n');
}

// ─── Scroll helpers ───────────────────────────────────────────────────────

export function scrollBy(
  delta: number,
  cells: number,
  virtualBufferLength: number,
  gridRows: number,
  currentOffset: number,
): number {
  const maxScroll = Math.max(0, virtualBufferLength - Math.round(gridRows / 2));

  return Math.max(
    0,
    Math.min(
      maxScroll,
      currentOffset + (delta > 0 ? 1 : delta < 0 ? -1 : 0) * cells,
    ),
  );
}

export function scrollTo(
  row: number,
  virtualBufferLength: number,
  gridRows: number,
): number {
  const maxScroll = Math.max(0, virtualBufferLength - Math.round(gridRows / 2));

  return Math.max(0, Math.min(maxScroll, row));
}

export function scrollIntoCursorView(
  cursorPosition: {
    virtualRow: number;
    virtualCol: number;
  },
  scrollOffset: number,
  gridRows: number,
): number | null {
  const isBefore = cursorPosition.virtualRow < scrollOffset;
  const isAfter = cursorPosition.virtualRow >= scrollOffset + gridRows;

  if (isAfter) {
    return cursorPosition.virtualRow - gridRows + 1;
  } else if (isBefore) {
    return cursorPosition.virtualRow;
  }

  return null; // no scroll needed
}
