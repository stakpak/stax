// Re-export everything from @stax/core as the main entry point
// Usage: import { defineAgent } from "stax";

export {
  defineAgent,
  definePackage,
  definePersona,
  defineMcp,
  defineSubagents,
  schemas,
  NAME_REGEX,
  SEMVER_REGEX,
  createPackageLayerPayload,
  decodePackageLayerReferences,
} from "@stax/core";

export { defineAdapter } from "@stax/adapter-core";

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
  PackageLayerEntry,
  PackageLayerPayload,
} from "@stax/core";
