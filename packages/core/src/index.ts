// Types
export type {
  AgentDefinition,
  PackageDefinition,
  PersonaDefinition,
  McpConfig,
  McpServer,
  McpStdioServer,
  McpHttpServer,
  SubagentsDefinition,
  SubagentDefinition,
  SecretDeclaration,
  RuntimeHints,
  AdapterConfig,
  AdapterFeatureMap,
  MaterializationTarget,
  WorkspaceSourceReference,
  KnowledgeManifest,
  MemoryMeta,
  RuleDefinition,
  SkillDefinition,
  SurfaceDefinition,
  InstructionTree,
  DetectedFile,
  DetectionResult,
} from "./types.ts";

// Define functions
export { defineAgent } from "./define/agent.ts";
export { definePackage } from "./define/package.ts";
export { definePersona } from "./define/persona.ts";
export { defineMcp } from "./define/mcp.ts";
export { defineSubagents } from "./define/subagents.ts";

// Shared helpers
export { NAME_REGEX, SEMVER_REGEX } from "./validation.ts";
export {
  createPackageLayerPayload,
  decodePackageLayerReferences,
  type PackageLayerEntry,
  type PackageLayerPayload,
} from "./package-refs.ts";

// Schemas
export * as schemas from "./schemas/index.ts";
