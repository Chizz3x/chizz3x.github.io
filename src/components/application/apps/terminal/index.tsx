import React from 'react';
import styled from 'styled-components';
import {
	AppItem,
	Application,
	NApplication,
} from '../../application';
import { MouseButton } from '../../../../const';

export class TerminalApp extends AppItem {
	index = 1;
	icon = '/logo.png';
	title = 'Chizz3x';
	aid = '1';

	constructor(
		destroyDB: NApplication.IProps['onClose'],
	) {
		super(destroyDB);
	}

	build() {
		this.Application = (
			<Application
				key={this.aid || '0'}
				aid={this.aid || '0'}
				title={this.title || 'unknown'}
				icon={this.icon}
				onClose={this.destroy}
			>
				<TerminalPage />
			</Application>
		);
		return this.Application;
	}

	destroy = () => {
		delete this.Application;
		this._destroyCB?.(this.aid);
	};

	setIndex(index: number) {
		this.index = index;
	}
}

// Fuck it, 60fps, real smooth
const FPS = 60;
const FRAME_TIME = 1000 / FPS;
const CURSOR_BLINK_FPS = 1;
const CURSOR_BLINK_INTERVAL =
	1000 / CURSOR_BLINK_FPS;

const cellSize: NTerminalApp.ICellSize = {
	width: 8,
	height: 14,
};
const maxRow = 1000;
const maxBuffer = 1000;

//! Absolute ref hellhole but trust me, it works!
// If you know a better way to perform consistent canvas rendering without any libs, let me know ;P
const TerminalPage = () => {
	const canvasRef =
		React.useRef<HTMLCanvasElement>(null);
	const buffer = React.useRef<
		NTerminalApp.TCell[][]
	>([[]]);
	React.useEffect(() => {
		buffer.current = Array.from({
			length: 100,
		}).map((_, i) =>
			i
				.toString()
				.split('')
				.map((m) => ({ type: 'char', value: m })),
		);
	}, []);

	const rafRef = React.useRef<number>();
	const lastTimeRef = React.useRef<number>(0);
	const accRef = React.useRef<number>(0);
	const pendingResizeRef = React.useRef<{
		w: number;
		h: number;
	} | null>(null);

	const gridSize =
		React.useRef<NTerminalApp.IGridSize>({
			cols: 0,
			rows: 0,
		});
	const scrollRow = React.useRef(0);
	const cursor =
		React.useRef<NTerminalApp.TCursor>({
			row: 0,
			col: 0,
		});
	// Highlights
	const highlight = React.useRef<{
		start: NTerminalApp.TCursor;
		end: NTerminalApp.TCursor;
	} | null>(null);
	const highlightStartRef =
		React.useRef<NTerminalApp.TCursor | null>(
			null,
		);
	const blinkAccRef = React.useRef(0);
	const cursorVisible = React.useRef(true);

	// Insert character and wrap if necessary
	const insertChar = (
		ch: string,
		locked = false,
	) => {
		const row =
			buffer.current[buffer.current.length - 1];
		if (row.length >= maxRow) return;
		const cell = row[cursor.current.col];
		if (cell?.type === 'char' && cell?.locked)
			return;

		row.push({
			type: 'char',
			value: ch,
			locked,
		});
	};

	// Backspace with permanent check
	const backspace = () => {
		const row =
			buffer.current[buffer.current.length - 1];
		const cell = row[row.length - 1];
		if (!cell) return;
		if (cell.type === 'char' && !cell.locked) {
			buffer.current[
				buffer.current.length - 1
			].pop();
		}
	};

	const newLine = () => {
		buffer.current.push([]);
		if (buffer.current.length > maxBuffer)
			buffer.current.shift();
	};

	// Mouse highlight helpers
	const getCursorFromMouse = (
		e: React.MouseEvent,
	) => {
		const rect =
			canvasRef.current?.getBoundingClientRect();
		if (rect) {
			const col = Math.floor(
				(e.clientX - rect.left) / cellSize.width,
			);
			const row = Math.floor(
				(e.clientY - rect.top) / cellSize.height,
			);
			return {
				row: row + scrollRow.current,
				col,
			};
		}
		return {
			row: 0,
			col: 0,
		};
	};

	const removeHighlight = () => {
		highlight.current = null;
	};

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button === MouseButton.Left) {
			const pos = getCursorFromMouse(e);
			highlightStartRef.current = pos;
			highlight.current = {
				start: pos,
				end: pos,
			};
		}
		if (e.button === MouseButton.Right) {
			removeHighlight();
		}
	};

	const onMouseMove = (e: React.MouseEvent) => {
		if (!highlightStartRef.current) return;
		const pos = getCursorFromMouse(e);
		if (
			(pos.row ===
				highlightStartRef.current.row &&
				pos.col <
					highlightStartRef.current.col) ||
			pos.row < highlightStartRef.current.row
		) {
			highlight.current = {
				start: pos,
				end: highlightStartRef.current || pos,
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

	const onWheel = (e: React.WheelEvent) => {
		scrollRow.current = Math.max(
			0,
			Math.min(
				buffer.current.length +
					Math.floor(gridSize.current.rows / 2) -
					gridSize.current.rows,
				scrollRow.current +
					(e.deltaY > 0 ? 1 : -1),
			),
		);
	};

	const getCursorPosition = () => {
		// Complicated, but comfortable. Now cursor always stays where text can be typed.
		// TODO: Take into account scrolling, will reduce computation time.
		return {
			row: buffer.current.reduce(
				(p, c) =>
					p +
					Math.floor(
						c.length / gridSize.current.cols,
					),
				buffer.current.length - 1,
			),
			col:
				buffer.current[buffer.current.length - 1]
					.length % gridSize.current.cols,
		};
	};

	const renderCanvas = () => {
		if (!canvasRef.current) return;
		const ctx =
			canvasRef.current.getContext('2d');
		if (!ctx) return;

		cursor.current = getCursorPosition();

		ctx.clearRect(
			0,
			0,
			ctx.canvas.width,
			ctx.canvas.height,
		);
		ctx.font = '14px Consolas';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		let readPos = {
			row: scrollRow.current,
			col: 0,
		};

		// Draw text and what not
		for (
			let r = 0;
			r < gridSize.current.rows;
			r++
		) {
			const row = buffer.current[readPos.row];
			if (!row) continue;
			for (
				let c = 0;
				c < gridSize.current.cols;
				c++
			) {
				const cell = row[readPos.col];
				if (!cell) {
					readPos = {
						row: readPos.row + 1,
						col: 0,
					};
					break;
				}
				if (cell.type === 'char') {
					const x =
						c * cellSize.width +
						cellSize.width / 2;
					const y =
						r * cellSize.height +
						cellSize.height / 2;
					ctx.fillStyle = cell.color || '#fff';
					ctx.fillText(cell.value, x, y);

					readPos = {
						row: readPos.row,
						col: readPos.col + 1,
					};
				}
				if (cell.type === 'pixels') {
					// TODO: Draw individual pixels in a call for images usually.
				}
			}
		}

		// Draw highlight
		if (highlight.current) {
			ctx.fillStyle = 'rgba(0,0,255,0.3)';
			const startRow =
				highlight.current.start.row;
			const startCol =
				highlight.current.start.col;
			const endRow = highlight.current.end.row;
			const endCol = highlight.current.end.col;
			for (
				let r = Math.min(startRow, endRow);
				r <= Math.max(startRow, endRow);
				r++
			) {
				const rowStart =
					r === startRow ? startCol : 0;
				const rowEnd =
					r === endRow
						? endCol
						: gridSize.current.cols - 1;
				const visR = r - scrollRow.current;
				if (
					visR < 0 ||
					visR >= gridSize.current.rows
				)
					continue;
				ctx.fillRect(
					rowStart * cellSize.width,
					visR * cellSize.height,
					(rowEnd - rowStart + 1) *
						cellSize.width,
					cellSize.height,
				);
			}
		}

		// Draw cursor
		if (cursorVisible.current) {
			const visRow =
				cursor.current.row - scrollRow.current;
			if (
				visRow >= 0 &&
				visRow < gridSize.current.rows &&
				cursor.current.col < gridSize.current.cols
			) {
				ctx.strokeStyle = '#f00';
				ctx.strokeRect(
					cursor.current.col * cellSize.width,
					visRow * cellSize.height,
					cellSize.width,
					cellSize.height,
				);
			}
		}
	};

	// Performs canvas resize based on parent if needed
	const applyResizeIfNeeded = () => {
		const resize = pendingResizeRef.current;
		const parent =
			canvasRef.current?.parentElement;
		if (!resize || !canvasRef.current || !parent)
			return;

		canvasRef.current.width = resize.w;
		canvasRef.current.height = resize.h;

		canvasRef.current.style.width = `${parent.clientWidth}px`;
		canvasRef.current.style.height = `${parent.clientHeight}px`;

		gridSize.current = {
			cols: Math.floor(resize.w / cellSize.width),
			rows: Math.floor(
				resize.h / cellSize.height,
			),
		};

		pendingResizeRef.current = null;
	};

	// Keyboard input
	React.useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (
				e.key.length === 1 &&
				!e.ctrlKey &&
				!e.metaKey
			) {
				insertChar(e.key);
				e.preventDefault();
			}
			if (e.key === 'Enter') {
				if (!highlight.current) newLine();
				e.preventDefault();
			}
			if (e.key === 'Backspace') {
				backspace();
				e.preventDefault();
			}
			blinkAccRef.current = 0;
			cursorVisible.current = true;
			removeHighlight();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener(
				'keydown',
				onKeyDown,
			);
		};
	}, []);

	// Resize requester
	React.useEffect(() => {
		const parent =
			canvasRef.current?.parentElement;
		if (!parent) return () => {};

		const observer = new ResizeObserver(() => {
			pendingResizeRef.current = {
				w: parent.clientWidth,
				h: parent.clientHeight,
			};
		});

		observer.observe(parent);

		return () => observer.disconnect();
	}, []);

	const onUpdate = (delta: number) => {
		blinkAccRef.current += delta;
		if (
			blinkAccRef.current >= CURSOR_BLINK_INTERVAL
		) {
			blinkAccRef.current -=
				CURSOR_BLINK_INTERVAL;
			cursorVisible.current =
				!cursorVisible.current;
		}

		applyResizeIfNeeded();
		renderCanvas();
	};

	// Main renderer
	React.useEffect(() => {
		const loop = (time: number) => {
			if (!lastTimeRef.current)
				lastTimeRef.current = time;

			const delta = time - lastTimeRef.current;
			lastTimeRef.current = time;
			accRef.current += delta;

			if (accRef.current >= FRAME_TIME) {
				accRef.current -= FRAME_TIME;
				onUpdate(FRAME_TIME);
			}

			rafRef.current =
				requestAnimationFrame(loop);
		};

		rafRef.current = requestAnimationFrame(loop);

		return () => {
			if (rafRef.current)
				cancelAnimationFrame(rafRef.current);
		};
	}, []);

	return (
		<TerminalPageStyle>
			<canvas
				ref={canvasRef}
				className="char-grid"
				onWheel={onWheel}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				onMouseUp={onMouseUp}
				onContextMenu={(e) => e.preventDefault()}
			/>
		</TerminalPageStyle>
	);
};

export namespace NTerminalApp {
	export interface IGridSize {
		cols: number;
		rows: number;
	}
	export interface ICellSize {
		width: number;
		height: number;
	}
	export type TCell =
		| {
				type: 'char';
				value: string;
				color?: string;
				locked?: boolean;
		  }
		| { type: 'pixels'; pixels: number[][][] };
	export type TCursor = {
		row: number;
		col: number;
	};
}

const TerminalPageStyle = styled.div`
	flex-grow: 1;
	overflow: hidden;
	.char-grid {
		// Will adjust based on parent resizing if any
		width: 100%;
		height: 100%;
		user-select: none;
	}
`;
