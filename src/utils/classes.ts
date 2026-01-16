export default (
	...classNames: (
		| string
		| false
		| null
		| undefined
	)[]
) => {
	return classNames
		.filter(Boolean)
		.map((m) =>
			typeof m === 'string' ? m.trim() : '',
		)
		.join(' ');
};
