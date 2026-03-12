import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonical-json.ts";

describe("canonicalJson", () => {
  it("should sort object keys lexicographically", () => {
    const result = canonicalJson({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it("should produce no whitespace", () => {
    const result = canonicalJson({ key: "value", arr: [1, 2, 3] });
    expect(result).not.toMatch(/\s/);
  });

  it("should handle nested objects with sorted keys", () => {
    const result = canonicalJson({ b: { z: 1, a: 2 }, a: 1 });
    expect(result).toBe('{"a":1,"b":{"a":2,"z":1}}');
  });

  it("should handle arrays preserving order", () => {
    const result = canonicalJson([3, 1, 2]);
    expect(result).toBe("[3,1,2]");
  });

  it("should handle null", () => {
    const result = canonicalJson(null);
    expect(result).toBe("null");
  });

  it("should handle strings with minimal escaping", () => {
    const result = canonicalJson({ key: 'hello "world"' });
    expect(result).toBe('{"key":"hello \\"world\\""}');
  });

  it("should handle empty objects", () => {
    expect(canonicalJson({})).toBe("{}");
  });

  it("should handle empty arrays", () => {
    expect(canonicalJson([])).toBe("[]");
  });

  it("should handle booleans", () => {
    expect(canonicalJson(true)).toBe("true");
    expect(canonicalJson(false)).toBe("false");
  });

  it("should handle numbers", () => {
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson(3.14)).toBe("3.14");
  });

  it("should be deterministic — same input always same output", () => {
    const input = { c: [1, { b: 2, a: 1 }], a: "hello" };
    const r1 = canonicalJson(input);
    const r2 = canonicalJson(input);
    expect(r1).toBe(r2);
  });

  it("should produce valid UTF-8", () => {
    const result = canonicalJson({ emoji: "🚀", cjk: "你好" });
    expect(result).toContain("🚀");
    expect(result).toContain("你好");
  });

  it("should handle undefined values by omitting the key", () => {
    const result = canonicalJson({ a: 1, b: undefined, c: 3 });
    expect(result).toBe('{"a":1,"c":3}');
  });

  it("should handle deeply nested objects", () => {
    const result = canonicalJson({ a: { b: { c: { d: 1 } } } });
    expect(result).toBe('{"a":{"b":{"c":{"d":1}}}}');
  });

  it("should handle mixed array contents", () => {
    const result = canonicalJson([1, "two", true, null, { a: 1 }]);
    expect(result).toBe('[1,"two",true,null,{"a":1}]');
  });

  it("should handle negative numbers", () => {
    expect(canonicalJson(-42)).toBe("-42");
    expect(canonicalJson(-3.14)).toBe("-3.14");
  });

  it("should handle zero", () => {
    expect(canonicalJson(0)).toBe("0");
  });

  it("should handle empty string", () => {
    expect(canonicalJson("")).toBe('""');
  });

  it("should escape control characters", () => {
    const result = canonicalJson({ key: "hello\nworld\ttab" });
    expect(result).toContain("\\n");
    expect(result).toContain("\\t");
  });

  it("should escape backslashes", () => {
    const result = canonicalJson({ path: "c:\\users\\test" });
    expect(result).toContain("\\\\");
  });

  it("should sort keys with different character sets correctly", () => {
    const result = canonicalJson({ b: 2, B: 1, a: 3, A: 4 });
    // UTF-8 byte order: A(0x41) < B(0x42) < a(0x61) < b(0x62)
    expect(result).toBe('{"A":4,"B":1,"a":3,"b":2}');
  });

  it("should handle large numbers", () => {
    expect(canonicalJson(Number.MAX_SAFE_INTEGER)).toBe("9007199254740991");
  });

  it("should handle array of objects with sorted keys", () => {
    const result = canonicalJson([
      { z: 1, a: 2 },
      { b: 3, a: 4 },
    ]);
    expect(result).toBe('[{"a":2,"z":1},{"a":4,"b":3}]');
  });

  it("should produce different output for different inputs", () => {
    const r1 = canonicalJson({ a: 1 });
    const r2 = canonicalJson({ a: 2 });
    expect(r1).not.toBe(r2);
  });

  it("should handle object with numeric-like string keys sorted as strings", () => {
    const result = canonicalJson({ "10": "a", "2": "b", "1": "c" });
    // Lexicographic string sort: "1" < "10" < "2"
    expect(result).toBe('{"1":"c","10":"a","2":"b"}');
  });
});
