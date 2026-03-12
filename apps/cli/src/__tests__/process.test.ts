import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("process handling", () => {
  it("should complete in reasonable time for help", async () => {
    const start = Date.now();
    await run(["--help"]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it("should complete in reasonable time for version", async () => {
    const start = Date.now();
    await run(["version"]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  it("should complete in reasonable time for unknown command", async () => {
    const start = Date.now();
    await run(["nonexistent"]);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
