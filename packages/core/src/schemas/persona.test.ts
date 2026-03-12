import { describe, expect, it } from "vitest";
import { personaSchema } from "./persona.ts";

describe("personaSchema", () => {
  const validPersona = {
    name: "maya-chen",
    displayName: "Maya Chen",
    role: "Senior Backend Engineer",
  };

  it("should validate a minimal valid persona", () => {
    const result = personaSchema.safeParse(validPersona);
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const { name: _, ...noName } = validPersona;
    const result = personaSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("should require displayName", () => {
    const { displayName: _, ...noDisplayName } = validPersona;
    const result = personaSchema.safeParse(noDisplayName);
    expect(result.success).toBe(false);
  });

  it("should require role", () => {
    const { role: _, ...noRole } = validPersona;
    const result = personaSchema.safeParse(noRole);
    expect(result.success).toBe(false);
  });

  it("should enforce name regex matching agent name rules", () => {
    const valid = ["a", "ab", "maya-chen", "persona-123"];
    const invalid = ["-start", "end-", "UPPER", "under_score", "", "a".repeat(64)];

    for (const name of valid) {
      const result = personaSchema.safeParse({ ...validPersona, name });
      expect(result.success, `Expected "${name}" to be valid`).toBe(true);
    }

    for (const name of invalid) {
      const result = personaSchema.safeParse({ ...validPersona, name });
      expect(result.success, `Expected "${name}" to be invalid`).toBe(false);
    }
  });

  it("should reject empty displayName", () => {
    const result = personaSchema.safeParse({ ...validPersona, displayName: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty role", () => {
    const result = personaSchema.safeParse({ ...validPersona, role: "" });
    expect(result.success).toBe(false);
  });

  it("should accept optional background string", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      background: "10 years of distributed systems experience",
    });
    expect(result.success).toBe(true);
  });

  it("should accept expertise with primary, secondary, learning arrays", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      expertise: {
        primary: ["Go", "Rust"],
        secondary: ["TypeScript"],
        learning: ["WebAssembly"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid communicationStyle values", () => {
    const styles = ["direct", "diplomatic", "academic", "casual", "formal"];
    for (const communicationStyle of styles) {
      const result = personaSchema.safeParse({
        ...validPersona,
        personality: { communicationStyle },
      });
      expect(result.success, `Expected "${communicationStyle}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid communicationStyle", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      personality: { communicationStyle: "aggressive" },
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid verbosity values", () => {
    const levels = ["minimal", "concise", "balanced", "detailed", "verbose"];
    for (const verbosity of levels) {
      const result = personaSchema.safeParse({
        ...validPersona,
        personality: { verbosity },
      });
      expect(result.success, `Expected "${verbosity}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid verbosity", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      personality: { verbosity: "extreme" },
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid codeComments values", () => {
    const levels = ["none", "minimal", "moderate", "thorough"];
    for (const codeComments of levels) {
      const result = personaSchema.safeParse({
        ...validPersona,
        voice: { codeComments },
      });
      expect(result.success, `Expected "${codeComments}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid codeComments", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      voice: { codeComments: "excessive" },
    });
    expect(result.success).toBe(false);
  });

  it("should accept full persona with all fields", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      background: "experienced engineer",
      expertise: {
        primary: ["Go", "Rust"],
        secondary: ["TypeScript"],
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
      preferences: { indentation: "tabs" },
      boundaries: {
        willNot: ["write untested code"],
        always: ["suggest tests"],
        escalates: ["security concerns"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept specVersion field", () => {
    const result = personaSchema.safeParse({
      ...validPersona,
      specVersion: "1.0.0",
    });
    expect(result.success).toBe(true);
  });
});
