# 12 — Adapters

## Overview

Adapters bridge stax's canonical format and runtime-specific configuration. Each adapter understands one runtime family and provides:

1. typed authoring-time configuration
2. materialization targets and feature metadata
3. model and permission configuration for the target runtime

Adapters do **not** directly run agents. They describe how a consumer should materialize an artifact for a runtime.

For runtimes with stable dot-directory contracts such as Claude Code and OpenClaw, adapters SHOULD declare exact file targets and scope (`user`, `project`, `workspace`, `local`) so consumers can write files in the exact locations the runtime expects.

## Adapter output contract

All adapters MUST compile to the same shape.

```typescript
interface AdapterConfig {
  type: string;                         // e.g. "claude"
  runtime: string;                      // e.g. "claude-code"
  adapterVersion: string;               // schema version for this adapter payload
  model?: string;
  modelParams?: Record<string, unknown>;
  config: Record<string, unknown>;      // runtime-specific options
  features: AdapterFeatureMap;          // translation capabilities
  targets?: MaterializationTarget[];    // runtime-native files/settings
}

interface AdapterFeatureMap {
  prompt?: 'native' | 'embedded' | 'unsupported';
  persona?: 'native' | 'embedded' | 'unsupported';
  rules?: 'native' | 'embedded' | 'unsupported';
  skills?: 'native' | 'unsupported';
  mcp?: 'native' | 'translated' | 'unsupported';
  surfaces?: 'native' | 'translated' | 'unsupported';
  secrets?: 'native' | 'consumer-only';
  toolPermissions?: 'native' | 'translated' | 'unsupported';
  modelConfig?: 'native' | 'translated' | 'unsupported';
  exactMode?: boolean;
}

interface MaterializationTarget {
  kind: 'file' | 'directory' | 'setting';
  path: string;
  description?: string;
  scope?: 'user' | 'project' | 'workspace' | 'local';
  exact?: boolean;
}
```

Consumers MUST treat unknown `config` fields as adapter-specific. Consumers SHOULD ignore unknown additive fields within a supported `adapterVersion` major.

### `modelParams` validation

`modelParams` is a pass-through bag of model configuration (temperature, top_p, max_tokens, etc.). Adapters and consumers MUST apply the following rules:

- Adapters SHOULD document which `modelParams` keys they support and their valid ranges
- Consumers MUST validate `modelParams` values against the target model's constraints when known (e.g., `temperature` MUST be a number between 0 and 2 for most models)
- Consumers MUST reject `modelParams` keys that contain non-alphanumeric characters other than `_` and `-`
- Consumers MUST warn on unrecognized `modelParams` keys rather than silently ignoring them
- Builders SHOULD validate `modelParams` types at build time (e.g., `temperature` is a number, not a string)

### `exactMode` semantics

The `exactMode` field in `AdapterFeatureMap` indicates whether the adapter supports exact runtime file materialization — writing files byte-for-byte into the runtime's documented directory structure.

- `exactMode: true` — the adapter declares that its `targets` list is complete and covers the runtime's full file contract. Consumers operating in `exact` materialization mode (see [15 — Materialization](./15-materialization.md)) SHOULD prefer adapters with `exactMode: true`
- `exactMode: false` or omitted — the adapter provides best-effort targets. Consumers operating in `exact` mode MUST warn or fail if `exactMode` is not `true`
- `exactMode` is an adapter-level declaration about capability, not a consumer-level mode selector. The consumer's materialization mode (`portable` vs `exact`) determines behavior; `exactMode` on the adapter tells the consumer whether exact materialization is feasible

### Adapter versioning

`adapterVersion` MUST be a valid semver string. Consumers SHOULD interpret it as follows:

- **Major version change** — breaking schema change in `config` or `features`. Consumers MUST reject unsupported major versions rather than guessing.
- **Minor version change** — new optional fields added. Consumers SHOULD accept and ignore unknown additive fields within the same major.
- **Patch version change** — bug fixes or documentation clarifications only. No schema changes.

When a consumer encounters an `adapterVersion` with a higher major version than it supports, it MUST skip that adapter (trying fallbacks if available) or fail with exit code 5.

### Adapter config safety

Although `config` is typed as `Record<string, unknown>`, consumers MUST apply the following safety rules:

- Consumers MUST NOT execute, eval, or shell-expand values from `config`
- Consumers MUST validate `config` values against the expected adapter schema before applying them
- Consumers SHOULD reject `config` entries that contain shell metacharacters, path traversals, or URLs in fields not expected to contain them
- Adapters SHOULD document their `config` schema so consumers can validate it
- If a consumer cannot validate an adapter's `config` schema (e.g., unknown adapter type), it MUST warn and MAY refuse to materialize

## Usage

```typescript
import { defineAgent } from 'stax';
import claudeCode from '@stax/claude-code';

export default defineAgent({
  name: 'backend-engineer',
  version: '3.1.0',
  adapter: claudeCode({
    model: 'claude-opus-4-1',
    modelParams: { temperature: 0.3 },
    permissions: {
      allowedTools: ['Read', 'Edit', 'Bash', 'Grep'],
      denyRules: ['Bash(rm -rf *)'],
    },
  }),
});
```

## Official adapter examples

### `@stax/claude-code`

```typescript
claudeCode({
  model: 'claude-opus-4-1',
  modelParams: { temperature: 0.3 },
  permissions: {
    allowedTools: ['Read', 'Edit', 'Bash', 'Grep', 'Write'],
    denyRules: ['Bash(rm -rf *)'],
  },
});
```

Expected targets:

- `CLAUDE.md` or `.claude/CLAUDE.md`
- `.mcp.json`
- `.claude/settings.json`
- `.claude/skills/`

For Claude Code, adapters SHOULD support an exact materialization mode that writes files in the documented Claude scopes described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md) and [18 — Adapter: `@stax/claude-code`](./18-adapter-claude-code.md).

`@stax/claude` MAY exist as a compatibility alias, but `@stax/claude-code` is the canonical package name in spec `1.0.0`.

### `@stax/codex`

```typescript
codex({
  model: 'gpt-5-codex',
  approval: 'on-request',
  sandbox: 'workspace-write',
});
```

Expected targets:

- `AGENTS.md` and/or discovered nested `AGENTS.md` files
- `.codex/config.toml`
- repository or user skill locations described in [20 — Adapter: `@stax/codex`](./20-adapter-codex.md)

### `@stax/cursor`

```typescript
cursor({
  model: 'claude-sonnet-4-1',
});
```

Expected targets:

- `.cursor/rules/*.md`
- `.cursor/mcp.json`

### `@stax/windsurf`

```typescript
windsurf({
  model: 'claude-sonnet-4-1',
});
```

Expected targets:

- `.windsurf/rules/*.md`

### `@stax/openclaw`

For OpenClaw agent workspaces.

Expected targets:

- `<workspace>/AGENTS.md`
- `<workspace>/SOUL.md`
- `<workspace>/TOOLS.md`
- `<workspace>/IDENTITY.md`
- `<workspace>/USER.md`
- `<workspace>/HEARTBEAT.md`
- `<workspace>/BOOTSTRAP.md`
- `<workspace>/skills/`
- `<workspace>/memory/`

OpenClaw adapters SHOULD preserve exact Markdown bytes for mapped surface files and MUST NOT merge them into a single prompt document. See [19 — Adapter: `@stax/openclaw`](./19-adapter-openclaw.md).

### `@stax/generic`

```typescript
generic({
  model: 'any-model-id',
  runtime: 'my-custom-runtime',
  config: {}
});
```

## Feature value semantics

The `AdapterFeatureMap` uses three translation strategies. Their meanings are:

| Value | Meaning | When to use |
|-------|---------|-------------|
| `native` | The runtime has a first-class mechanism for this feature. The consumer writes it to a dedicated file or setting. | Claude Code rules → `.claude/rules/`, Cursor rules → `.cursor/rules/` |
| `embedded` | The runtime has no dedicated mechanism. The consumer embeds the content into another surface, typically the prompt or instruction file. | Persona → embedded as text in `CLAUDE.md` |
| `translated` | The runtime has a mechanism, but the canonical format requires structural transformation (not just file placement). | MCP canonical JSON → `.mcp.json` with different key names; surfaces → renamed workspace files |
| `unsupported` | The runtime cannot represent this feature at all. The consumer MUST warn and MAY omit it. | Skills on a runtime with no skill support |
| `consumer-only` | The feature is meaningful but resolution happens entirely at the consumer layer, not in the adapter. | Secrets — the adapter declares needs, the consumer resolves values |

Adapter authors MUST use `embedded` when content is inlined into a prompt-like file, and `translated` when content is written to a dedicated file but requires structural changes.

## Compatibility behavior

Consumers SHOULD:

1. check `type`, `runtime`, and `adapterVersion`
2. verify that required features can be materialized
3. warn on lossy translations
4. try `adapterFallback` when the primary adapter is unsupported

A consumer MUST fail clearly if no supported adapter can represent the artifact.

## Lossy translation policy

If a runtime cannot natively represent a canonical feature, a consumer MAY:

- embed it into prompt text
- surface a warning and omit it
- fail materialization if the feature is required by policy

Consumers SHOULD NOT silently drop material features such as rules, MCP servers, or tool permissions.

## Creating custom adapters

```typescript
import { defineAdapter } from 'stax';

export default defineAdapter<MyRuntimeOptions>((options) => ({
  type: 'my-runtime',
  runtime: 'my-runtime',
  adapterVersion: '1.0.0',
  model: options.model,
  config: {
    sandbox: options.sandbox,
  },
  features: {
    prompt: 'embedded',
    rules: 'embedded',
    mcp: 'unsupported',
  },
  targets: [
    { kind: 'file', path: 'MY_RUNTIME.md', description: 'Instructions' }
  ]
}));
```

Custom adapters MAY be published under any npm package name.
