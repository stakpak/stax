# 19 — Adapter: `@stax/openclaw`

## Overview

`@stax/openclaw` is the canonical stax adapter for OpenClaw workspaces.

Unlike single-prompt runtimes, OpenClaw expects multiple distinct workspace files with stable names and semantics. This adapter exists to preserve those files exactly.

This adapter targets the documented OpenClaw workspace contract described in [17 — Runtime File Contracts](./17-runtime-file-contracts.md).

## Design goal

`@stax/openclaw` MUST prioritize **byte-preserving named-file materialization** over prompt synthesis.

That means:

- keep `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, and `BOOTSTRAP.md` separate
- do not collapse them into one prompt file
- preserve the exact file identity when the source surface exists

## Adapter interface

```typescript
interface OpenClawAdapterOptions {
  model?: string;
  modelParams?: Record<string, unknown>;

  workspaceRoot?: string;              // consumer-selected output root
  exact?: boolean;                     // default: true for this adapter
  writeSkills?: boolean;               // default: true
  writeMemory?: boolean;               // default: true
  writeBootstrap?: boolean;            // default: true

  strictMissingSurfaces?: boolean;     // fail if expected OpenClaw surfaces are absent
  config?: Record<string, unknown>;    // runtime hints only; not ~/.openclaw/openclaw.json
}
```

The compiled adapter config SHOULD use:

```json
{
  "type": "openclaw",
  "runtime": "openclaw",
  "adapterVersion": "1.0.0"
}
```

## Exact target mapping

| stax source | Target |
|------------|--------|
| `surfaces/instructions.md` | `<workspace>/AGENTS.md` |
| `surfaces/persona.md` | `<workspace>/SOUL.md` |
| `surfaces/tools.md` | `<workspace>/TOOLS.md` |
| `surfaces/identity.md` | `<workspace>/IDENTITY.md` |
| `surfaces/user.md` | `<workspace>/USER.md` |
| `surfaces/heartbeat.md` | `<workspace>/HEARTBEAT.md` |
| `surfaces/bootstrap.md` | `<workspace>/BOOTSTRAP.md` |
| `skills/` | `<workspace>/skills/` |
| `memory/` | `<workspace>/memory/` |

## Missing surface behavior

OpenClaw tolerates missing bootstrap files at runtime, but uses missing-file markers in prompt injection.

Therefore, the adapter SHOULD support two behaviors:

### Strict mode

Fail materialization if a required surface is missing.

### Permissive mode

Write only the available files and emit warnings such as:

- `AGENTS.md not materialized; OpenClaw may inject a missing-file marker`
- `SOUL.md synthesized from persona; byte-exact preservation not possible`

## Persona and identity synthesis

If the user did not provide one of the OpenClaw surface files, the adapter MAY synthesize it from canonical layers.

Examples:

- `SOUL.md` from the persona layer
- `IDENTITY.md` from persona identity fields

In `exact` mode, synthesized files MUST trigger warnings or failure because they are not byte-preserving.

## Skills mapping

OpenClaw skills map directly into the workspace skill directory:

```text
<workspace>/skills/<skill>/SKILL.md
```

Rules:

- preserve skill directories exactly
- preserve `SKILL.md` bytes exactly
- preserve supporting files exactly
- do not rewrite OpenClaw-specific skill metadata

## Memory mapping

OpenClaw workspaces often include curated memory files. stax seed memory maps to the workspace memory directory:

```text
<workspace>/memory/**
```

The adapter MAY also materialize a top-level `MEMORY.md` if the user provides it as a surface or knowledge file and explicitly configures such a mapping, but `1.0.0` does not require this.

## What the adapter MUST NOT own

`@stax/openclaw` MUST NOT write or package these by default:

- `~/.openclaw/openclaw.json`
- `~/.openclaw/credentials/**`
- `~/.openclaw/agents/**/sessions/**`
- logs, caches, or generated runtime state

Those are operational config, secrets, or state — not portable workspace brain.

## Relationship to OpenClaw runtime prompt assembly

OpenClaw dynamically assembles a system prompt from workspace files and runtime context.

stax does not package that runtime-generated prompt directly. Instead:

- stax packages the exact workspace files
- OpenClaw remains responsible for runtime injection, truncation, prompt modes, and session-specific behavior

This is the correct boundary.

## Exactness requirements

An implementation claiming exact OpenClaw support SHOULD:

1. preserve separate named files exactly
2. preserve workspace skills exactly
3. preserve workspace memory exactly
4. avoid writing `~/.openclaw/openclaw.json`
5. fail or warn when a required named file must be synthesized
