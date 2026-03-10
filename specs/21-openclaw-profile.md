# 21 — Profile: `@stax/openclaw/profile`

## Overview

`@stax/openclaw/profile` defines a **runtime-profile artifact** for OpenClaw.

It exists for packaging the declarative, portable parts of `~/.openclaw/openclaw.json` without mixing them into the agent-brain artifact.

This is intentionally separate from `@stax/openclaw`:

- `@stax/openclaw` packages the **workspace brain**
- `@stax/openclaw/profile` packages the **runtime profile**

This separation preserves the stax boundary between intrinsic agent content and runtime/operator configuration.

## Why a separate profile artifact exists

OpenClaw uses two very different configuration surfaces:

1. **Workspace files** such as `AGENTS.md`, `SOUL.md`, and `skills/`
2. **Runtime config** in `~/.openclaw/openclaw.json`

The workspace is highly portable and agent-centric.

`openclaw.json` is broader. It can include:

- model defaults
- channel and routing configuration
- sandbox defaults
- gateway settings
- UI/runtime options
- profile-wide behavior

Some of that is portable. Some is machine-specific. Some is secret-adjacent.

A separate profile artifact lets stax represent the portable declarative subset cleanly.

## Artifact type

OpenClaw profiles SHOULD be published as OCI artifacts with:

```text
artifactType: application/vnd.stax.profile.v1
```

and config media type:

```text
application/vnd.stax.profile.config.v1+json
```

The config blob MUST include:

- `specVersion`
- `kind: "profile"`
- `profileType: "openclaw"`
- `name`
- `version`

## Authoring shape

Profiles are defined in TypeScript.

```typescript
import { defineProfile } from 'stax';

export default defineProfile({
  name: 'ahmed-personal-openclaw',
  version: '1.0.0',
  profileType: 'openclaw',
  description: 'Portable OpenClaw profile defaults for my personal setup.',

  openclaw: {
    agent: {
      model: 'anthropic/claude-opus-4-1',
      workspace: '~/.openclaw/workspace',
      skipBootstrap: false,
    },
    skills: {
      allowBundled: true,
      load: {
        watch: true,
      },
    },
    gateway: {
      port: 18789,
      auth: {
        mode: 'token',
      },
    },
  },

  secrets: [
    { key: 'OPENAI_API_KEY', required: false },
    { key: 'ANTHROPIC_API_KEY', required: false },
  ],
});
```

## Type definition

```typescript
interface RuntimeProfileDefinition {
  specVersion?: '1.0.0';

  name: string;
  version: string;
  profileType: 'openclaw';
  description?: string;
  author?: string;
  tags?: string[];

  openclaw: Record<string, unknown>;   // validated against the allowed portable subset
  secrets?: SecretDeclaration[];
}
```

## Portable subset principle

`@stax/openclaw/profile` MUST NOT blindly package all of `openclaw.json`.

Instead, it packages the **portable declarative subset**.

### Allowed by default

The following categories are generally appropriate for profiles:

- model defaults
- agent defaults
- non-secret skills configuration
- non-secret sandbox defaults
- non-secret routing defaults
- non-secret gateway defaults that remain portable across environments
- UI defaults that do not encode machine identity or secrets

### Excluded by default

The following MUST NOT be embedded in the profile payload by default:

- raw secrets or credentials
- OAuth tokens
- session data
- file paths that are specific to one machine and cannot be parameterized
- ephemeral trust state
- caches, logs, or runtime-generated state

## Secret handling

Profiles MAY declare required secret keys using the normal stax secrets model, but MUST NOT include secret values.

Example:

```json
{
  "secrets": [
    { "key": "OPENAI_API_KEY", "required": false },
    { "key": "ANTHROPIC_API_KEY", "required": false }
  ]
}
```

## Materialization target

In exact mode, an OpenClaw profile materializes to:

```text
~/.openclaw/openclaw.json
```

or another user-selected OpenClaw profile path.

## Exact materialization rules

A conforming consumer SHOULD:

1. render canonical JSON with stable key ordering
2. preserve only the allowed portable subset
3. fail or warn when a profile contains disallowed fields
4. keep secrets external
5. support user-specific path interpolation only through explicit consumer policy

## Suggested profile merge order

When both a workspace artifact and a profile artifact are used, the consumer SHOULD apply them in this order:

1. base runtime defaults
2. `@stax/openclaw/profile`
3. local operator overrides
4. ephemeral runtime state

The profile MUST NOT overwrite credentials or session state.

## Relationship to `@stax/openclaw`

Use `@stax/openclaw` when you want to distribute:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md`
- workspace `skills/`
- workspace `memory/`

Use `@stax/openclaw/profile` when you want to distribute:

- portable `openclaw.json` defaults
- runtime-wide non-secret config
- machine-agnostic policy defaults

Use both when you want a full but correctly separated OpenClaw setup.

## Publishing guidance

Profile artifacts SHOULD:

- be versioned independently from workspace artifacts
- avoid machine-specific absolute paths when possible
- declare required secret keys, not values
- be treated as user-scope runtime config, not as project brain
