import { afterEach, describe, expect, it } from "bun:test";
import {
  cleanBunCompileTempArtifacts,
  emptyDirectory,
  isBunCompileTempArtifact,
} from "../build-artifacts.ts";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("build artifact cleanup", () => {
  it("empties an output directory before rebuilding", () => {
    const directory = mkdtempSync(join(tmpdir(), "stax-cli-build-"));
    tempDirectories.push(directory);

    const oldBinary = join(directory, "stax");
    const nestedDirectory = join(directory, "tmp");

    writeFileSync(oldBinary, "old-binary");
    mkdirSync(nestedDirectory);
    writeFileSync(join(nestedDirectory, "stale.txt"), "stale");

    const removed = emptyDirectory(directory);

    expect(removed).toContain(oldBinary);
    expect(removed).toContain(nestedDirectory);
    expect(existsSync(oldBinary)).toBe(false);
    expect(existsSync(nestedDirectory)).toBe(false);
  });

  it("recognizes Bun compile temp artifact names", () => {
    expect(isBunCompileTempArtifact(".stax-abc123.bun-build")).toBe(true);
    expect(isBunCompileTempArtifact(".bun-build-stax")).toBe(true);
    expect(isBunCompileTempArtifact("stax.bun-build")).toBe(false);
    expect(isBunCompileTempArtifact("stax")).toBe(false);
    expect(isBunCompileTempArtifact("bunfig.toml")).toBe(false);
  });

  it("removes Bun compile temp artifacts and leaves normal files alone", () => {
    const directory = mkdtempSync(join(tmpdir(), "stax-cli-build-"));
    tempDirectories.push(directory);

    const tempFile = join(directory, ".stax-abc123.bun-build");
    const tempDirectory = join(directory, ".stax-nested.bun-build");
    const outputFile = join(directory, "stax");
    const configFile = join(directory, "bunfig.toml");

    writeFileSync(tempFile, "temp");
    mkdirSync(tempDirectory);
    writeFileSync(join(tempDirectory, "nested.txt"), "temp");
    writeFileSync(outputFile, "binary");
    writeFileSync(configFile, 'logLevel = "warn"\n');

    const removed = cleanBunCompileTempArtifacts(directory);

    expect(removed).toContain(tempFile);
    expect(removed).toContain(tempDirectory);
    expect(existsSync(tempFile)).toBe(false);
    expect(existsSync(tempDirectory)).toBe(false);
    expect(existsSync(outputFile)).toBe(true);
    expect(existsSync(configFile)).toBe(true);
  });
});
