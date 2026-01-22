export namespace NPadText {
	export type TAlign =
		| 'left'
		| 'right'
		| 'middle';
}

export default (
	text: string,
	width: number,
	align: NPadText.TAlign = 'left',
	padChar = ' ',
) => {
	if (text.length >= width)
		return text.slice(0, width);

	const space = width - text.length;

	switch (align) {
		case 'right':
			return padChar.repeat(space) + text;
		case 'middle': {
			const left = Math.floor(space / 2);
			const right = space - left;
			return (
				padChar.repeat(left) +
				text +
				padChar.repeat(right)
			);
		}
		case 'left':
		default:
			return text + padChar.repeat(space);
	}
};
