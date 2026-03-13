# 15 — Materialization

## Overview

Materialization is the consumer-side process of turning a canonical stax artifact into runtime-native files, settings, API payloads, bundles, and remote objects.

This spec exists so that different consumers can produce predictably similar outputs from the same artifact.

In `1.0.0`, filesystem materialization remains the most exact mode for many runtimes, but non-filesystem consumers are first-class. Richer marketplace and broker workflows remain forward draft work described in [25 — Hosted Platform Adapter Contract](./25-hosted-platform-adapter-contract.md).

## Materialization modes

Consumers SHOULD support two materialization modes:

- `portable` — best-effort translation into a runtime
- `exact` — only succeed if the adapter can write the runtime's documented file contract without lossy synthesis

In `exact` mode, a consumer MUST fail if the runtime file contract cannot be represented faithfully. Consumers SHOULD check the adapter's `exactMode` flag (see [12 — Adapters](./12-adapters.md)) — if `exactMode` is not `true`, the consumer MUST warn that exact materialization may be incomplete and SHOULD fail unless overridden.

## Materialization pipeline

A conforming consumer SHOULD execute materialization in this order:

1. **Load artifact** — read the OCI manifest and config blob
2. **Validate compatibility** — check `specVersion`, artifact type, adapter support, and layer constraints. If the primary `adapter` is not compatible, try each `adapterFallback` entry in order as described in [01 — Agent Manifest](./01-agent-manifest.md)
3. **Resolve packages** — if consuming source projects, resolve package dependencies; if consuming built artifacts, read the resolved packages layer
4. **Resolve workspace sources** — pull and prepare any referenced source artifacts described in [22 — Workspace Sources](./22-workspace-sources.md)
5. **Merge canonical layers** — apply package merge semantics from [05 — Packages](./05-packages.md)
6. **Render prompt templates** — substitute persona values into prompt text
7. **Translate canonical layers** — map prompt, persona, surfaces, instruction trees, subagents, rules, skills, MCP, and adapter config into runtime-native outputs
8. **Validate required secrets** — ensure all required secrets are available before launch when the consumer is preparing an executable environment
9. **Emit outputs** — write files, directories, settings, remote payloads, or return a machine-readable plan

## Canonical materialized model

Before runtime-specific translation, a consumer SHOULD construct an in-memory canonical model equivalent to:

```typescript
interface MaterializedAgent {
  config: AgentConfig;
  prompt?: string; // rendered prompt
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
```

This model is not required to be serialized, but `stax materialize --json` SHOULD expose something close to it.

## Prompt rendering

Consumers MUST render prompt templates before embedding or writing prompt instructions.

Rules:

- only `{{persona.*}}` expressions are standardized in `1.0.0`
- missing values resolve to empty string by default
- consumers MAY offer strict mode that fails on missing values
- rendered prompts SHOULD preserve surrounding whitespace as closely as possible

## Runtime-native outputs

An adapter advertises `targets`. Consumers SHOULD write those targets when the runtime supports them.

Examples:

- Claude Code: `CLAUDE.md`, `.mcp.json`, `.claude/settings.json`, `.claude/skills/`
- OpenClaw: `<workspace>/AGENTS.md`, `<workspace>/SOUL.md`, `<workspace>/TOOLS.md`, `<workspace>/skills/`
- Codex: `AGENTS.md`, `.codex/config.toml`
- Hosted platform: `POST /v1/agents/import`, object records, or import bundles

## Lossy translation

When a runtime cannot represent a canonical feature exactly, consumers MUST choose one of these behaviors:

1. embed the feature into another supported surface such as the prompt
2. omit it and emit a warning
3. fail materialization if policy requires exact support

Consumers SHOULD NOT silently drop:

- rules
- MCP servers
- tool permission restrictions
- prompt or persona content

## Secrets during materialization

If materialization only writes files, a consumer MAY defer secret validation.

If materialization prepares a runnable environment, the consumer MUST validate required secrets before launch.

Consumers MUST NOT write secret values into generated instruction files unless that is explicitly part of a secure runtime-specific secret injection mechanism.

## Output safety

Consumers writing files MUST:

- keep generated paths within the selected output root
- avoid overwriting unrelated files unless explicitly allowed
- create directories with safe permissions
- preserve canonical archive structure for skills and knowledge where applicable

## Machine-readable output

Consumers SHOULD support a JSON mode that includes:

- selected adapter
- written targets or planned targets
- compatibility summary
- fidelity class
- lossy flag
- warnings
- unsupported features
- merged package provenance

## Install-plan baseline

Consumers SHOULD be able to produce an install plan without mutating a filesystem or remote consumer.

A baseline install plan SHOULD include:

- selected adapter
- consumer identity
- compatibility result
- fidelity result
- planned targets
- warnings
- trust summary when available

## Provenance and warnings

Consumers SHOULD record warnings for:

- unsupported adapter features
- dropped rule metadata
- unrepresentable MCP fields
- missing optional layers
- package conflicts resolved by precedence
- inability to honor exact runtime file placement or byte-preserving surface mapping
