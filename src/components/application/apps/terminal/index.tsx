import React from 'react';
import styled from 'styled-components';
import {
	AppItem,
	Application,
	NApplication,
} from '../../application';
import { MouseButton } from '../../../../const';
import toIndexRanges from '../../../../utils/toIndexRanges';
import normalizeRgba from '../../../../utils/normalize-rgba';
import imageToPixelGrid from '../../../../utils/image-to-pixel-grid';
import {
	CommandBase,
	NCommandBase,
} from './command-base';
import { CommandWhoAmI } from './commands/whoami';
import { CommandHelp } from './commands/help';
import buildCommand from '../../../../utils/build-command';
import { CommandClear } from './commands/clear';
import buildProgressCell from '../../../../utils/build-progress-cell';

export class TerminalApp extends AppItem {
	index = 1;
	icon = '/logo.png';
	title = 'Chizz3x';
	aid = '1';

	newLinePrefix = '#Chizz3x>';
	initData: NTerminalApp.TPushData[][] = [
		[
			{
				type: 'text',
				value:
					'Welcome to my canvas command line!',
			},
		],
		[],
		[
			{
				type: 'image',
				value: 'banner.png',
			},
		],
		[],
		[
			{
				type: 'text',
				value: 'Basic commands to start with:',
			},
		],
		[
			{
				type: 'text',
				value:
					'> help [h] - Get some help, will ya?',
			},
		],
		[
			{
				type: 'text',
				value:
					'> whoami [wai] - Generic information about me',
			},
		],
		[],
	];
	commands: Map<string, CommandBase> = new Map([
		...buildCommand(
			CommandWhoAmI,
			new CommandWhoAmI(),
		),
		...buildCommand(
			CommandHelp,
			new CommandHelp(),
		),
		...buildCommand(
			CommandClear,
			new CommandClear(),
		),
	]);

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
				<TerminalPage
					newLinePrefix={this.newLinePrefix}
					initData={this.initData}
					commands={this.commands}
				/>
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
const MAX_DELTA = 100;
const MAX_COMMAND_MEMORY = 100;

const cellSize: NTerminalApp.ICellSize = {
	width: 8,
	height: 14,
};
const maxRow = 1000;
const maxBuffer = 1000;

//! Absolute ref hellhole but trust me, it works!
// If you know a better way to perform consistent canvas rendering without any libs, let me know ;P
/** Logic
 * Terminal is rendered in canvas, because things tend to get very laggy very damn fast with bunch of html dynamic elements.
 * cells are calculated per cell size and canvas size.
 * Canvas size is adjusted based on parent size to prevent flickering and artifacts.
 * Consistent 60 fps rendering with no bs.
 * Completed lines are considered as all locked, locked cells are non deletable.
 * Commands are executed based on custom logic, they cna do anything to the terminal, almost.
 */
const TerminalPage = (
	props: NTerminalApp.IProps,
) => {
	const { newLinePrefix, initData, commands } =
		props;

	const canvasRef =
		React.useRef<HTMLCanvasElement>(null);

	const init = React.useRef<boolean>(false);

	const buffer = React.useRef<
		NTerminalApp.TCell[][]
	>([]);
	const commandMemory = React.useRef<string[]>(
		[],
	);
	const commandMemoryIndex = React.useRef(-1);
	const virtualBufferRanges = React.useRef<
		number[][] // [row, start, length][]
	>([]);

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
	const scrollOffset = React.useRef(0);
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

	/**
	 * First row data is always appended to last existing row, others are new lines
	 */
	const pushData = async (
		data: NTerminalApp.TPushData[][],
		inline = false,
	) => {
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			const bufferData: NTerminalApp.TCell[][] = [
				[],
			];
			for (const part of row) {
				if (part.type === 'text') {
					bufferData[bufferData.length - 1].push(
						...part.value.split('').map(
							(m) =>
								({
									type: 'char',
									value: m,
									color: part.color,
									backgroundColor:
										part.backgroundColor,
									locked: part.locked,
								}) as NTerminalApp.TCell,
						),
					);
				} else if (part.type === 'pixels') {
					bufferData[bufferData.length - 1].push({
						...part,
						// Apparently a better way performance wise to pre-create pixels and draw them over canvas parts.
						// Way damn faster though 500x500 starts lagging
						value: await createImageBitmap(
							new ImageData(
								normalizeRgba(
									part.value,
									cellSize.width,
									cellSize.height,
								),
								cellSize.width,
								cellSize.height,
							),
						),
					});
				} else if (part.type === 'image') {
					const cells = await imageToPixelGrid(
						part.value,
						cellSize.width,
						cellSize.height,
					);
					for (let r = 0; r < cells.rows; r++) {
						const rowData = await Promise.all(
							cells.chunks
								.slice(
									r * cells.cols,
									(r + 1) * cells.cols,
								)
								.map<any>(async (m) => ({
									type: 'pixels',
									value: await createImageBitmap(
										new ImageData(
											normalizeRgba(
												m,
												cellSize.width,
												cellSize.height,
											),
											cellSize.width,
											cellSize.height,
										),
									),
									locked: part.locked,
								})),
						);
						if (r === 0)
							bufferData[
								bufferData.length - 1
							].push(...rowData);
						else bufferData.push(rowData);
						// if (inline && r === 0) {
						//	 for (
						//		let c = 0;
						//		c < cells.cols;
						//		c++
						//	 ) {
						//		bufferData[
						//			bufferData.length - 1
						//		].push({
						//			type: 'pixels',
						//			value: await createImageBitmap(
						//				new ImageData(
						//					normalizeRgba(
						//						cells.chunks[
						//							r * cells.cols + c
						//						],
						//						cellSize.width,
						//						cellSize.height,
						//					),
						//					cellSize.width,
						//					cellSize.height,
						//				),
						//			),
						//			locked: part.locked,
						//		});
						//	 }
						// } else {
						//	bufferData.push(
						//		await Promise.all(
						//			cells.chunks
						//				.slice(
						//					r * cells.cols,
						//					(r + 1) * cells.cols,
						//				)
						//				.map(async (m) => ({
						//					type: 'pixels',
						//					value:
						//						await createImageBitmap(
						//							new ImageData(
						//								normalizeRgba(
						//									m,
						//									cellSize.width,
						//									cellSize.height,
						//								),
						//								cellSize.width,
						//								cellSize.height,
						//							),
						//						),
						//					locked: part.locked,
						//				})),
						//		),
						//	);
						// }
					}
				} else if (part.type === 'progress') {
					for (let i = 0; i < part.length; i++) {
						let char: string | undefined;

						if (part.text) {
							switch (part.textAlign) {
								case 'middle':
									// [...text...]
									char =
										part.text[
											i -
												Math.floor(
													part.length / 2,
												) +
												Math.floor(
													part.text.length / 2,
												)
										];
									break;
								case 'right':
									// [......text]
									char =
										part.text[
											i -
												part.length +
												part.text.length
										];
									break;
								case 'left':
								default:
									// [text......]
									char = part.text[i];
									break;
							}
						}

						bufferData[
							bufferData.length - 1
						].push({
							type: 'pixels',
							value: await createImageBitmap(
								new ImageData(
									buildProgressCell({
										length: part.length,
										value: part.value,
										cellIndex: i,
										width: cellSize.width,
										height: cellSize.height,
										color: part.color,
										backgroundColor:
											part.backgroundColor,
										border: 'all',
									}),
									cellSize.width,
									cellSize.height,
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
				buffer.current[
					buffer.current.length - 1
				].push(...bufferData[0]);
				buffer.current.push(
					...bufferData.slice(1),
				);
			} else buffer.current.push(...bufferData);
		}

		updateVirtualBufferRanges();
	};

	const autoTypeAndSubmit = async (
		text: string,
	) => {
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

	const performAction = async (
		action: NCommandBase.TAction,
	) => {
		switch (action.name) {
			case 'clear':
				buffer.current = [];
				updateVirtualBufferRanges();
				break;
			case 'write':
				await pushData(action.data);
				updateVirtualBufferRanges();
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
		if (commands?.has(firstArg)) {
			const action = commands
				?.get(firstArg)
				?.execute({
					argStr: cmdParts.slice(1).join(' '),
					buffer: buffer.current,
				});
			if (action) await performAction(action);
		} else await noCommand(firstArg);
	};

	const scrollIntoCursorView = () => {
		const cursorPosition = getCursorPosition();
		const isCursorBefore =
			cursorPosition.bufferRow <
			scrollOffset.current;
		const isCursorAfter =
			cursorPosition.bufferRow >=
			scrollOffset.current +
				gridSize.current.rows;
		if (isCursorAfter) {
			scrollTo(
				cursorPosition.bufferRow -
					gridSize.current.rows +
					1,
			);
		} else if (isCursorBefore) {
			scrollTo(cursorPosition.bufferRow);
		}
	};

	// Insert character
	const insertChar = (
		ch: string,
		locked = false,
	) => {
		const row =
			buffer.current[buffer.current.length - 1];
		if (row.length >= maxRow) return;

		row.push({
			type: 'char',
			value: ch,
			locked,
		});

		scrollIntoCursorView();
	};

	// Backspace with permanent check
	const backspace = () => {
		const row =
			buffer.current[buffer.current.length - 1];
		const cell = row[row.length - 1];
		if (!cell) return;
		if (!cell.locked) {
			buffer.current[
				buffer.current.length - 1
			].pop();
		}
		scrollIntoCursorView();
	};

	const submit = async () => {
		const cmdCells = buffer.current[
			buffer.current.length - 1
		].filter((f) => !f.locked);
		commandMemory.current.push(
			cmdCells
				.map((m) =>
					m.type === 'char' ? m.value : '',
				)
				.join(''),
		);
		if (
			commandMemory.current.length >
			MAX_COMMAND_MEMORY
		)
			commandMemory.current.shift();

		await runCommand(
			cmdCells
				.map((m) => m.value)
				.join('')
				.trim(),
		);

		const doNewLine = !!buffer.current.length;

		buffer.current.push([]);
		if (buffer.current.length > maxBuffer)
			buffer.current.shift();

		newLinePrep(doNewLine);

		scrollIntoCursorView();
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
				row: row + scrollOffset.current,
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

	const scrollBy = (delta = 0, cells = 0) => {
		const maxScroll = Math.max(
			0,
			virtualBufferRanges.current.length -
				Math.round(gridSize.current.rows / 2),
		);

		scrollOffset.current = Math.max(
			0,
			Math.min(
				maxScroll,
				scrollOffset.current +
					(delta > 0 ? 1 : delta < 0 ? -1 : 0) *
						cells,
			),
		);
	};

	const scrollTo = (row: number) => {
		const maxScroll = Math.max(
			0,
			virtualBufferRanges.current.length -
				Math.round(gridSize.current.rows / 2),
		);

		scrollOffset.current = Math.max(
			0,
			Math.min(maxScroll, row),
		);
	};

	const onWheel = (e: React.WheelEvent) => {
		scrollBy(e.deltaY, 1);
	};

	const getCursorPosition = () => {
		return {
			bufferRow: Math.max(
				0,
				buffer.current.length - 1,
			),
			bufferCol:
				buffer.current[buffer.current.length - 1]
					?.length || 0,
		};
	};

	const findVirtualCursor = () => {
		const { bufferRow, bufferCol } =
			getCursorPosition();
		const { cols } = gridSize.current;

		for (
			let i = 0;
			i < virtualBufferRanges.current.length;
			i++
		) {
			const [br, start, len] =
				virtualBufferRanges.current[i];

			if (br !== bufferRow) continue;

			if (
				bufferCol >= start &&
				bufferCol < start + len
			) {
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

				const next =
					virtualBufferRanges.current[i + 1];
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
			virtualRow:
				virtualBufferRanges.current.length - 1,
			virtualCol: 0,
		};
	};

	const updateVirtualBufferRanges = () => {
		virtualBufferRanges.current = [];

		const { cols } = gridSize.current;
		if (cols <= 0) return;

		if (buffer.current.length === 0) {
			virtualBufferRanges.current.push([0, 0, 0]);
			return;
		}

		for (
			let br = 0;
			br < buffer.current.length;
			br++
		) {
			const row = buffer.current[br];

			if (!row || row.length === 0) {
				virtualBufferRanges.current.push([
					br,
					0,
					0,
				]);
				continue;
			}

			const ranges = toIndexRanges(
				row.length,
				cols,
			);

			for (let i = 0; i < ranges.length; i++) {
				const [start, length] = ranges[i];
				virtualBufferRanges.current.push([
					br,
					start,
					length,
				]);
			}
		}
	};

	const getHighlightedText = () => {
		if (!highlight.current) return '';

		const a = highlight.current.start;
		const b = highlight.current.end;

		const startVR = Math.min(a.row, b.row);
		const endVR = Math.max(a.row, b.row);

		const lines: string[] = [];

		for (let vr = startVR; vr <= endVR; vr++) {
			const range =
				virtualBufferRanges.current[vr];
			if (!range) {
				lines.push('');
				continue;
			}

			const [bufferRow, startIdx, len] = range;
			const row = buffer.current[bufferRow] || [];

			let from = 0;
			let to = len;

			if (vr === a.row) from = a.col - startIdx;
			if (vr === b.row) to = b.col - startIdx + 1;

			// clamp to real buffer
			from = Math.max(
				0,
				Math.min(from, row.length),
			);
			to = Math.max(
				from,
				Math.min(to, row.length),
			);

			const text = row
				.slice(from, to)
				.map((c) =>
					c.type === 'char' ? c.value : ' ',
				)
				.join('');
			lines.push(text);
		}

		return lines.join('\n');
	};

	const renderCanvas = () => {
		if (!canvasRef.current) return;
		const ctx =
			canvasRef.current.getContext('2d');
		if (!ctx) return;
		// ctx.imageSmoothingEnabled = false;

		ctx.clearRect(
			0,
			0,
			ctx.canvas.width,
			ctx.canvas.height,
		);
		ctx.font = '14px Consolas';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		if (
			buffer.current.length &&
			!virtualBufferRanges.current.length
		) {
			updateVirtualBufferRanges();
		}

		const virtualCursor = findVirtualCursor();

		const first = scrollOffset.current;
		const last = first + gridSize.current.rows;

		const visibleRanges =
			virtualBufferRanges.current.slice(
				first,
				last,
			);

		// Draw highlight
		if (highlight.current) {
			const a = highlight.current.start;
			const b = highlight.current.end;

			const startVR = Math.min(a.row, b.row);
			const endVR = Math.max(a.row, b.row);

			ctx.fillStyle = 'rgba(0,0,255,0.5)';

			for (let vr = startVR; vr <= endVR; vr++) {
				const screenRow =
					vr - scrollOffset.current;
				if (
					screenRow < 0 ||
					screenRow >= gridSize.current.rows
				)
					continue;

				let startCol = 0;
				let endCol = gridSize.current.cols - 1;

				if (vr === a.row) startCol = a.col;
				if (vr === b.row) endCol = b.col;

				ctx.fillRect(
					startCol * cellSize.width,
					screenRow * cellSize.height,
					(endCol - startCol + 1) *
						cellSize.width,
					cellSize.height,
				);
			}
		}

		for (
			let r = 0;
			r < visibleRanges.length;
			r++
		) {
			const [bufferRow, startCol, length] =
				visibleRanges[r];

			const row = buffer.current[bufferRow];
			if (!row) continue;

			for (let c = 0; c < length; c++) {
				const cell = row[startCol + c];
				if (!cell) continue;

				if (cell.type === 'char') {
					const x =
						c * cellSize.width +
						cellSize.width / 2;
					const y =
						r * cellSize.height +
						cellSize.height / 2;

					if (cell.backgroundColor) {
						ctx.fillStyle =
							cell.backgroundColor || '#000';
						ctx.fillRect(
							c * cellSize.width,
							r * cellSize.height,
							cellSize.width,
							cellSize.height,
						);
					}
					if (cell.color === 'inverse') {
						ctx.globalCompositeOperation =
							'difference';
						ctx.fillStyle = '#fff';
						ctx.fillText(cell.value, x, y);
						ctx.globalCompositeOperation =
							'source-over';
					} else {
						ctx.fillStyle = cell.color || '#fff';
						ctx.fillText(cell.value, x, y);
					}
				} else if (cell.type === 'pixels') {
					ctx.globalCompositeOperation =
						'lighter';
					ctx.drawImage(
						cell.value,
						c * cellSize.width,
						r * cellSize.height,
					);
					ctx.globalCompositeOperation =
						'source-over';
					if (cell.char) {
						const x =
							c * cellSize.width +
							cellSize.width / 2;
						const y =
							r * cellSize.height +
							cellSize.height / 2;
						if (
							!cell.charColor ||
							cell.charColor === 'inverse'
						)
							ctx.globalCompositeOperation =
								'difference';
						ctx.fillStyle =
							cell.charColor || '#fff';
						ctx.fillText(cell.char, x, y);
						if (
							!cell.charColor ||
							cell.charColor === 'inverse'
						)
							ctx.globalCompositeOperation =
								'source-over';
					}
				}
			}
		}

		// Draw cursor
		if (virtualCursor && cursorVisible.current) {
			const screenRow =
				virtualCursor.virtualRow -
				scrollOffset.current;

			if (
				screenRow >= 0 &&
				screenRow < gridSize.current.rows
			) {
				ctx.strokeStyle = '#f00';
				ctx.strokeRect(
					virtualCursor.virtualCol *
						cellSize.width,
					screenRow * cellSize.height,
					cellSize.width,
					cellSize.height,
				);
			}
		}
	};

	// Performs canvas resize based on parent if needed
	const applyResizeIfNeeded = () => {
		const resize = pendingResizeRef.current;
		pendingResizeRef.current = null;
		const parent =
			canvasRef.current?.parentElement;
		if (!resize || !canvasRef.current || !parent)
			return;
		if (
			canvasRef.current.width === resize.w &&
			canvasRef.current.height === resize.h
		)
			return;

		canvasRef.current.width = resize.w;
		canvasRef.current.height = resize.h;

		canvasRef.current.style.width = `${parent.clientWidth}px`;
		canvasRef.current.style.height = `${parent.clientHeight}px`;

		const newGridSize = {
			cols: Math.floor(resize.w / cellSize.width),
			rows: Math.floor(
				resize.h / cellSize.height,
			),
		};

		if (
			newGridSize.cols !== gridSize.current.cols
		)
			removeHighlight();

		scrollBy();

		gridSize.current = newGridSize;
	};

	const onUpdate = (delta: number) => {
		blinkAccRef.current += delta;
		while (
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

	const newLinePrep = async (
		doNewLine = true,
	) => {
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

	const clearCurrentLine = (soft = true) => {
		if (soft) {
			buffer.current[buffer.current.length - 1] =
				buffer.current[
					buffer.current.length - 1
				].filter((f) => f.locked);
		} else {
			buffer.current[buffer.current.length - 1] =
				[];
		}

		updateVirtualBufferRanges();
	};

	// 1 - up; -1 - down
	const readCommandMemory = async (
		dir: 1 | -1,
	) => {
		if (commandMemory.current.length) {
			if (dir === 1) {
				if (commandMemoryIndex.current === -1)
					commandMemoryIndex.current =
						commandMemory.current.length - 1;
				else
					commandMemoryIndex.current = Math.max(
						0,
						commandMemoryIndex.current - 1,
					);
				clearCurrentLine();
				await pushData(
					[
						[
							{
								type: 'text',
								value:
									commandMemory.current[
										commandMemoryIndex.current
									],
							},
						],
					],
					true,
				);
			} else if (
				commandMemoryIndex.current <
				commandMemory.current.length - 1
			) {
				commandMemoryIndex.current++;
				clearCurrentLine();
				await pushData(
					[
						[
							{
								type: 'text',
								value:
									commandMemory.current[
										commandMemoryIndex.current
									],
							},
						],
					],
					true,
				);
			}
			scrollIntoCursorView();
		}
	};

	// Keyboard input
	React.useEffect(() => {
		const onKeyDown = async (
			e: KeyboardEvent,
		) => {
			if (!init.current) return;

			let actionTaken = false;
			if (
				e.key.length === 1 &&
				!e.ctrlKey &&
				!e.metaKey
			) {
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
					const text = getHighlightedText();
					navigator.clipboard.writeText(text);
					removeHighlight();
				}
			} else {
				removeHighlight();
			}
			if (actionTaken) {
				updateVirtualBufferRanges();
			}
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

		// Observer parent size to resize the canvas
		const parentObserver = new ResizeObserver(
			() => {
				pendingResizeRef.current = {
					w: parent.clientWidth,
					h: parent.clientHeight,
				};
			},
		);
		parentObserver.observe(parent);

		// Observer canvas size to apply specific actions
		const canvasObserver = new ResizeObserver(
			() => {
				updateVirtualBufferRanges();
			},
		);
		canvasObserver.observe(canvasRef.current);

		return () => {
			parentObserver.disconnect();
			canvasObserver.disconnect();
		};
	}, []);

	// Main renderer
	React.useEffect(() => {
		const loop = (time: number) => {
			if (!lastTimeRef.current)
				lastTimeRef.current = time;

			let delta = time - lastTimeRef.current;
			lastTimeRef.current = time;
			delta = Math.min(delta, MAX_DELTA);
			accRef.current += delta;

			while (accRef.current >= FRAME_TIME) {
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

	const doInit = async () => {
		await pushInitData();
		await newLinePrep();
		await autoTypeAndSubmit('whoami');
		scrollTo(0);
	};

	React.useEffect(() => {
		if (!init.current) {
			init.current = true;
			doInit();
		}
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
	export interface IProps {
		newLinePrefix?: string;
		initData?: TPushData[][];
		commands?: Map<string, CommandBase>;
	}

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
				backgroundColor?: string;
				locked?: boolean;
		  }
		| {
				type: 'pixels';
				value: ImageBitmap;
				backgroundColor?: string;
				locked?: boolean;
				char?: string;
				charColor?: string;
		  };
	export type TCursor = {
		row: number;
		col: number;
	};

	export type TPushData =
		| {
				type: 'text';
				value: string;
				color?: string;
				backgroundColor?: string;
				locked?: boolean;
		  }
		| {
				type: 'pixels';
				value: number[];
				backgroundColor?: string;
				locked?: boolean;
		  }
		| {
				type: 'image';
				value: string;
				backgroundColor?: string;
				locked?: boolean;
		  }
		| {
				type: 'progress';
				length: number;
				backgroundColor?: [
					number,
					number,
					number,
					number,
				];
				color: [number, number, number, number];
				locked?: boolean;
				value: number; // normalized percent 0 - 1
				text?: string;
				textColor?: string;
				textAlign?: 'left' | 'middle' | 'right';
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
