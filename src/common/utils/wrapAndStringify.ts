export const wrapAndStringify = (
  actionProvider: string,
  input: any
): string => {
  try {
    const seen = new WeakSet();

    const payload = {
      action: actionProvider,
      data: input,
    };

    return JSON.stringify(payload, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    return `{"action":"${actionProvider}","data":"[Unserializable Input]"}`;
  }
};
