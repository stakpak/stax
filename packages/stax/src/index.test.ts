import { describe, expect, it } from "vitest";
import {
  defineAgent,
  defineMcp,
  definePackage,
  definePersona,
  defineSubagents,
  schemas,
} from "./index.ts";

describe("stax main entry point", () => {
  it("should re-export defineAgent", () => {
    expect(defineAgent).toBeTypeOf("function");
  });

  it("should re-export definePackage", () => {
    expect(definePackage).toBeTypeOf("function");
  });

  it("should re-export definePersona", () => {
    expect(definePersona).toBeTypeOf("function");
  });

  it("should re-export defineMcp", () => {
    expect(defineMcp).toBeTypeOf("function");
  });

  it("should re-export defineSubagents", () => {
    expect(defineSubagents).toBeTypeOf("function");
  });

  it("should re-export schemas", () => {
    expect(schemas).toBeDefined();
    expect(schemas.agentSchema).toBeDefined();
    expect(schemas.packageSchema).toBeDefined();
    expect(schemas.personaSchema).toBeDefined();
    expect(schemas.mcpSchema).toBeDefined();
    expect(schemas.subagentsSchema).toBeDefined();
  });
});
