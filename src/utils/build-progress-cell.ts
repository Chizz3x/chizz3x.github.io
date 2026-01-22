export namespace NBuildProgressCell {
	export interface IProps {
		length: number;
		value: number;
		cellIndex: number;
		width: number;
		height: number;
		color: [number, number, number, number];
		backgroundColor?: [
			number,
			number,
			number,
			number,
		];
		border?: BorderOption;
		borderColor?: [
			number,
			number,
			number,
			number,
		];
	}
	export type BorderOption =
		| 'all'
		| 'sides'
		| 'verticals'
		| 'left'
		| 'top'
		| 'right'
		| 'bottom';
}

const BORDER_WIDTH = 1;

export default (
	props: NBuildProgressCell.IProps,
) => {
	const {
		length,
		value,
		cellIndex,
		width,
		height,
		color,
		backgroundColor,
		border,
		borderColor,
	} = props;

	const out = new Uint8ClampedArray(
		width * height * 4,
	);

	const fillValue = Math.max(
		0,
		Math.min(1, value * length - cellIndex),
	);

	const fillPx = Math.round(fillValue * width);

	const isFirstCell = cellIndex === 0;
	const isLastCell = cellIndex === length - 1;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;

			const baseColor =
				x < fillPx
					? color
					: backgroundColor ?? [0, 0, 0, 0];

			let isBorder = false;

			if (border) {
				switch (border) {
					case 'all':
						if (
							(isFirstCell && x < BORDER_WIDTH) ||
							(isLastCell &&
								x >= width - BORDER_WIDTH) ||
							y < BORDER_WIDTH ||
							y >= height - BORDER_WIDTH
						)
							isBorder = true;
						break;

					case 'sides':
						if (
							(isFirstCell && x < BORDER_WIDTH) ||
							(isLastCell &&
								x >= width - BORDER_WIDTH)
						)
							isBorder = true;
						break;

					case 'verticals':
						if (
							y < BORDER_WIDTH ||
							y >= height - BORDER_WIDTH
						)
							isBorder = true;
						break;

					case 'left':
						if (isFirstCell && x < BORDER_WIDTH)
							isBorder = true;
						break;

					case 'right':
						if (
							isLastCell &&
							x >= width - BORDER_WIDTH
						)
							isBorder = true;
						break;

					case 'top':
						if (y < BORDER_WIDTH) isBorder = true;
						break;

					case 'bottom':
						if (y >= height - BORDER_WIDTH)
							isBorder = true;
						break;
				}
			}

			const src = isBorder
				? borderColor || color
				: baseColor;

			const [r, g, b, a] = src;
			out[idx + 0] = r;
			out[idx + 1] = g;
			out[idx + 2] = b;
			out[idx + 3] = a;
		}
	}

	return out;
};
