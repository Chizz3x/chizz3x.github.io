import { NTerminalApp } from './types';
import toIndexRanges from '../../../../utils/toIndexRanges';
import normalizeRgba from '../../../../utils/normalize-rgba';
import imageToPixelGrid from '../../../../utils/image-to-pixel-grid';
import buildProgressCell from '../../../../utils/build-progress-cell';

/**
 * Manages the terminal cell buffer and virtual row mapping.
 *
 * The buffer is a flat list of "real" rows (TCell[]), each containing
 * characters and pixel-cell content. Because real rows can be wider than
 * the terminal canvas, virtualBufferRanges maps each real row onto one
 * or more virtual (screen-width) rows.
 */
export class TerminalBuffer {
  readonly cellWidth: number;
  readonly cellHeight: number;
  readonly maxRow: number;
  readonly maxBuffer: number;

  buffer: NTerminalApp.TCell[][] = [];
  virtualBufferRanges: number[][] = []; // [realRow, startCol, length][]

  constructor(
    cellWidth: number,
    cellHeight: number,
    maxRow: number,
    maxBuffer: number,
  ) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.maxRow = maxRow;
    this.maxBuffer = maxBuffer;
  }

  // Convenience helpers ---------------------------------------------------

  get rowCount(): number {
    return this.buffer.length;
  }

  getLastRow(): NTerminalApp.TCell[] {
    return this.buffer[this.buffer.length - 1] ?? [];
  }

  // --- pushData ----------------------------------------------------------

  /**
   * First row of data is always appended to the last existing row;
   * subsequent rows create new lines.
   */
  async pushData(
    data: NTerminalApp.TPushData[][],
    inline = false,
  ): Promise<void> {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const bufferData: NTerminalApp.TCell[][] = [[]];

      for (const part of row) {
        if (part.type === 'text') {
          bufferData[bufferData.length - 1].push(
            ...part.value.split('').map(
              (m) =>
                ({
                  type: 'char',
                  value: m,
                  color: part.color,
                  backgroundColor: part.backgroundColor,
                  locked: part.locked,
                }) as NTerminalApp.TCell,
            ),
          );
        } else if (part.type === 'pixels') {
          bufferData[bufferData.length - 1].push({
            ...part,
            value: await createImageBitmap(
              new ImageData(
                normalizeRgba(part.value, this.cellWidth, this.cellHeight),
                this.cellWidth,
                this.cellHeight,
              ),
            ),
          });
        } else if (part.type === 'image') {
          const cells = await imageToPixelGrid(
            part.value,
            this.cellWidth,
            this.cellHeight,
          );
          for (let r = 0; r < cells.rows; r++) {
            const rowData = await Promise.all(
              cells.chunks
                .slice(r * cells.cols, (r + 1) * cells.cols)
                .map<any>(async (m) => ({
                  type: 'pixels',
                  value: await createImageBitmap(
                    new ImageData(
                      normalizeRgba(m, this.cellWidth, this.cellHeight),
                      this.cellWidth,
                      this.cellHeight,
                    ),
                  ),
                  locked: part.locked,
                })),
            );
            if (r === 0) bufferData[bufferData.length - 1].push(...rowData);
            else bufferData.push(rowData);
          }
        } else if (part.type === 'progress') {
          for (let c = 0; c < part.length; c++) {
            let char: string | undefined;

            if (part.text) {
              switch (part.textAlign) {
                case 'middle':
                  char =
                    part.text[
                      c -
                        Math.floor(part.length / 2) +
                        Math.floor(part.text.length / 2)
                    ];
                  break;
                case 'right':
                  char = part.text[c - part.length + part.text.length];
                  break;
                case 'left':
                default:
                  char = part.text[c];
                  break;
              }
            }

            bufferData[bufferData.length - 1].push({
              type: 'pixels',
              value: await createImageBitmap(
                new ImageData(
                  buildProgressCell({
                    length: part.length,
                    value: part.value,
                    cellIndex: c,
                    width: this.cellWidth,
                    height: this.cellHeight,
                    color: part.color,
                    backgroundColor: part.backgroundColor,
                    border: 'all',
                  }),
                  this.cellWidth,
                  this.cellHeight,
                ),
              ),
              locked: part.locked,
              char,
              charColor: part.textColor,
            });
          }
        }
      }

      if (inline && i === 0) {
        this.buffer[this.buffer.length - 1].push(...bufferData[0]);
        this.buffer.push(...bufferData.slice(1));
      } else {
        this.buffer.push(...bufferData);
      }
    }
  }

  // --- updateVirtualBufferRanges -----------------------------------------

  /**
   * Rebuild the virtual-buffer-range mapping based on current grid cols.
   * Call whenever the grid column count changes or the buffer is mutated.
   */
  updateVirtualBufferRanges(cols: number): void {
    this.virtualBufferRanges = [];

    if (cols <= 0) return;

    if (this.buffer.length === 0) {
      this.virtualBufferRanges.push([0, 0, 0]);
      return;
    }

    for (let br = 0; br < this.buffer.length; br++) {
      const row = this.buffer[br];

      if (!row || row.length === 0) {
        this.virtualBufferRanges.push([br, 0, 0]);
        continue;
      }

      const ranges = toIndexRanges(row.length, cols);
      for (let i = 0; i < ranges.length; i++) {
        const [start, length] = ranges[i];
        this.virtualBufferRanges.push([br, start, length]);
      }
    }
  }

  // --- clearLine ---------------------------------------------------------

  /**
   * Soft: remove only unlocked (editable) cells from the last row.
   * Hard: clear the entire last row.
   */
  clearLine(soft = true): void {
    if (this.buffer.length === 0) return;
    const lastIdx = this.buffer.length - 1;
    if (soft) {
      this.buffer[lastIdx] = this.buffer[lastIdx].filter((f) => f.locked);
    } else {
      this.buffer[lastIdx] = [];
    }
  }

  // --- cursor helpers ----------------------------------------------------

  /** Return the real (buffer) cursor position — end of last row. */
  getCursorPosition(): {
    bufferRow: number;
    bufferCol: number;
  } {
    return {
      bufferRow: Math.max(0, this.buffer.length - 1),
      bufferCol: this.buffer[this.buffer.length - 1]?.length || 0,
    };
  }

  /**
   * Map a real (bufferRow, bufferCol) position to its virtual
   * (screen-space) row/col given the current grid column count.
   */
  findVirtualCursor(cols: number): {
    virtualRow: number;
    virtualCol: number;
  } {
    const { bufferRow, bufferCol } = this.getCursorPosition();

    for (let i = 0; i < this.virtualBufferRanges.length; i++) {
      const [br, start, len] = this.virtualBufferRanges[i];

      if (br !== bufferRow) continue;

      if (bufferCol >= start && bufferCol < start + len) {
        return {
          virtualRow: i,
          virtualCol: bufferCol - start,
        };
      }

      if (bufferCol === start + len) {
        if (len < cols) {
          return {
            virtualRow: i,
            virtualCol: len,
          };
        }

        const next = this.virtualBufferRanges[i + 1];
        if (next && next[0] === bufferRow) {
          return {
            virtualRow: i + 1,
            virtualCol: 0,
          };
        }

        return {
          virtualRow: i + 1,
          virtualCol: 0,
        };
      }
    }

    return {
      virtualRow: this.virtualBufferRanges.length - 1,
      virtualCol: 0,
    };
  }
}
