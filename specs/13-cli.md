# 13 — CLI

## Overview

`stax` is the reference CLI for building, validating, inspecting, materializing, and publishing stax artifacts.

The CLI is both a user tool and a conformance reference for the specification.

Conceptually:

- `stax build` is the agent equivalent of `docker build`
- `stax push` is the agent equivalent of `docker push`
- `stax pull` is the agent equivalent of `docker pull`

Consumers may then materialize or import the pulled artifact into a specific runtime or platform.

Baseline compatibility preview and install-plan output are part of the core CLI surface. Search, full registry-mediated install, promotion, mirror, and richer hosted-import workflows beyond this baseline are forward draft work described in [23 — Registry, Discovery, and Install](./23-registry-discovery-install.md), [31 — Registry Lifecycle, Promotion, and Mirroring](./31-registry-lifecycle-and-mirroring.md), and [32 — Distribution CLI Operations](./32-distribution-cli-operations.md).

## Commands

### `stax init`

Scaffold a new agent or package project.

```bash
stax init
stax init --agent
stax init --package
stax init --template github-workflow
```

### `stax build`

Compile TypeScript definitions, resolve packages, produce deterministic OCI layers, and write `stax.lock` when needed.

```bash
stax build
stax build --persona maya-chen
stax build --all-personas
stax build --dry-run
stax build --refresh-lock
stax build --symlink-mode flatten
```

Output: artifact stored in the local cache (`~/.stax/cache/`).

### `stax build-source`

Build a cacheable workspace source artifact from a Git repo or prepared directory tree.

```bash
stax build-source ./repo
stax build-source ./repo --git-url https://github.com/acme/backend.git --commit abc123
stax build-source ./repo --sparse services/api --sparse packages/shared
```

A conforming implementation SHOULD:

- strip `.git/` and other VCS metadata
- record source metadata in the source artifact config blob
- emit a deterministic source snapshot layer

### `stax validate`

Validate definitions without producing an artifact.

```bash
stax validate
stax validate agent.ts
```

Validation MUST cover at least:

- type correctness
- required fields
- path existence and type
- package reference syntax
- dependency cycles
- MCP secret references
- skill and rule frontmatter validity
- archive safety rules

### `stax materialize`

Resolve an artifact and translate it into runtime-native files or another consumer-native installation payload.

```bash
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --out ./output
stax materialize ./dist/backend-engineer.oci --adapter codex --out ./codex-output
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --json
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --plan --consumer codex
```

A conforming implementation SHOULD support:

- filesystem output
- machine-readable JSON output
- warnings for lossy translations
- import-plan output for non-filesystem consumers when applicable

### `stax plan-install`

Generate a machine-readable install plan without applying changes.

```bash
stax plan-install ghcr.io/myorg/agents/backend-engineer:3.1.0 --consumer codex
stax plan-install ghcr.io/myorg/agents/backend-engineer:3.1.0 --consumer acme-cloud --json
```

A conforming implementation SHOULD include:

- selected adapter
- compatibility reasoning
- fidelity summary
- planned writes or remote targets
- warnings
- trust summary when available

### `stax inspect`

Display artifact metadata and layer information.

```bash
stax inspect ghcr.io/myorg/agents/backend-engineer:3.1.0
stax inspect ghcr.io/myorg/agents/backend-engineer:3.1.0 --json
```

Example human output:

```text
Agent: backend-engineer v3.1.0
Runtime: claude-code (claude-opus-4-1)
Persona: maya-chen (Maya Chen, Senior Backend Engineer)

Layers:
  config     application/vnd.stax.config.v1+json          1.5 KB
  prompt     application/vnd.stax.prompt.v1+markdown      2.1 KB
  persona    application/vnd.stax.persona.v1+json         0.8 KB
  mcp        application/vnd.stax.mcp.v1+json             0.5 KB
  skills     application/vnd.stax.skills.v1.tar+gzip      4.3 KB  (3 skills)
  rules      application/vnd.stax.rules.v1.tar+gzip       1.7 KB  (4 rules)
  secrets    application/vnd.stax.secrets.v1+json         0.3 KB  (3 secrets)
```

### `stax push`

Push a built artifact to an OCI registry.

```bash
stax push ghcr.io/myorg/agents/backend-engineer:3.1.0
stax push --all-personas ghcr.io/myorg/agents/backend-engineer
```

### `stax pull`

Pull an artifact from a registry into the local cache.

```bash
stax pull ghcr.io/myorg/agents/backend-engineer:3.1.0
stax pull ghcr.io/myorg/agents/backend-engineer@sha256:abc...
```

Consumers SHOULD cache source artifacts by digest in the same local cache and reuse them across multiple agent materializations.

### `stax extract`

Extract canonical layers for debugging.

```bash
stax extract ghcr.io/myorg/agents/backend-engineer:3.1.0 ./output/
```

### `stax diff`

Compare two artifacts or two local projects.

```bash
stax diff ghcr.io/myorg/agents/backend-engineer:3.0.0 ghcr.io/myorg/agents/backend-engineer:3.1.0
stax diff ./project-a ./project-b
```

A diff SHOULD identify changed layers, changed digests, package resolution differences, and materialization warnings.

### `stax verify`

Verify signatures or attestations attached via OCI referrers.

```bash
stax verify ghcr.io/myorg/agents/backend-engineer:3.1.0
```

### `stax login`

Authenticate with an OCI registry.

```bash
stax login ghcr.io
stax login --username user --password-stdin ghcr.io
```

Uses the same credential store as Docker or ORAS when possible.

## Configuration

### `stax.config.ts`

Optional project-level configuration:

```typescript
export default {
  registry: "ghcr.io/myorg/agents",
  defaultPersona: "maya-chen",
  failOnLossyMaterialization: false,
};
```

## Exit codes

| Code | Meaning                             |
| ---- | ----------------------------------- |
| 0    | Success                             |
| 1    | Validation error                    |
| 2    | Build error                         |
| 3    | Registry error                      |
| 4    | Package resolution error            |
| 5    | Materialization compatibility error |
| 6    | Signature / verification error      |
