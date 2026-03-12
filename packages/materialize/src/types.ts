import type { AdapterConfig, McpConfig, PersonaDefinition, SecretDeclaration } from "@stax/core";

export interface MaterializeOptions {
  /** OCI reference or local path */
  source: string;
  /** Output directory */
  outDir: string;
  /** Override adapter type */
  adapter?: string;
  /** Exact mode — fail if adapter can't faithfully reproduce */
  exact?: boolean;
}

export interface MaterializedAgent {
  config: {
    specVersion: string;
    name: string;
    version: string;
    description: string;
    adapter: AdapterConfig;
  };
  prompt?: string;
  persona?: PersonaDefinition;
  surfaces?: MaterializedSurface[];
  instructionTree?: MaterializedInstructionNode[];
  subagents?: MaterializedSubagent[];
  workspaceSources?: MaterializedWorkspaceSource[];
  mcp?: McpConfig;
  skills?: MaterializedSkill[];
  rules?: MaterializedRule[];
  knowledge?: MaterializedKnowledgeFile[];
  memory?: MaterializedMemoryFile[];
  secrets?: SecretDeclaration[];
  warnings: MaterializationWarning[];
}

export interface MaterializedInstructionNode {
  path: string;
  instructions: string;
}

export interface MaterializedSurface {
  name: string;
  content: string;
}

export interface MaterializedSubagent {
  name: string;
  description: string;
  invocation: string;
  instructions: string;
  model?: string;
}

export interface MaterializedWorkspaceSource {
  id: string;
  mountPath: string;
  resolved: boolean;
}

export interface MaterializedSkill {
  name: string;
  path: string;
  content: string;
}

export interface MaterializedRule {
  id: string;
  scope: string;
  content: string;
  priority: number;
}

export interface MaterializedKnowledgeFile {
  path: string;
  content: Uint8Array;
}

export interface MaterializedMemoryFile {
  path: string;
  content: Uint8Array;
}

export interface MaterializationWarning {
  code: string;
  message: string;
  layer?: string;
}

export interface InstallPlan {
  actions: InstallAction[];
  warnings: MaterializationWarning[];
}

export interface InstallAction {
  kind: "write" | "mkdir" | "setting" | "api-call";
  path: string;
  description: string;
  content?: string;
}
