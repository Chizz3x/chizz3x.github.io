import { TAnyRecord } from "../../types/typescript";
import isRecord from "./isRecord";

const defaultify = <T extends TAnyRecord>(def: T, src?: TAnyRecord, recursive = true): T => {
  if(!src) return def;
  const res = { ...src };
  const keys = Object.keys(def) as (keyof T)[];
  for(const key of keys) {
    if(!(key in res) || res[key] === undefined)
      res[key] = def[key];
    else if(
      recursive
			&& isRecord(res[key])
			&& isRecord(def[key])
    ) res[key] = defaultify(def[key], res[key]);
  }
  return res as T;
};

export default defaultify;