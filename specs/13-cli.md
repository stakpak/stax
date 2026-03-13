# 13 — CLI

## Overview

`stax` is the reference CLI for building, validating, inspecting, materializing, and publishing stax artifacts.

The current reference implementation exposes a pragmatic subset of the broader CLI model described elsewhere in the spec. In particular:

- `stax materialize` renders adapter-native files and writes them to disk
- `stax plan-install` is derived from the same render pipeline
- `stax build-source` is reserved but not yet implemented
- lockfile refresh workflows remain future work in the current CLI

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

Compile TypeScript definitions into deterministic OCI artifacts.

```bash
stax build
stax build .stax/backend/agent.ts
stax build --persona maya-chen
stax build --all-personas
stax build --symlink-mode flatten
```

Current behavior:

- auto-discovers `.stax/<name>/agent.ts` and `.stax/<name>/package.ts`
- validates referenced paths and known fields
- writes a local artifact directory under `.stax/artifacts/`

### `stax build-source`

Reserved for future workspace source artifact generation.

```bash
stax build-source ./repo
```

The current reference CLI validates the path and exits with an unavailable message.

### `stax validate`

Validate definitions without producing an artifact.

```bash
stax validate
stax validate .stax/backend/agent.ts
```

Current validation MUST cover at least:

- required fields
- path existence and type
- package reference syntax
- duplicate tags
- symlink policy for referenced paths

### `stax materialize`

Resolve an artifact, render runtime-native files, and write them to an output directory.

```bash
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --out ./output
stax materialize ./artifact-dir --adapter codex --out ./codex-output
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --json
stax materialize ghcr.io/myorg/agents/backend-engineer:3.1.0 --plan --consumer codex
```

A conforming implementation SHOULD support:

- filesystem output
- machine-readable JSON output
- warnings for lossy translations
- plan output derived from the same rendering pipeline

### `stax plan-install`

Generate a machine-readable install plan without applying changes.

```bash
stax plan-install ghcr.io/myorg/agents/backend-engineer:3.1.0 --consumer codex
stax plan-install ghcr.io/myorg/agents/backend-engineer:3.1.0 --consumer codex --json
```

A conforming implementation SHOULD include:

- selected adapter
- fidelity summary
- planned writes or remote targets
- warnings
- lightweight compatibility reasoning

### `stax inspect`

Display artifact metadata and layer information.

```bash
stax inspect ghcr.io/myorg/agents/backend-engineer:3.1.0
stax inspect ghcr.io/myorg/agents/backend-engineer:3.1.0 --json
```

### `stax push`

Push a built artifact to an OCI registry.

```bash
stax push ghcr.io/myorg/agents/backend-engineer:3.1.0
```

### `stax pull`

Pull an artifact from a registry into the local cache.

```bash
stax pull ghcr.io/myorg/agents/backend-engineer:3.1.0
```

### `stax extract`

Extract canonical layers for debugging.

```bash
stax extract ghcr.io/myorg/agents/backend-engineer:3.1.0 ./output/
```

### `stax diff`

Compare two artifacts or two local artifact directories.

```bash
stax diff ghcr.io/myorg/agents/backend-engineer:3.0.0 ghcr.io/myorg/agents/backend-engineer:3.1.0
stax diff ./artifact-a ./artifact-b
```

### `stax verify`

Verify signatures or attestations attached via OCI referrers.

```bash
stax verify ghcr.io/myorg/agents/backend-engineer:3.1.0
```

The current reference CLI supports registry-based verification checks only.

### `stax login`

Authenticate with an OCI registry.

```bash
stax login --username user --password-stdin ghcr.io
```

The current reference CLI stores credentials under `~/.stax/auth.json`, and OCI operations use that credential store.

## Exit codes

| Code | Meaning                             |
| ---- | ----------------------------------- |
| 0    | Success                             |
| 1    | Validation error / invalid usage    |
| 2    | Local build or file-system error    |
| 3    | Registry / remote operation error   |
| 4    | Reserved for package resolution     |
| 5    | Materialization compatibility error |
| 6    | Signature / verification error      |
