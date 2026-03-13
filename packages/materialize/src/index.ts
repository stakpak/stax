export { materialize } from "./materialize.ts";
export { renderMaterialization, applyMaterialization } from "./render.ts";
export { planInstall } from "./plan.ts";
export { renderPromptTemplates } from "./templates.ts";

export type {
  MaterializeOptions,
  MaterializedAgent,
  MaterializedSkill,
  MaterializedRule,
  MaterializedKnowledgeFile,
  MaterializedMemoryFile,
  MaterializedSubagent,
  MaterializedSurface,
  MaterializedWorkspaceSource,
  MaterializationWarning,
  RenderedFile,
  RenderedMaterialization,
  ApplyMaterializationResult,
  InstallPlan,
  InstallAction,
} from "./types.ts";
