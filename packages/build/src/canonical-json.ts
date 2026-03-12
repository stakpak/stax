/**
 * Serialize a value to canonical JSON.
 * Rules: UTF-8, lexicographically sorted keys, no whitespace, minimal escaping.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalJson(item));
    return `[${items.join(",")}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries: string[] = [];
    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      if (val === undefined) continue;
      entries.push(`${JSON.stringify(key)}:${canonicalJson(val)}`);
    }
    return `{${entries.join(",")}}`;
  }

  return String(value);
}
