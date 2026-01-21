export default (
	rgbaArray: number[],
	width: number,
	height: number,
) => {
	const expectedLength = width * height * 4;
	const result = new Uint8ClampedArray(
		expectedLength,
	);

	const copyLength = Math.min(
		rgbaArray.length,
		expectedLength,
	);
	result.set(rgbaArray.slice(0, copyLength));

	// remaining bytes stay 0 → transparent
	return result;
};
