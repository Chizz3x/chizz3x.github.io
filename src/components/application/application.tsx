import {
	Close as CloseIcon,
	CropSquare as CropSquareIcon,
	Remove as RemoveIcon,
	WebAsset as WebAssetIcon,
} from '@mui/icons-material';
import React from 'react';
import styled, {
	FlattenSimpleInterpolation,
} from 'styled-components';
import classes from '../../utils/classes';

const minSize: NApplication.ISize = {
	width: 300,
	height: 150,
};

const resizeBarSize = 12;

export abstract class AppItem {
	_destroyCB?: NApplication.IProps['onClose'];

	Application?: React.ReactElement;
	abstract index: number;
	abstract icon?: string | React.ReactElement;
	abstract title: string;
	abstract aid: string;

	constructor(
		destroyDB: NApplication.IProps['onClose'],
	) {
		this._destroyCB = destroyDB;
	}

	abstract build(): React.ReactElement;

	abstract setIndex(index: number): void;

	abstract destroy(): void;
}

const Application = (
	props: NApplication.IProps,
) => {
	const {
		defaultPosition = {
			x: 0,
			y: 0,
		},
		defaultSize,
		headerStyle,
		applicationStyle,
		icon,
		title,
		children,
		aid = `${new Date().getTime()}#${Math.random().toString()}`,
	} = props;

	const [initDone, setInitDone] =
		React.useState(false);
	const windowRef =
		React.useRef<HTMLDivElement>(null);

	const initialWidth =
		defaultSize?.width ||
		Math.min(
			window.innerWidth * 0.6,
			window.innerWidth,
		);
	const initialHeight =
		defaultSize?.height ||
		Math.min(
			initialWidth / 2,
			window.innerHeight,
		);

	const spaceSize =
		React.useRef<NApplication.ISize>({
			width: 0,
			height: 0,
		});

	const position = React.useRef(defaultPosition);
	const size = React.useRef({
		width: initialWidth,
		height: initialHeight,
	});

	const dragOffset = React.useRef({
		x: 0,
		y: 0,
	});
	const resizeStart = React.useRef({
		x: 0,
		y: 0,
	});
	const startSize = React.useRef({
		width: 0,
		height: 0,
	});
	const resizeDirection =
		React.useRef<NApplication.TResizeDirection>(
			'HV',
		);

	const dragging = React.useRef(false);
	const resizing = React.useRef(false);
	const rafId = React.useRef<number | null>(null);

	const applyStyles = () => {
		if (!windowRef.current) return;

		const el = windowRef.current;
		el.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
		el.style.width = `${size.current.width}px`;
		el.style.height = `${size.current.height}px`;
	};

	const onHeaderMouseDown = (
		e: React.MouseEvent | React.TouchEvent,
	) => {
		if (!windowRef.current) return;

		const posX =
			'touches' in e
				? e.touches[0].clientX
				: e.clientX;
		const posY =
			'touches' in e
				? e.touches[0].clientY
				: e.clientY;

		const rect =
			windowRef.current.getBoundingClientRect();
		dragOffset.current = {
			x: posX - rect.left,
			y: posY - rect.top,
		};

		dragging.current = true;
		document.addEventListener(
			'mousemove',
			onDrag,
		);
		document.addEventListener('mouseup', stopAll);

		document.addEventListener(
			'touchmove',
			onDrag,
		);
		document.addEventListener(
			'touchend',
			stopAll,
		);
	};

	const setPositionFit = () => {
		const maxX =
			spaceSize.current.width -
			size.current.width;
		const maxY =
			spaceSize.current.height -
			size.current.height;

		const widthPos =
			position.current.x + size.current.width;
		const heightPos =
			position.current.y + size.current.height;

		let outside = false;

		if (widthPos > spaceSize.current.width) {
			position.current.x = Math.max(
				0,
				Math.min(
					spaceSize.current.width -
						size.current.width,
					maxX,
				),
			);
		}
		if (heightPos > spaceSize.current.height) {
			position.current.y = Math.max(
				0,
				Math.min(
					spaceSize.current.height -
						size.current.height,
					maxY,
				),
			);
		}

		if (
			position.current.x + size.current.width >
				spaceSize.current.width ||
			position.current.y + size.current.height >
				spaceSize.current.height
		)
			outside = true;

		applyStyles();

		return { outside };
	};

	const setPosition = (
		pos: NApplication.IPosition,
	) => {
		const maxX =
			spaceSize.current.width -
			size.current.width;
		const maxY =
			spaceSize.current.height -
			size.current.height;

		position.current = {
			x: Math.max(0, Math.min(pos.x, maxX)),
			y: Math.max(0, Math.min(pos.y, maxY)),
		};

		applyStyles();
	};

	const onDrag = (e: MouseEvent | TouchEvent) => {
		if (!dragging.current || rafId.current)
			return;

		const posX =
			'touches' in e
				? e.touches[0].clientX
				: e.clientX;
		const posY =
			'touches' in e
				? e.touches[0].clientY
				: e.clientY;

		rafId.current = requestAnimationFrame(() => {
			setPosition({
				x: posX - dragOffset.current.x,
				y: posY - dragOffset.current.y,
			});
			rafId.current = null;
		});
	};

	const onResizeMouseDown = (
		e: React.MouseEvent | React.TouchEvent,
		direction: NApplication.TResizeDirection = 'HV',
	) => {
		resizeDirection.current = direction;

		const posX =
			'touches' in e
				? e.touches[0].clientX
				: e.clientX;
		const posY =
			'touches' in e
				? e.touches[0].clientY
				: e.clientY;

		resizing.current = true;
		resizeStart.current = {
			x: posX,
			y: posY,
		};
		startSize.current = { ...size.current };

		document.addEventListener(
			'mousemove',
			onResize,
		);
		document.addEventListener('mouseup', stopAll);

		document.addEventListener(
			'touchmove',
			onResize,
		);
		document.addEventListener(
			'touchend',
			stopAll,
		);
	};

	const doResizeDefault = () => {
		size.current = {
			width: initialWidth,
			height: initialHeight,
		};

		const { outside } = doResizeFit();

		if (!outside) applyStyles();
	};

	const doResizeFit = () => {
		const widthPos =
			position.current.x + size.current.width;
		const heightPos =
			position.current.y + size.current.height;

		let doUpdate = false;

		if (widthPos > spaceSize.current.width) {
			const maxWidth =
				spaceSize.current.width -
				position.current.x;
			size.current.width = Math.max(
				minSize.width,
				maxWidth,
			);
			doUpdate = true;
		}
		if (heightPos > spaceSize.current.height) {
			const maxHeight =
				spaceSize.current.height -
				position.current.y;
			size.current.height = Math.max(
				minSize.height,
				maxHeight,
			);
			doUpdate = true;
		}

		if (doUpdate) applyStyles();

		return { outside: doUpdate };
	};

	const doResize = (
		newSize: NApplication.ISize,
	) => {
		const maxWidth =
			spaceSize.current.width -
			position.current.x;
		const maxHeight =
			spaceSize.current.height -
			position.current.y;

		size.current = {
			width:
				resizeDirection.current === 'H' ||
				resizeDirection.current === 'HV'
					? Math.max(
							minSize.width,
							Math.min(newSize.width, maxWidth),
					  )
					: size.current.width,
			height:
				resizeDirection.current === 'V' ||
				resizeDirection.current === 'HV'
					? Math.max(
							minSize.height,
							Math.min(newSize.height, maxHeight),
					  )
					: size.current.height,
		};

		applyStyles();
	};

	const onResize = (
		e: MouseEvent | TouchEvent,
	) => {
		if (!resizing.current || rafId.current)
			return;

		const posX =
			'touches' in e
				? e.touches[0].clientX
				: e.clientX;
		const posY =
			'touches' in e
				? e.touches[0].clientY
				: e.clientY;

		rafId.current = requestAnimationFrame(() => {
			const dx = posX - resizeStart.current.x;
			const dy = posY - resizeStart.current.y;

			doResize({
				width: startSize.current.width + dx,
				height: startSize.current.height + dy,
			});

			rafId.current = null;
		});
	};

	const stopAll = () => {
		dragging.current = false;
		resizing.current = false;

		if (rafId.current) {
			cancelAnimationFrame(rafId.current);
			rafId.current = null;
		}

		document.removeEventListener(
			'mousemove',
			onDrag,
		);
		document.removeEventListener(
			'mousemove',
			onResize,
		);
		document.removeEventListener(
			'mouseup',
			stopAll,
		);
	};

	const onActionClick = (
		event: React.MouseEvent<
			HTMLDivElement,
			MouseEvent
		>,
		action: NApplication.TAction,
	) => {
		event.stopPropagation();
		switch (action) {
			case 'minimize':
				props?.onMinimize?.(aid);
				break;
			case 'maximize':
				props?.onMaximize?.(aid);
				break;
			case 'close':
				props?.onClose?.(aid);
				break;
		}
	};

	const preventDragging = (
		event: React.MouseEvent<
			HTMLDivElement,
			MouseEvent
		>,
	) => {
		event.stopPropagation();
	};

	React.useEffect(() => {
		if (windowRef.current) {
			spaceSize.current = {
				width:
					windowRef.current.parentElement
						?.clientWidth || 0,
				height:
					windowRef.current.parentElement
						?.clientHeight || 0,
			};

			const onBrowserResize = () => {
				if (windowRef.current) {
					spaceSize.current = {
						width:
							windowRef.current.parentElement
								?.clientWidth || 0,
						height:
							windowRef.current.parentElement
								?.clientHeight || 0,
					};

					const { outside } = setPositionFit();
					if (outside) doResizeFit();
				}
			};

			position.current = {
				x:
					spaceSize.current.width / 2 -
					size.current.width / 2,
				y:
					spaceSize.current.height / 2 -
					size.current.height / 2,
			};

			if (!initDone) setInitDone(true);

			window.addEventListener(
				'resize',
				onBrowserResize,
			);
			return () => {
				window.removeEventListener(
					'resize',
					onBrowserResize,
				);
			};
		}
		return () => {};
	}, [windowRef]);

	return (
		<ApplicationStyle
			className={classes(
				'application',
				props.className,
				!initDone && 'hidden',
			)}
			position={position.current}
			size={size.current}
			headerStyle={headerStyle}
			applicationStyle={applicationStyle}
			ref={windowRef}
			aid={aid}
		>
			<div
				onTouchStart={onHeaderMouseDown}
				onMouseDown={onHeaderMouseDown}
				className="header"
			>
				<div className="header-left">
					<div className="header-icon-box">
						{icon ? (
							typeof icon === 'string' ? (
								<div
									className="header-icon"
									style={{
										backgroundImage: `url(${icon})`,
									}}
								/>
							) : (
								icon
							)
						) : (
							<WebAssetIcon />
						)}
					</div>
					<div className="header-title">
						<span>{title}</span>
					</div>
				</div>
				<div className="header-middle" />
				<div className="header-right">
					<div
						className="minimize"
						onMouseDown={preventDragging}
						onClick={(e) =>
							onActionClick(e, 'minimize')
						}
					>
						<RemoveIcon />
					</div>
					<div
						className="maximize"
						onMouseDown={preventDragging}
						onClick={(e) =>
							onActionClick(e, 'maximize')
						}
					>
						<CropSquareIcon />
					</div>
					<div
						className="close"
						onMouseDown={preventDragging}
						onClick={(e) =>
							onActionClick(e, 'close')
						}
					>
						<CloseIcon />
					</div>
				</div>
			</div>
			<div className="content">{children}</div>
			<div className="resize-border">
				<div
					className="resize-corner"
					onTouchStart={onResizeMouseDown}
					onMouseDown={onResizeMouseDown}
					onDoubleClick={doResizeDefault}
				/>
				<div
					className="resize-right"
					onTouchStart={(e) =>
						onResizeMouseDown(e, 'H')
					}
					onMouseDown={(e) =>
						onResizeMouseDown(e, 'H')
					}
				/>
				<div
					className="resize-bottom"
					onTouchStart={(e) =>
						onResizeMouseDown(e, 'V')
					}
					onMouseDown={(e) =>
						onResizeMouseDown(e, 'V')
					}
				/>
			</div>
		</ApplicationStyle>
	);
};

export { Application };

export namespace NApplication {
	export interface IPosition {
		x: number;
		y: number;
	}
	export interface ISize {
		width: number;
		height: number;
	}
	export interface IProps
		extends React.ComponentPropsWithRef<
			typeof ApplicationStyle
		> {
		defaultPosition?: IPosition;
		defaultSize?: ISize;
		onMinimize?: (aid: string) => void;
		onMaximize?: (aid: string) => void;
		onClose?: (aid: string) => void;
		headerStyle?: FlattenSimpleInterpolation;
		applicationStyle?: FlattenSimpleInterpolation;
		icon?: string | React.ReactNode;
		title: string;
		aid: string;
	}
	export interface IStyledProps {
		position: IPosition;
		size: ISize;
		headerStyle?: FlattenSimpleInterpolation;
		applicationStyle?: FlattenSimpleInterpolation;
		aid: string;
	}
	export type TAction =
		| 'minimize'
		| 'maximize'
		| 'close';
	export type TResizeDirection = 'H' | 'V' | 'HV';
}

const ApplicationStyle = styled.div<NApplication.IStyledProps>`
	background-color: rgba(0, 0, 0, 0.6);
	backdrop-filter: blur(8px);
	width: ${(props) => props.size.width}px;
	height: ${(props) => props.size.height}px;
	position: absolute;
	transform: translate(
		${(props) => props.position.x}px,
		${(props) => props.position.y}px
	);
	will-change: transform, width, height;
	opacity: 1;
	transition: opacity 0.2s ease-in-out;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	display: flex;
	flex-direction: column;
	&.hidden {
		opacity: 0;
	}
	.resize-border {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		user-select: none;
		> * {
			pointer-events: all;
			position: absolute;
		}
		.resize-corner {
			width: ${resizeBarSize}px;
			height: ${resizeBarSize}px;
			right: 0;
			bottom: 0;
			cursor: nwse-resize;
			transform: translate(100%, 100%);
		}
		.resize-right {
			width: ${resizeBarSize}px;
			height: 100%;
			right: 0;
			top: 0;
			cursor: ew-resize;
			transform: translateX(100%);
		}
		.resize-bottom {
			width: 100%;
			height: ${resizeBarSize}px;
			left: 0;
			bottom: 0;
			cursor: ns-resize;
			transform: translateY(100%);
		}
	}
	.header {
		box-sizing: border-box;
		width: 100%;
		height: 30px;
		display: flex;
		background-color: rgba(0, 0, 0, 0.3);
		column-gap: 12px;
		justify-content: space-evenly;
		user-select: none;
		> * {
			box-sizing: border-box;
			display: flex;
			align-items: center;
			flex-grow: 1;
			padding: 2px 3px;
			height: 100%;
		}
		.header-left {
			display: flex;
			column-gap: 6px;
			.header-icon-box {
				display: flex;
				align-items: center;
				.header-icon {
					width: 24px;
					height: 24px;
					background-size: contain;
					background-position: center;
					background-repeat: no-repeat;
				}
			}
			.header-title {
				line-height: 100%;
			}
		}
		.header-middle {
			//
		}
		.header-right {
			display: flex;
			justify-content: flex-end;
			padding: 0;
			> * {
				width: 50px;
				height: 100%;
				cursor: pointer;
				display: flex;
				justify-content: center;
				align-items: center;
				&:hover {
					background-color: rgba(0, 0, 0, 0.5);
				}
				&.close {
					&:hover {
						background-color: rgba(
							255,
							50,
							50,
							0.5
						);
					}
				}
			}
		}
		${(props) => props.headerStyle};
	}

	.content {
		flex-grow: 1;
		flex-basis: 0;
		padding: 2px 3px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-sizing: border-box;
	}

	${(props) => props.applicationStyle};
`;
