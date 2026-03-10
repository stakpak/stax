# 01 — Agent Manifest

## Overview

The agent manifest is the root definition of an agent. It declares identity, optional layer sources, runtime hints, package dependencies, secret requirements, and the adapter used to materialize the agent for a runtime.

Agents are authored in TypeScript using `defineAgent()` and compiled to JSON for the OCI config blob.

## Source file

A project MUST contain exactly one root agent definition file, typically `agent.ts`.

All relative paths in the agent definition are resolved relative to the directory containing `agent.ts`.

Resolved paths MUST remain within the project root unless the builder is explicitly run with an escape hatch such as `--allow-outside-root`.

## defineAgent()

```typescript
import { defineAgent } from 'stax';
import claudeCode from '@stax/claude-code';

export default defineAgent({
  name: 'backend-engineer',
  version: '3.1.0',
  description: 'Senior backend engineer with Go and distributed systems expertise.',
  author: 'myorg',
  license: 'MIT',
  tags: ['code-review', 'architecture', 'golang'],
  url: 'https://github.com/myorg/backend-engineer',

  adapter: claudeCode({
    model: 'claude-opus-4-1',
    modelParams: { temperature: 0.3 },
  }),
  adapterFallback: [
    {
      type: 'generic',
      runtime: 'generic',
      adapterVersion: '1.0.0',
      model: 'any-model-id',
      config: {},
      features: {},
    },
  ],

  persona: './personas/maya-chen.ts',
  prompt: './SYSTEM_PROMPT.md',
  mcp: './mcp-servers.ts',
  skills: './skills/',
  rules: './rules/',
  knowledge: './knowledge/',
  memory: './memory/',
  surfaces: './surfaces/',

  hints: {
    isolation: 'microvm',
    capabilities: {
      shell: true,
      network: {
        mode: 'restricted',
        allowlist: ['api.anthropic.com', 'api.github.com'],
      },
      filesystem: {
        workspace: '/workspace',
        writable: ['/workspace'],
        denyRead: ['**/.env', '**/*credentials*'],
      },
    },
  },

  secrets: [
    { key: 'ANTHROPIC_API_KEY', required: true, kind: 'api-key' },
    { key: 'GITHUB_TOKEN', required: true, kind: 'token' },
    { key: 'SLACK_WEBHOOK', required: false, kind: 'url' },
  ],

  packages: [
    'ghcr.io/myorg/packages/github-workflow:2.0.0',
    'ghcr.io/myorg/packages/org-standards@sha256:0123456789abcdef...',
    './packages/local-team-overrides',
  ],
});
```

## Type definitions

```typescript
interface AgentDefinition {
  specVersion?: '1.0.0';

  // Identity
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  url?: string;
  tags?: string[];

  // Adapter
  adapter: AdapterConfig;
  adapterFallback?: AdapterConfig[];

  // Source paths resolved at build time
  persona?: string;
  prompt?: string;
  mcp?: string;
  skills?: string;
  rules?: string;
  knowledge?: string;
  memory?: string;
  surfaces?: string;

  // Runtime hints
  hints?: RuntimeHints;

  // Secret declarations
  secrets?: SecretDeclaration[];

  // Package references
  packages?: PackageReference[];
}

interface RuntimeHints {
  isolation?: 'process' | 'container' | 'gvisor' | 'microvm';
  capabilities?: {
    shell?: boolean;
    processes?: boolean;
    docker?: boolean;
    network?: NetworkHint;
    filesystem?: FilesystemHint;
  };
}

interface NetworkHint {
  mode: 'none' | 'restricted' | 'full';
  allowlist?: string[];
}

interface FilesystemHint {
  workspace?: string;
  writable?: string[];
  denyRead?: string[];
}

interface SecretDeclaration {
  key: string;
  required: boolean;
  description?: string;
  kind?: 'api-key' | 'token' | 'password' | 'certificate' | 'connection-string' | 'url' | 'opaque';
  exposeAs?: { env?: string; file?: string };
}

type PackageReference = string;

interface AdapterConfig {
  type: string;                         // Adapter identifier, e.g. "claude"
  runtime: string;                      // Runtime family, e.g. "claude-code"
  adapterVersion: string;               // Adapter schema version
  model?: string;
  modelParams?: Record<string, unknown>;
  config: Record<string, unknown>;
  features: AdapterFeatureMap;
  targets?: MaterializationTarget[];
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

## Field validation

### Identity

- `name` MUST match `^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`
- `version` MUST be valid semver
- `tags`, if present, MUST contain unique case-sensitive strings

### Paths

- `persona`, `prompt`, and `mcp` MUST resolve to files
- `skills`, `rules`, `knowledge`, `memory`, and `surfaces` MUST resolve to directories
- Missing optional paths MUST be treated as validation errors if declared explicitly
- Symlink targets MUST be rejected during packaging

### Packages

Each entry in `packages` MUST be either:

1. A relative local path beginning with `./` or `../`
2. An OCI reference with an explicit tag: `<registry>/<repo>:<tag>`
3. An OCI digest reference: `<registry>/<repo>@sha256:<digest>`

Semver ranges, globs, and floating selectors such as `^1`, `~2`, or `latest` SHOULD NOT be used in committed manifests. Builders MAY allow them interactively, but MUST resolve them into `stax.lock` and SHOULD warn.

### Adapter fallback

`adapterFallback` provides alternate adapter configs in descending preference order.

Consumers SHOULD:

1. Try the primary `adapter`
2. Fall back to the first compatible `adapterFallback` entry
3. Fail with a clear compatibility error if none are supported

## Compiled config blob

The OCI config blob for an agent MUST use media type `application/vnd.stax.config.v1+json` and MUST contain canonical JSON with stable key ordering.

If `surfaces` are present, the config blob SHOULD record that fact so consumers can distinguish artifacts that support exact runtime file materialization from those that only provide a single prompt.

### Canonical config example

```json
{
  "specVersion": "1.0.0",
  "kind": "agent",
  "name": "backend-engineer",
  "version": "3.1.0",
  "description": "Senior backend engineer with Go and distributed systems expertise.",
  "author": "myorg",
  "license": "MIT",
  "url": "https://github.com/myorg/backend-engineer",
  "tags": ["code-review", "architecture", "golang"],
  "adapter": {
    "type": "claude",
    "runtime": "claude-code",
    "adapterVersion": "1.0.0",
    "model": "claude-opus-4-1",
    "modelParams": { "temperature": 0.3 },
    "config": {
      "permissions": {
        "allowedTools": ["Read", "Edit", "Bash", "Grep", "Write"]
      }
    },
    "features": {
      "prompt": "embedded",
      "persona": "embedded",
      "rules": "native",
      "skills": "native",
      "mcp": "translated",
      "secrets": "consumer-only",
      "toolPermissions": "native",
      "modelConfig": "native"
    }
  },
  "hints": {
    "isolation": "microvm",
    "capabilities": {
      "shell": true,
      "network": {
        "mode": "restricted",
        "allowlist": ["api.anthropic.com", "api.github.com"]
      }
    }
  },
  "packages": [
    "ghcr.io/myorg/packages/github-workflow:2.0.0"
  ]
}
```

## In vs out of scope

### In the manifest

| Field | Why |
|------|-----|
| Identity fields | Defines what the artifact is |
| Adapter and fallback | Declares intended runtimes |
| Layer paths and surfaces | Defines the agent brain and exact runtime-facing documents |
| Runtime hints | Communicates requirements and recommendations |
| Secret declarations | Declares needed secret keys |
| Package references | Defines composition |

### Out of the manifest

| Concern | Why it's out |
|--------|---------------|
| Secret values and providers | Environment-specific |
| Resource limits | Operational |
| Replicas | Orchestration |
| Retry policy | Runtime-specific |
| Session timeout | Operational |
| Scheduling and topology | Orchestration |

## Directory structure

```
my-agent/
├── agent.ts
├── SYSTEM_PROMPT.md
├── persona.ts
├── mcp-servers.ts
├── personas/
│   ├── _base.ts
│   ├── maya-chen.ts
│   └── alex-rivera.ts
├── skills/
├── rules/
├── knowledge/
├── memory/
├── surfaces/
│   ├── instructions.md
│   ├── persona.md
│   └── tools.md
├── .staxignore
└── stax.lock
```
