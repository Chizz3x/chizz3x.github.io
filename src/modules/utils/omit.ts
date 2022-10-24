import { TAnyRecord } from "../../types/typescript";

const omit = (obj: TAnyRecord, keys: (string | number | symbol)[]): Omit<typeof obj, keyof typeof keys> => {
  const exclude = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(e => !exclude.has(e[0])));
};

export default omit;