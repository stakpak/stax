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
    adapterFallback?: AdapterConfig[];
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

export interface RenderedFile {
  path: string;
  content: string | Uint8Array;
}

export interface RenderedMaterialization {
  agent: MaterializedAgent;
  adapter: AdapterConfig;
  files: RenderedFile[];
  warnings: MaterializationWarning[];
  fidelity: "byte-exact" | "schema-exact" | "best-effort" | "unsupported";
  lossy: boolean;
}

export interface ApplyMaterializationResult {
  outDir: string;
  written: string[];
}

export interface InstallPlan {
  /** Selected adapter after fallback resolution */
  selectedAdapter?: string;
  /** Fidelity class of the materialization */
  fidelity?: "byte-exact" | "schema-exact" | "best-effort" | "unsupported";
  /** Whether any lossy translations occurred */
  lossy?: boolean;
  /** Package provenance — which packages contributed to the final output */
  mergedPackageProvenance?: string[];
  actions: InstallAction[];
  warnings: MaterializationWarning[];
}

export interface InstallAction {
  kind: "write" | "mkdir" | "setting" | "api-call";
  path: string;
  description: string;
  content?: string;
}
