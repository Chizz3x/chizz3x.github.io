export default (length: number, size: number) => {
	const ranges: [number, number][] = [];

	if (length <= 0 || size <= 0) return [];

	for (let i = 0; i < length; i += size) {
		const rangeLength = Math.min(
			size,
			length - i,
		);
		ranges.push([i, rangeLength]);
	}

	return ranges;
};
