import React from 'react';
import styled from 'styled-components';
import {
	CSSMediaSize,
	MouseButton,
} from '../const';
import classes from '../utils/classes';
import { AppItem } from '../components/application/application';
import { TerminalApp } from '../components/application/apps/terminal';

const defaultCellSize = 100;
const defaultGap = 20;

function PageHome() {
	const [initSetup, setInitSetup] =
		React.useState(false);
	const draggableContainerRef =
		React.useRef<HTMLDivElement>(null);
	const draggableBoxRef =
		React.useRef<HTMLDivElement>(null);
	const draggableElement =
		React.useRef<HTMLDivElement | null>();
	const dragOffset = React.useRef({
		x: 0,
		y: 0,
	});

	const gridRef =
		React.useRef<HTMLDivElement>(null);
	const [gridRefSize, setGridRefSize] =
		React.useState({
			width: 0,
			height: 0,
		});

	const [selectedCell, setSelectedCell] =
		React.useState(-1);

	const [, forceRender] = React.useState(false);
	const invalidate = () => {
		forceRender((v) => !v);
	};

	const onCloseApp = () => {
		invalidate();
	};

	const appGrid = React.useRef<
		Record<number, AppItem>
	>({});

	const [cellSize, setCellSize] = React.useState(
		defaultCellSize,
	);
	const [gap, setGap] =
		React.useState(defaultGap);

	const [size, setSize] =
		React.useState<NHome.IGridSize>({
			cols: 0,
			rows: 0,
		});

	const updateGrid = () => {
		setSize({
			cols: Math.floor(
				(gridRefSize.width + gap) /
					(cellSize + gap),
			),
			rows: Math.floor(
				(gridRefSize.height + gap) /
					(cellSize + gap),
			),
		});
	};

	const openApp = (index: number) => {
		appGrid.current[index].build();
		// invalidate();
		setSelectedCell(-1);
	};

	React.useEffect(() => {
		updateGrid();
	}, [gridRefSize]);

	React.useEffect(() => {
		const onResize = () => {
			setGridRefSize({
				width:
					(gridRef.current?.clientWidth || 0) -
					gap * 2,
				height:
					(gridRef.current?.clientHeight || 0) -
					gap * 2,
			});
		};
		onResize();
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener(
				'resize',
				onResize,
			);
		};
	}, [cellSize, gap]);

	React.useEffect(() => {
		const onClick = (e: MouseEvent) => {
			const target =
				e.target as HTMLElement | null;
			if (!target?.closest('.app-object')) {
				setSelectedCell(-1);
			}
		};

		window.addEventListener('click', onClick);

		return () => {
			window.removeEventListener(
				'click',
				onClick,
			);
		};
	}, []);

	const checkUnderlyingElement = (
		x: number,
		y: number,
	) => {
		// returns all elements at this point, top to bottom
		const elements = document.elementsFromPoint(
			x,
			y,
		);

		// filter to only elements inside your container
		return elements.find((el) =>
			el.classList.contains('cell'),
		);
	};

	const onDragStart = (e: React.MouseEvent) => {
		const rect =
			e.currentTarget.getBoundingClientRect();
		dragOffset.current = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
		const appClone = e.currentTarget.cloneNode(
			true,
		) as HTMLDivElement;
		appClone.style.backgroundColor =
			'transparent';
		const boxClone =
			draggableBoxRef.current?.cloneNode() as HTMLDivElement;
		boxClone.appendChild(appClone);
		boxClone.dataset.index =
			appClone.dataset.index;
		boxClone.style.left = `${
			e.clientX - dragOffset.current.x
		}px`;
		boxClone.style.top = `${
			e.clientY - dragOffset.current.y
		}px`;
		draggableElement.current = boxClone;
	};

	React.useEffect(() => {
		if (!initSetup && size.cols * size.rows > 0) {
			setInitSetup(true);
			appGrid.current[
				Math.floor((size.cols * size.rows) / 2)
			] = new TerminalApp(onCloseApp);
		}
	}, [size]);

	React.useEffect(() => {
		const onMouseUp = (e: MouseEvent) => {
			if (e.button === MouseButton.Left) {
				if (draggableElement.current) {
					const bbox =
						draggableElement.current.getBoundingClientRect();
					const element = checkUnderlyingElement(
						bbox.left + bbox.width / 2,
						bbox.top + bbox.height / 2,
					);
					if (element) {
						const indexTo = Number(
							element.getAttribute('data-index'),
						);
						const indexFrom = Number(
							draggableElement.current.dataset
								.index,
						);
						if (indexFrom !== indexTo) {
							appGrid.current[indexTo] =
								appGrid.current[indexFrom];
							delete appGrid.current[indexFrom];
							setSelectedCell(-1);
							invalidate();
						}
					}

					draggableElement.current.remove();
					draggableElement.current = null;
				}
			}
		};
		const onMouseMove = (e: MouseEvent) => {
			if (draggableElement.current) {
				if (
					!draggableContainerRef.current?.children.item(
						1,
					)
				) {
					draggableContainerRef.current?.appendChild(
						draggableElement.current,
					);
				}
				draggableElement.current.style.left = `${
					e.clientX - dragOffset.current.x
				}px`;
				draggableElement.current.style.top = `${
					e.clientY - dragOffset.current.y
				}px`;
			}
		};
		window.addEventListener('mouseup', onMouseUp);
		window.addEventListener(
			'mousemove',
			onMouseMove,
		);
		return () => {
			window.removeEventListener(
				'mouseup',
				onMouseUp,
			);
			window.removeEventListener(
				'mousemove',
				onMouseMove,
			);
		};
	}, []);

	return (
		<PageHomeStyle id="Home">
			<div className="cover" />
			<div className="cover-fade" />
			<div className="space">
				{Object.values(appGrid.current).map(
					(m) => m?.Application,
				)}
			</div>
			<GroundStyle
				ref={gridRef}
				columns={size.cols}
				gap={gap}
				cellSize={cellSize}
				className="ground"
			>
				{Array.from({
					length: size.cols * size.rows,
				}).map((_, i) => {
					return (
						<div
							key={`${i}-${!!appGrid.current[i]
								?.Application}`}
							className="cell"
							data-index={i}
						>
							<div className="cell-inner">
								{appGrid.current[i] ? (
									<div
										className={classes(
											'app-object',
											selectedCell === i &&
												'selected',
										)}
										onClick={() =>
											setSelectedCell(i)
										}
										onDoubleClick={() =>
											openApp(i)
										}
										onTouchEnd={() => openApp(i)}
										onMouseDown={onDragStart}
										data-index={i}
									>
										<div className="app-icon-box">
											{typeof appGrid.current[i]
												.icon === 'string' ? (
												<div
													className="app-icon"
													style={{
														backgroundImage: `url(${appGrid.current[i].icon})`,
													}}
												/>
											) : (
												appGrid.current[i].icon
											)}
										</div>
										<div className="app-title">
											{appGrid.current[i].title}
										</div>
									</div>
								) : null}
							</div>
						</div>
					);
				})}
			</GroundStyle>
			<div
				ref={draggableContainerRef}
				className="draggable-container"
			>
				<div
					ref={draggableBoxRef}
					className="draggable-box"
				/>
			</div>
		</PageHomeStyle>
	);
}

export { PageHome };

export namespace NHome {
	export interface IGridStyleProps {
		columns: number;
		gap: number;
		cellSize: number;
	}
	export interface IGridSize {
		cols: number;
		rows: number;
	}
}

const GroundStyle = styled.div<NHome.IGridStyleProps>`
	position: absolute;
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-columns: repeat(
		${({ columns }) => columns},
		1fr
	);
	padding: ${({ gap }) => gap / 2}px;
	overflow: hidden;
	box-sizing: border-box;
	.cell {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: ${({ gap }) => gap / 2}px;
		box-sizing: border-box;
		.cell-inner {
			aspect-ratio: 1/1;
			width: ${({ cellSize }) => cellSize}px;
		}
	}
`;

const PageHomeStyle = styled.div`
	flex-shrink: 0;
	flex-grow: 1;

	@keyframes bg-pulse {
		0% {
			filter: brightness(1) grayscale(0)
				saturate(1);
		}
		25% {
			filter: brightness(0.8) grayscale(0.2)
				saturate(0.8);
		}
		50% {
			filter: brightness(1.3) grayscale(0)
				saturate(1);
		}
		75% {
			filter: brightness(0.75) grayscale(0.25)
				saturate(0.75);
		}
		100% {
			filter: brightness(1) grayscale(0)
				saturate(1);
		}
	}

	width: 100%;
	min-height: 100vh;
	position: relative;
	.app-object {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: 8px 12px;
		user-select: none;
		cursor: pointer;
		&.selected {
			background-color: rgba(0, 0, 0, 0.4);
		}
		&:hover {
			background-color: rgba(0, 0, 0, 0.2);
		}
		.app-icon-box {
			flex-grow: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			.app-icon {
				width: 100%;
				height: 100%;
				background-size: contain;
				background-position: center;
				background-repeat: no-repeat;
			}
		}
		.app-title {
			font-size: 14px;
			text-align: center;
		}
	}
	.draggable-container {
		width: 100%;
		height: 100%;
		position: absolute;
		user-select: none;
		pointer-events: none;
		overflow: hidden;
		.draggable-box {
			width: ${defaultCellSize}px;
			height: ${defaultCellSize}px;
			position: absolute;
		}
	}
	.cover-fade {
		position: absolute;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			180deg,
			var(--c-bg-1),
			transparent 50%,
			var(--c-bg-1) 100%
		);
	}
	.cover {
		position: absolute;
		width: 100%;
		height: 100%;
		background: url('./img/1.png');
		animation: bg-pulse 20s ease-in-out infinite;
		background-size: cover;
		background-position: center;
	}
	.space {
		position: absolute;
		width: 100%;
		height: 100%;
		overflow: hidden;
		z-index: 2;
		pointer-events: none;
		box-sizing: border-box;
		> * {
			pointer-events: all;
		}
	}

	${CSSMediaSize.tablet} {
		//
	}
`;
