import { describe, expect, it } from "vitest";
import { createDeterministicTarGz } from "./archive.ts";

describe("createDeterministicTarGz", () => {
  it("should produce a non-empty buffer", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("hello.txt", new TextEncoder().encode("hello"));

    const result = await createDeterministicTarGz(files);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should be deterministic — same input always same output", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("a.txt", new TextEncoder().encode("aaa"));
    files.set("b.txt", new TextEncoder().encode("bbb"));

    const r1 = await createDeterministicTarGz(files);
    const r2 = await createDeterministicTarGz(files);
    expect(Buffer.from(r1).equals(Buffer.from(r2))).toBe(true);
  });

  it("should sort archive paths lexicographically", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("z.txt", new TextEncoder().encode("z"));
    files.set("a.txt", new TextEncoder().encode("a"));
    files.set("m.txt", new TextEncoder().encode("m"));

    const r1 = await createDeterministicTarGz(files);

    // Same files added in different order should produce identical output
    const files2 = new Map<string, Uint8Array>();
    files2.set("a.txt", new TextEncoder().encode("a"));
    files2.set("m.txt", new TextEncoder().encode("m"));
    files2.set("z.txt", new TextEncoder().encode("z"));

    const r2 = await createDeterministicTarGz(files2);
    expect(Buffer.from(r1).equals(Buffer.from(r2))).toBe(true);
  });

  it("should produce valid gzip output (starts with magic bytes)", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("test.txt", new TextEncoder().encode("test"));

    const result = await createDeterministicTarGz(files);
    // Gzip magic bytes: 0x1f 0x8b
    expect(result[0]).toBe(0x1f);
    expect(result[1]).toBe(0x8b);
  });

  it("should reject paths with leading /", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("/absolute.txt", new TextEncoder().encode("bad"));

    await expect(createDeterministicTarGz(files)).rejects.toThrow();
  });

  it("should reject paths with .. segments", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("../escape.txt", new TextEncoder().encode("bad"));

    await expect(createDeterministicTarGz(files)).rejects.toThrow();
  });

  it("should handle empty files map", async () => {
    const files = new Map<string, Uint8Array>();
    const result = await createDeterministicTarGz(files);
    // Should still produce valid gzip
    expect(result[0]).toBe(0x1f);
    expect(result[1]).toBe(0x8b);
  });

  it("should reject paths starting with ./", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("./relative.txt", new TextEncoder().encode("bad"));
    await expect(createDeterministicTarGz(files)).rejects.toThrow();
  });

  it("should handle nested directory paths", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("a/b/c/deep.txt", new TextEncoder().encode("deep"));
    const result = await createDeterministicTarGz(files);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should handle files with binary content", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("binary.bin", new Uint8Array([0, 1, 2, 255, 254, 253]));
    const result = await createDeterministicTarGz(files);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should handle large number of files deterministically", async () => {
    const files = new Map<string, Uint8Array>();
    for (let i = 0; i < 100; i++) {
      files.set(`file-${String(i).padStart(3, "0")}.txt`, new TextEncoder().encode(`content-${i}`));
    }
    const r1 = await createDeterministicTarGz(files);
    const r2 = await createDeterministicTarGz(files);
    expect(Buffer.from(r1).equals(Buffer.from(r2))).toBe(true);
  });

  it("should handle empty file content", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("empty.txt", new Uint8Array(0));
    const result = await createDeterministicTarGz(files);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should handle files with Unicode names", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("日本語.txt", new TextEncoder().encode("content"));
    const result = await createDeterministicTarGz(files);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("should reject paths with embedded null bytes", async () => {
    const files = new Map<string, Uint8Array>();
    files.set("bad\x00path.txt", new TextEncoder().encode("bad"));
    await expect(createDeterministicTarGz(files)).rejects.toThrow();
  });
});
