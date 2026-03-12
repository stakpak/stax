import { describe, expect, it } from "vitest";
import { defineAdapter } from "./define-adapter.ts";
import type { Adapter } from "./types.ts";

describe("defineAdapter", () => {
  const mockAdapter: Adapter = {
    type: "test-adapter",
    runtime: "test-runtime",
    adapterVersion: "1.0.0",
    createConfig: () => ({
      type: "test-adapter",
      runtime: "test-runtime",
      adapterVersion: "1.0.0",
      config: {},
      features: {},
    }),
    materialize: async () => ({ files: new Map(), warnings: [] }),
    capabilities: () => ({
      features: {},
      targets: [],
    }),
  };

  it("should return the adapter when valid", () => {
    const adapter = defineAdapter(mockAdapter);
    expect(adapter.type).toBe("test-adapter");
    expect(adapter.runtime).toBe("test-runtime");
    expect(adapter.adapterVersion).toBe("1.0.0");
  });

  it("should reject adapter without type", () => {
    expect(() => defineAdapter({ ...mockAdapter, type: "" })).toThrow();
  });

  it("should reject adapter without runtime", () => {
    expect(() => defineAdapter({ ...mockAdapter, runtime: "" })).toThrow();
  });

  it("should reject invalid adapterVersion", () => {
    expect(() => defineAdapter({ ...mockAdapter, adapterVersion: "bad" })).toThrow();
  });

  it("should reject adapter without adapterVersion", () => {
    expect(() => defineAdapter({ ...mockAdapter, adapterVersion: "" })).toThrow();
  });

  it("should reject adapter with non-semver adapterVersion", () => {
    expect(() => defineAdapter({ ...mockAdapter, adapterVersion: "v1" })).toThrow();
  });

  it("should accept adapter with valid semver adapterVersion", () => {
    const adapter = defineAdapter({ ...mockAdapter, adapterVersion: "2.1.0" });
    expect(adapter.adapterVersion).toBe("2.1.0");
  });

  it("should preserve createConfig function", () => {
    const adapter = defineAdapter(mockAdapter);
    expect(adapter.createConfig).toBeTypeOf("function");
  });

  it("should preserve materialize function", () => {
    const adapter = defineAdapter(mockAdapter);
    expect(adapter.materialize).toBeTypeOf("function");
  });

  it("should preserve capabilities function", () => {
    const adapter = defineAdapter(mockAdapter);
    expect(adapter.capabilities).toBeTypeOf("function");
  });
});
