type TAnyRecord = Record<string | number | symbol, any>;

type RecursivePartial<T> = {
	[P in keyof T]?: RecursivePartial<T[P]>;
};

type Full<T> = {
  [P in keyof T]-?: T[P];
}

type RecursiveFull<T> = {
  [P in keyof T]-?: RecursiveFull<T[P]>;
}

export type {
  TAnyRecord,
  RecursivePartial,
  Full,
  RecursiveFull,
};