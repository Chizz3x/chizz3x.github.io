export default async (
	path: string,
	cellWidth: number,
	cellHeight: number,
) => {
	return new Promise<{
		chunks: number[][];
		cols: number;
		rows: number;
	}>((resolve, reject) => {
		const img = new Image();
		img.src = path;
		img.onload = () => {
			const canvas =
				document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d', {
				willReadFrequently: true,
			});
			if (!ctx) {
				reject();
				return;
			}
			ctx.drawImage(img, 0, 0);

			const cols = Math.ceil(
				img.width / cellWidth,
			);
			const rows = Math.ceil(
				img.height / cellHeight,
			);

			const chunks: number[][] = []; // will be [cellPixelArray][cellIndex]

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const x = col * cellWidth;
					const y = row * cellHeight;
					const w = Math.min(
						cellWidth,
						img.width - x,
					);
					const h = Math.min(
						cellHeight,
						img.height - y,
					);

					const imageData = ctx.getImageData(
						x,
						y,
						w,
						h,
					);

					// Normalize each chunk to full cell size (pad if on edge)
					const normalized: number[] = [];
					for (let yy = 0; yy < h; yy++) {
						for (let xx = 0; xx < w; xx++) {
							const srcIdx = (yy * w + xx) * 4;
							const dstIdx =
								(yy * cellWidth + xx) * 4;
							normalized[dstIdx] =
								imageData.data[srcIdx];
							normalized[dstIdx + 1] =
								imageData.data[srcIdx + 1];
							normalized[dstIdx + 2] =
								imageData.data[srcIdx + 2];
							normalized[dstIdx + 3] =
								imageData.data[srcIdx + 3];
						}
					}

					chunks.push(normalized);
				}
			}

			resolve({ chunks, rows, cols });
		};
		img.onerror = reject;
	});
};
