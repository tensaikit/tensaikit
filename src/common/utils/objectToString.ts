export function objectToString(obj: any): string {
  try {
    if (obj === undefined) return "undefined";
    if (obj === null) return "null";
    return typeof obj === "string"
      ? obj
      : JSON.stringify(obj, (_key, value) =>
          typeof value === "bigint" ? value.toString() : value
        );
  } catch (error) {
    return String(obj); // fallback for circular structures
  }
}
