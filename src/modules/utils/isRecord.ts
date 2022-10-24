const isRecord = (a: any) => {
  return typeof a === "object" && !Array.isArray(a);
};

export default isRecord;