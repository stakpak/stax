export const ARTIFACT_TYPE_AGENT = "application/vnd.stax.agent.v1";
export const ARTIFACT_TYPE_PACKAGE = "application/vnd.stax.package.v1";
export const ARTIFACT_TYPE_PROFILE = "application/vnd.stax.profile.v1";
export const ARTIFACT_TYPE_SOURCE = "application/vnd.stax.source.v1";

export const CONFIG_MEDIA_TYPES = {
  agent: "application/vnd.stax.config.v1+json",
  profile: "application/vnd.stax.profile.config.v1+json",
  source: "application/vnd.stax.source.config.v1+json",
} as const;

export const LAYER_MEDIA_TYPES = {
  config: "application/vnd.stax.config.v1+json",
  persona: "application/vnd.stax.persona.v1+json",
  prompt: "application/vnd.stax.prompt.v1+markdown",
  mcp: "application/vnd.stax.mcp.v1+json",
  skills: "application/vnd.stax.skills.v1.tar+gzip",
  rules: "application/vnd.stax.rules.v1.tar+gzip",
  knowledge: "application/vnd.stax.knowledge.v1.tar+gzip",
  memory: "application/vnd.stax.memory.v1.tar+gzip",
  surfaces: "application/vnd.stax.surfaces.v1.tar+gzip",
  instructionTree: "application/vnd.stax.instruction-tree.v1.tar+gzip",
  subagents: "application/vnd.stax.subagents.v1+json",
  secrets: "application/vnd.stax.secrets.v1+json",
  packages: "application/vnd.stax.packages.v1+json",
  sourceSnapshot: "application/vnd.stax.source.snapshot.v1.tar+gzip",
} as const;

export const REFERRER_TYPES = {
  signature: "application/vnd.stax.signature.v1",
  evaluation: "application/vnd.stax.evaluation.v1",
  approval: "application/vnd.stax.approval.v1",
  memorySnapshot: "application/vnd.stax.memory-snapshot.v1",
} as const;

/** Canonical layer ordering for stable digests */
export const LAYER_ORDER = [
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
] as const;
