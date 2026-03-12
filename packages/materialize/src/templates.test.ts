import { describe, expect, it } from "vitest";
import { renderPromptTemplates } from "./templates.ts";

describe("renderPromptTemplates", () => {
  it("should replace {{persona.name}} with persona name", () => {
    const result = renderPromptTemplates("You are {{persona.name}}", {
      persona: {
        name: "maya-chen",
        displayName: "Maya Chen",
        role: "Senior Engineer",
      },
    });

    expect(result).toBe("You are maya-chen");
  });

  it("should replace {{persona.displayName}}", () => {
    const result = renderPromptTemplates("Hello, {{persona.displayName}}", {
      persona: {
        name: "maya-chen",
        displayName: "Maya Chen",
        role: "Senior Engineer",
      },
    });

    expect(result).toBe("Hello, Maya Chen");
  });

  it("should replace {{persona.role}}", () => {
    const result = renderPromptTemplates("Your role: {{persona.role}}", {
      persona: {
        name: "maya-chen",
        displayName: "Maya Chen",
        role: "Senior Engineer",
      },
    });

    expect(result).toBe("Your role: Senior Engineer");
  });

  it("should handle multiple template expressions", () => {
    const result = renderPromptTemplates("You are {{persona.displayName}}, a {{persona.role}}", {
      persona: {
        name: "maya-chen",
        displayName: "Maya Chen",
        role: "Senior Engineer",
      },
    });

    expect(result).toBe("You are Maya Chen, a Senior Engineer");
  });

  it("should return template unchanged when no persona provided", () => {
    const template = "You are {{persona.name}}";
    const result = renderPromptTemplates(template, {});
    expect(result).toBe(template);
  });

  it("should handle template with no expressions", () => {
    const result = renderPromptTemplates("No templates here", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Test",
      },
    });

    expect(result).toBe("No templates here");
  });

  it("should handle {{persona.background}} expression", () => {
    const result = renderPromptTemplates("Background: {{persona.background}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
        background: "10 years experience",
      },
    });
    expect(result).toBe("Background: 10 years experience");
  });

  it("should resolve missing persona fields to empty string", () => {
    const result = renderPromptTemplates("Background: {{persona.background}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
      },
    });
    expect(result).toBe("Background: ");
  });

  it("should handle nested persona field expressions", () => {
    const result = renderPromptTemplates("Primary skills: {{persona.expertise.primary}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
        expertise: { primary: ["Go", "Rust", "TypeScript"] },
      },
    });
    // Array values should render as comma-separated
    expect(result).toContain("Go");
    expect(result).toContain("Rust");
    expect(result).toContain("TypeScript");
  });

  it("should handle escaped template expressions", () => {
    const result = renderPromptTemplates("Literal: \\{{persona.name}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
      },
    });
    expect(result).toContain("{{persona.name}}");
  });

  it("should not execute arbitrary code in expressions", () => {
    const result = renderPromptTemplates("{{constructor.constructor('return 1')()}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
      },
    });
    // Should resolve to empty string, not execute code
    expect(result).toBe("");
  });

  it("should handle template with whitespace around expression", () => {
    const result = renderPromptTemplates("Hello {{ persona.name }}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
      },
    });
    // Implementations may or may not trim whitespace in expressions
    // but should not crash
    expect(typeof result).toBe("string");
  });

  it("should handle unrecognized expressions as empty string", () => {
    const result = renderPromptTemplates("Value: {{unknown.field}}", {
      persona: {
        name: "test",
        displayName: "Test",
        role: "Tester",
      },
    });
    expect(result).toBe("Value: ");
  });

  it("should preserve surrounding whitespace and newlines", () => {
    const template = "Line 1\n\nYou are {{persona.name}}\n\nLine 3";
    const result = renderPromptTemplates(template, {
      persona: {
        name: "maya",
        displayName: "Maya",
        role: "Engineer",
      },
    });
    expect(result).toBe("Line 1\n\nYou are maya\n\nLine 3");
  });

  it("should handle template with only expressions", () => {
    const result = renderPromptTemplates("{{persona.displayName}}", {
      persona: {
        name: "test",
        displayName: "Test Person",
        role: "Tester",
      },
    });
    expect(result).toBe("Test Person");
  });
});
