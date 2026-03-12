import { describe, expect, it } from "vitest";
import { definePersona } from "./persona.ts";

describe("definePersona", () => {
  it("should return the persona definition when valid", () => {
    const def = definePersona({
      name: "maya-chen",
      displayName: "Maya Chen",
      role: "Senior Backend Engineer",
    });

    expect(def.name).toBe("maya-chen");
    expect(def.displayName).toBe("Maya Chen");
    expect(def.role).toBe("Senior Backend Engineer");
  });

  it("should accept full persona with all fields", () => {
    const def = definePersona({
      name: "maya-chen",
      displayName: "Maya Chen",
      role: "Senior Backend Engineer",
      background: "10 years of distributed systems experience",
      expertise: {
        primary: ["Go", "Rust", "distributed-systems"],
        secondary: ["TypeScript", "Python"],
        learning: ["WebAssembly"],
      },
      personality: {
        traits: ["methodical", "curious"],
        communicationStyle: "direct",
        verbosity: "concise",
      },
      voice: {
        tone: "confident but approachable",
        codeComments: "minimal",
        patterns: ["uses analogies"],
        avoid: ["filler words"],
      },
      values: ["correctness", "simplicity"],
      boundaries: {
        willNot: ["write untested code"],
        always: ["suggest tests"],
        escalates: ["security concerns"],
      },
    });

    expect(def.expertise!.primary).toContain("Go");
    expect(def.personality!.communicationStyle).toBe("direct");
    expect(def.voice!.codeComments).toBe("minimal");
  });

  it("should reject missing required fields", () => {
    expect(() => definePersona({} as any)).toThrow();
  });

  it("should reject invalid communication style", () => {
    expect(() =>
      definePersona({
        name: "test",
        displayName: "Test",
        role: "Test",
        personality: { communicationStyle: "invalid" as any },
      }),
    ).toThrow();
  });

  it("should reject invalid verbosity", () => {
    expect(() =>
      definePersona({
        name: "test",
        displayName: "Test",
        role: "Test",
        personality: { verbosity: "invalid" as any },
      }),
    ).toThrow();
  });

  it("should reject names with uppercase", () => {
    expect(() =>
      definePersona({
        name: "MayaChen",
        displayName: "Maya",
        role: "Engineer",
      }),
    ).toThrow();
  });

  it("should reject names with underscores", () => {
    expect(() =>
      definePersona({
        name: "maya_chen",
        displayName: "Maya",
        role: "Engineer",
      }),
    ).toThrow();
  });

  it("should accept persona with values array", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      values: ["correctness", "simplicity", "pragmatism"],
    });
    expect(def.values).toHaveLength(3);
  });

  it("should accept persona with preferences record", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      preferences: { indentation: "tabs", lineWidth: 100 },
    });
    expect(def.preferences!.indentation).toBe("tabs");
  });

  it("should accept specVersion", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      specVersion: "1.0.0",
    });
    expect(def.specVersion).toBe("1.0.0");
  });

  it("should reject empty name", () => {
    expect(() =>
      definePersona({
        name: "",
        displayName: "Test",
        role: "Tester",
      }),
    ).toThrow();
  });

  it("should accept all valid voice codeComments levels", () => {
    const levels = ["none", "minimal", "moderate", "thorough"] as const;
    for (const codeComments of levels) {
      const def = definePersona({
        name: "test",
        displayName: "Test",
        role: "Tester",
        voice: { codeComments },
      });
      expect(def.voice!.codeComments).toBe(codeComments);
    }
  });

  it("should reject invalid codeComments level", () => {
    expect(() =>
      definePersona({
        name: "test",
        displayName: "Test",
        role: "Tester",
        voice: { codeComments: "excessive" as any },
      }),
    ).toThrow();
  });

  it("should accept persona with voice patterns and avoid", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      voice: {
        tone: "professional",
        patterns: ["uses analogies", "provides examples"],
        avoid: ["filler words", "excessive jargon"],
      },
    });
    expect(def.voice!.patterns).toHaveLength(2);
    expect(def.voice!.avoid).toHaveLength(2);
  });

  it("should accept expertise with only primary", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      expertise: { primary: ["Go"] },
    });
    expect(def.expertise!.primary).toContain("Go");
  });

  it("should accept boundaries with all fields", () => {
    const def = definePersona({
      name: "test",
      displayName: "Test",
      role: "Tester",
      boundaries: {
        willNot: ["write untested code", "skip reviews"],
        always: ["suggest tests", "document decisions"],
        escalates: ["security concerns", "architecture changes"],
      },
    });
    expect(def.boundaries!.willNot).toHaveLength(2);
    expect(def.boundaries!.always).toHaveLength(2);
    expect(def.boundaries!.escalates).toHaveLength(2);
  });
});
