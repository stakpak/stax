// ─── Identity ───────────────────────────────────────────

export interface AgentDefinition {
  specVersion?: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  url?: string;
  tags?: string[];

  adapter: AdapterConfig;
  adapterFallback?: AdapterConfig[];

  persona?: string;
  prompt?: string;
  mcp?: string;
  skills?: string;
  rules?: string;
  knowledge?: string;
  memory?: string;
  surfaces?: string;
  instructionTree?: string;
  subagents?: string;

  hints?: RuntimeHints;
  secrets?: SecretDeclaration[];
  workspaceSources?: WorkspaceSourceReference[];
  packages?: PackageReference[];
}

export interface PackageDefinition {
  specVersion?: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  tags?: string[];

  mcp?: string;
  skills?: string;
  rules?: string;
  knowledge?: string;
  surfaces?: string;
  secrets?: string;
  packages?: PackageReference[];
}

export interface PersonaDefinition {
  specVersion?: string;
  name: string;
  displayName: string;
  role: string;
  background?: string;

  expertise?: {
    primary?: string[];
    secondary?: string[];
    learning?: string[];
  };

  personality?: {
    traits?: string[];
    communicationStyle?: "direct" | "diplomatic" | "academic" | "casual" | "formal";
    verbosity?: "minimal" | "concise" | "balanced" | "detailed" | "verbose";
  };

  voice?: {
    tone?: string;
    codeComments?: "none" | "minimal" | "moderate" | "thorough";
    patterns?: string[];
    avoid?: string[];
  };

  values?: string[];
  preferences?: Record<string, unknown>;
  boundaries?: {
    willNot?: string[];
    always?: string[];
    escalates?: string[];
  };
}

// ─── MCP ────────────────────────────────────────────────

export interface McpConfig {
  specVersion?: string;
  servers: Record<string, McpServer>;
}

export type McpServer = McpStdioServer | McpHttpServer;

export interface McpServerBase {
  description?: string;
  secrets?: string[];
  enabledTools?: string[];
  disabledTools?: string[];
  enabled?: boolean;
  connectTimeoutMs?: number;
  metadata?: Record<string, string>;
  registryRef?: {
    registry?: string;
    package: string;
    version?: string;
    digest?: string;
  };
}

export interface McpStdioServer extends McpServerBase {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface McpHttpServer extends McpServerBase {
  url: string;
  transport: "http" | "sse";
  headers?: Record<string, string>;
}

// ─── Subagents ──────────────────────────────────────────

export interface SubagentsDefinition {
  specVersion?: string;
  agents: Record<string, SubagentDefinition>;
}

export interface SubagentDefinition {
  description: string;
  invocation?: "manual" | "delegate" | "automatic";
  instructions: string;
  model?: string;
  tags?: string[];
  handoff?: {
    allowedFrom?: string[];
    returnMode?: "report" | "patch" | "continue";
  };
  metadata?: Record<string, string>;
}

// ─── Secrets ────────────────────────────────────────────

export interface SecretDeclaration {
  key: string;
  required: boolean;
  description?: string;
  kind?: "api-key" | "token" | "password" | "certificate" | "connection-string" | "url" | "opaque";
  exposeAs?: {
    env?: string;
    file?: string;
  };
}

// ─── Runtime Hints ──────────────────────────────────────

export interface RuntimeHints {
  isolation?: "process" | "container" | "gvisor" | "microvm";
  capabilities?: {
    shell?: boolean;
    processes?: boolean;
    docker?: boolean;
    network?: NetworkHint;
    filesystem?: FilesystemHint;
  };
}

export interface NetworkHint {
  mode: "none" | "restricted" | "full";
  allowlist?: string[];
}

export interface FilesystemHint {
  workspace?: string;
  writable?: string[];
  denyRead?: string[];
}

// ─── Adapter ────────────────────────────────────────────

export interface AdapterConfig {
  type: string;
  runtime: string;
  adapterVersion: string;
  runtimeVersionRange?: string;
  model?: string;
  modelParams?: Record<string, unknown>;
  importMode?: "filesystem" | "api" | "bundle" | "object-map";
  fidelity?: "byte-exact" | "schema-exact" | "best-effort" | "unsupported";
  config: Record<string, unknown>;
  features: AdapterFeatureMap;
  targets?: MaterializationTarget[];
}

export interface AdapterFeatureMap {
  prompt?: "native" | "embedded" | "unsupported";
  persona?: "native" | "embedded" | "unsupported";
  rules?: "native" | "embedded" | "translated" | "unsupported";
  skills?: "native" | "translated" | "unsupported";
  mcp?: "native" | "translated" | "unsupported";
  surfaces?: "native" | "embedded" | "translated" | "unsupported";
  secrets?: "native" | "consumer-only";
  toolPermissions?: "native" | "translated" | "unsupported";
  modelConfig?: "native" | "translated" | "unsupported";
  exactMode?: boolean;
}

export interface MaterializationTarget {
  kind: "file" | "directory" | "setting" | "api" | "bundle" | "object";
  path: string;
  description?: string;
  scope?: "user" | "project" | "workspace" | "local" | "remote" | "account" | "organization";
  exact?: boolean;
  mediaType?: string;
}

// ─── Workspace Sources ──────────────────────────────────

export interface WorkspaceSourceReference {
  id: string;
  ref: string;
  mountPath: string;
  writable?: boolean;
  required?: boolean;
  subpath?: string;
}

// ─── Knowledge ──────────────────────────────────────────

export interface KnowledgeManifest {
  specVersion: string;
  files: Record<
    string,
    {
      title?: string;
      tags?: string[];
      source?: string;
      chunkHint?: string;
    }
  >;
}

// ─── Memory ─────────────────────────────────────────────

export interface MemoryMeta {
  specVersion: string;
  snapshotId: string;
  scope: {
    type: "agent" | "user" | "workspace" | "project" | "session";
    id: string;
  };
  sourceArtifact: string;
  parentSnapshot: string | null;
  createdAt: string;
}

// ─── Rules ──────────────────────────────────────────────

export interface RuleDefinition {
  id: string;
  scope: "always" | "glob" | "auto" | "manual";
  globs?: string[];
  priority?: number;
  severity?: "info" | "warn" | "error";
  description?: string;
  tags?: string[];
  triggers?: string[];
  content: string;
}

// ─── Skills ─────────────────────────────────────────────

export interface SkillDefinition {
  name: string;
  description: string;
  allowedTools?: string[];
  model?: string;
  userInvocable?: boolean;
  argumentHint?: string;
  priority?: number;
  tags?: string[];
  content: string;
}

// ─── Surfaces ───────────────────────────────────────────

export interface SurfaceDefinition {
  instructions?: string;
  persona?: string;
  tools?: string;
  identity?: string;
  user?: string;
  heartbeat?: string;
  bootstrap?: string;
}

// ─── Instruction Tree ───────────────────────────────────

export interface InstructionTree {
  _root?: {
    instructions: string;
  };
  [path: string]:
    | {
        instructions: string;
      }
    | undefined;
}

// ─── Package Reference ──────────────────────────────────

export type PackageReference = string;
