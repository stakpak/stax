import { describe, expect, it } from "vitest";
import {
  ARTIFACT_TYPE_AGENT,
  ARTIFACT_TYPE_PACKAGE,
  ARTIFACT_TYPE_PROFILE,
  ARTIFACT_TYPE_SOURCE,
  LAYER_MEDIA_TYPES,
  LAYER_ORDER,
} from "./constants.ts";

describe("OCI constants", () => {
  it("should define all artifact types", () => {
    expect(ARTIFACT_TYPE_AGENT).toBe("application/vnd.stax.agent.v1");
    expect(ARTIFACT_TYPE_PACKAGE).toBe("application/vnd.stax.package.v1");
    expect(ARTIFACT_TYPE_PROFILE).toBe("application/vnd.stax.profile.v1");
    expect(ARTIFACT_TYPE_SOURCE).toBe("application/vnd.stax.source.v1");
  });

  it("should define all layer media types", () => {
    expect(LAYER_MEDIA_TYPES.config).toContain("config");
    expect(LAYER_MEDIA_TYPES.persona).toContain("persona");
    expect(LAYER_MEDIA_TYPES.prompt).toContain("prompt");
    expect(LAYER_MEDIA_TYPES.mcp).toContain("mcp");
    expect(LAYER_MEDIA_TYPES.skills).toContain("skills");
    expect(LAYER_MEDIA_TYPES.rules).toContain("rules");
    expect(LAYER_MEDIA_TYPES.knowledge).toContain("knowledge");
    expect(LAYER_MEDIA_TYPES.memory).toContain("memory");
    expect(LAYER_MEDIA_TYPES.surfaces).toContain("surfaces");
    expect(LAYER_MEDIA_TYPES.instructionTree).toContain("instruction-tree");
    expect(LAYER_MEDIA_TYPES.subagents).toContain("subagents");
    expect(LAYER_MEDIA_TYPES.secrets).toContain("secrets");
    expect(LAYER_MEDIA_TYPES.packages).toContain("packages");
  });

  it("should have 12 entries in LAYER_ORDER", () => {
    expect(LAYER_ORDER).toHaveLength(12);
  });

  it("should start with knowledge and end with memory in LAYER_ORDER", () => {
    expect(LAYER_ORDER[0]).toBe(LAYER_MEDIA_TYPES.knowledge);
    expect(LAYER_ORDER[LAYER_ORDER.length - 1]).toBe(LAYER_MEDIA_TYPES.memory);
  });

  it("should have unique artifact type values", () => {
    const types = [
      ARTIFACT_TYPE_AGENT,
      ARTIFACT_TYPE_PACKAGE,
      ARTIFACT_TYPE_PROFILE,
      ARTIFACT_TYPE_SOURCE,
    ];
    expect(new Set(types).size).toBe(types.length);
  });

  it("should have unique layer media type values", () => {
    const types = Object.values(LAYER_MEDIA_TYPES);
    expect(new Set(types).size).toBe(types.length);
  });

  it("should use application/vnd.stax prefix for all media types", () => {
    for (const [key, value] of Object.entries(LAYER_MEDIA_TYPES)) {
      expect(value, `${key} should use stax prefix`).toMatch(/^application\/vnd\.stax\./);
    }
  });

  it("should use v1 in all artifact types", () => {
    expect(ARTIFACT_TYPE_AGENT).toContain(".v1");
    expect(ARTIFACT_TYPE_PACKAGE).toContain(".v1");
    expect(ARTIFACT_TYPE_PROFILE).toContain(".v1");
    expect(ARTIFACT_TYPE_SOURCE).toContain(".v1");
  });

  it("should have JSON media type for config", () => {
    expect(LAYER_MEDIA_TYPES.config).toContain("+json");
  });

  it("should have JSON media types for JSON-backed layers", () => {
    expect(LAYER_MEDIA_TYPES.persona).toContain("+json");
    expect(LAYER_MEDIA_TYPES.mcp).toContain("+json");
    expect(LAYER_MEDIA_TYPES.subagents).toContain("+json");
    expect(LAYER_MEDIA_TYPES.secrets).toContain("+json");
    expect(LAYER_MEDIA_TYPES.packages).toContain("+json");
  });

  it("should have markdown media type for prompt", () => {
    expect(LAYER_MEDIA_TYPES.prompt).toContain("+markdown");
  });

  it("should have tar+gzip media types for directory-backed layers", () => {
    expect(LAYER_MEDIA_TYPES.skills).toContain("tar+gzip");
    expect(LAYER_MEDIA_TYPES.rules).toContain("tar+gzip");
    expect(LAYER_MEDIA_TYPES.knowledge).toContain("tar+gzip");
    expect(LAYER_MEDIA_TYPES.memory).toContain("tar+gzip");
    expect(LAYER_MEDIA_TYPES.surfaces).toContain("tar+gzip");
    expect(LAYER_MEDIA_TYPES.instructionTree).toContain("tar+gzip");
  });

  it("should have source snapshot media type with tar+gzip", () => {
    expect(LAYER_MEDIA_TYPES.sourceSnapshot).toContain("tar+gzip");
  });

  it("should include all 13 expected layer media types", () => {
    const expectedKeys = [
      "config",
      "persona",
      "prompt",
      "mcp",
      "skills",
      "rules",
      "knowledge",
      "memory",
      "surfaces",
      "instructionTree",
      "subagents",
      "secrets",
      "packages",
      "sourceSnapshot",
    ];
    for (const key of expectedKeys) {
      expect(LAYER_MEDIA_TYPES).toHaveProperty(key);
    }
  });

  it("should follow canonical LAYER_ORDER sequence", () => {
    const expectedOrder = [
      LAYER_MEDIA_TYPES.knowledge,
      LAYER_MEDIA_TYPES.rules,
      LAYER_MEDIA_TYPES.skills,
      LAYER_MEDIA_TYPES.mcp,
      LAYER_MEDIA_TYPES.secrets,
      LAYER_MEDIA_TYPES.packages,
      LAYER_MEDIA_TYPES.instructionTree,
      LAYER_MEDIA_TYPES.surfaces,
      LAYER_MEDIA_TYPES.prompt,
      LAYER_MEDIA_TYPES.persona,
      LAYER_MEDIA_TYPES.subagents,
      LAYER_MEDIA_TYPES.memory,
    ];
    expect([...LAYER_ORDER]).toEqual(expectedOrder);
  });

  it("should not include config or sourceSnapshot in LAYER_ORDER", () => {
    expect(LAYER_ORDER).not.toContain(LAYER_MEDIA_TYPES.config);
    expect(LAYER_ORDER).not.toContain(LAYER_MEDIA_TYPES.sourceSnapshot);
  });
});
