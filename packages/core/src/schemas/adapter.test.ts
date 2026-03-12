import { describe, expect, it } from "vitest";
import { adapterSchema } from "./adapter.ts";

describe("adapterSchema", () => {
  const validAdapter = {
    type: "claude-code",
    runtime: "claude-code",
    adapterVersion: "1.0.0",
    config: {},
    features: {},
  };

  it("should validate a minimal valid adapter config", () => {
    const result = adapterSchema.safeParse(validAdapter);
    expect(result.success).toBe(true);
  });

  it("should require type", () => {
    const { type: _, ...noType } = validAdapter;
    const result = adapterSchema.safeParse(noType);
    expect(result.success).toBe(false);
  });

  it("should require runtime", () => {
    const { runtime: _, ...noRuntime } = validAdapter;
    const result = adapterSchema.safeParse(noRuntime);
    expect(result.success).toBe(false);
  });

  it("should require adapterVersion", () => {
    const { adapterVersion: _, ...noVersion } = validAdapter;
    const result = adapterSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it("should require adapterVersion to be valid semver", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, adapterVersion: "bad" });
    expect(result.success).toBe(false);
  });

  it("should require config field", () => {
    const { config: _, ...noConfig } = validAdapter;
    const result = adapterSchema.safeParse(noConfig);
    expect(result.success).toBe(false);
  });

  it("should require features field", () => {
    const { features: _, ...noFeatures } = validAdapter;
    const result = adapterSchema.safeParse(noFeatures);
    expect(result.success).toBe(false);
  });

  it("should accept optional model", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, model: "claude-opus-4-1" });
    expect(result.success).toBe(true);
  });

  it("should accept optional modelParams", () => {
    const result = adapterSchema.safeParse({
      ...validAdapter,
      modelParams: { temperature: 0.3, maxTokens: 4096 },
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid importMode values", () => {
    const modes = ["filesystem", "api", "bundle", "object-map"];
    for (const importMode of modes) {
      const result = adapterSchema.safeParse({ ...validAdapter, importMode });
      expect(result.success, `Expected importMode "${importMode}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid importMode", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, importMode: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid fidelity values", () => {
    const fidelities = ["byte-exact", "schema-exact", "best-effort", "unsupported"];
    for (const fidelity of fidelities) {
      const result = adapterSchema.safeParse({ ...validAdapter, fidelity });
      expect(result.success, `Expected fidelity "${fidelity}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid fidelity", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, fidelity: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should accept valid feature values for prompt", () => {
    const values = ["native", "embedded", "unsupported"];
    for (const prompt of values) {
      const result = adapterSchema.safeParse({
        ...validAdapter,
        features: { prompt },
      });
      expect(result.success, `Expected prompt "${prompt}" to be valid`).toBe(true);
    }
  });

  it("should accept valid feature values for mcp", () => {
    const values = ["native", "translated", "unsupported"];
    for (const mcp of values) {
      const result = adapterSchema.safeParse({
        ...validAdapter,
        features: { mcp },
      });
      expect(result.success, `Expected mcp "${mcp}" to be valid`).toBe(true);
    }
  });

  it("should accept valid feature values for secrets", () => {
    const values = ["native", "consumer-only"];
    for (const secrets of values) {
      const result = adapterSchema.safeParse({
        ...validAdapter,
        features: { secrets },
      });
      expect(result.success, `Expected secrets "${secrets}" to be valid`).toBe(true);
    }
  });

  it("should accept exactMode boolean in features", () => {
    const result = adapterSchema.safeParse({
      ...validAdapter,
      features: { exactMode: true },
    });
    expect(result.success).toBe(true);
  });

  it("should accept targets array", () => {
    const result = adapterSchema.safeParse({
      ...validAdapter,
      targets: [
        { kind: "file", path: "CLAUDE.md", scope: "project" },
        { kind: "directory", path: ".claude/skills/", scope: "project" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid target kind values", () => {
    const kinds = ["file", "directory", "setting", "api", "bundle", "object"];
    for (const kind of kinds) {
      const result = adapterSchema.safeParse({
        ...validAdapter,
        targets: [{ kind, path: "test" }],
      });
      expect(result.success, `Expected target kind "${kind}" to be valid`).toBe(true);
    }
  });

  it("should accept valid target scope values", () => {
    const scopes = ["user", "project", "workspace", "local", "remote", "account", "organization"];
    for (const scope of scopes) {
      const result = adapterSchema.safeParse({
        ...validAdapter,
        targets: [{ kind: "file", path: "test", scope }],
      });
      expect(result.success, `Expected target scope "${scope}" to be valid`).toBe(true);
    }
  });

  it("should reject empty type", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, type: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty runtime", () => {
    const result = adapterSchema.safeParse({ ...validAdapter, runtime: "" });
    expect(result.success).toBe(false);
  });

  it("should accept optional runtimeVersionRange", () => {
    const result = adapterSchema.safeParse({
      ...validAdapter,
      runtimeVersionRange: ">=1.0.0 <2.0.0",
    });
    expect(result.success).toBe(true);
  });

  it("should accept full adapter config with all fields", () => {
    const result = adapterSchema.safeParse({
      type: "claude-code",
      runtime: "claude-code",
      adapterVersion: "1.0.0",
      runtimeVersionRange: ">=1.0.0",
      model: "claude-opus-4-1",
      modelParams: { temperature: 0.5 },
      importMode: "filesystem",
      fidelity: "byte-exact",
      config: { scope: "project" },
      features: {
        prompt: "native",
        persona: "embedded",
        rules: "native",
        skills: "native",
        mcp: "native",
        surfaces: "native",
        secrets: "consumer-only",
        toolPermissions: "native",
        modelConfig: "native",
        exactMode: true,
      },
      targets: [{ kind: "file", path: "CLAUDE.md", scope: "project", exact: true }],
    });
    expect(result.success).toBe(true);
  });
});
