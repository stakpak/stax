# 22 — Workspace Sources

## Overview

Workspace sources let an agent depend on a **cacheable source artifact** instead of embedding a repository or working tree in the agent brain.

This is the preferred model when:

- many agents work on the same repository
- source snapshots should be cached and deduplicated
- startup should be fast after the first pull
- the same source context must be reused across multiple runtimes or sessions

## Design goals

Workspace sources exist to provide:

1. **shared caching** — one source artifact can be reused by many agents
2. **deduplication** — identical source snapshots have identical digests
3. **reproducibility** — agents can pin a source artifact by digest
4. **separation of concerns** — source lives outside the agent brain artifact

## Preferred architecture

The preferred architecture is **Option A: separate source artifacts**.

```text
agent artifact  ──references──▶ source artifact
                       │
                       └── cached once, materialized many times
```

This is preferred over embedding repository contents inside each agent artifact.

## Source artifact type

Workspace sources are published as OCI artifacts with:

```text
artifactType: application/vnd.stax.source.v1
```

The source artifact SHOULD contain:

- config media type: `application/vnd.stax.source.config.v1+json`
- one snapshot layer: `application/vnd.stax.source.snapshot.v1.tar+gzip`

## Agent manifest reference

Agents reference source artifacts via `workspaceSources`.

```typescript
export default defineAgent({
  name: "reviewer-agent",
  version: "1.0.0",
  workspaceSources: [
    {
      id: "backend",
      ref: "ghcr.io/acme/sources/backend@sha256:abc123...",
      mountPath: "/workspace/backend",
      writable: true,
      required: true,
    },
  ],
});
```

## Type definition

```typescript
interface WorkspaceSourceReference {
  id: string;
  ref: string; // OCI ref to a source artifact
  mountPath: string; // Absolute target path in runtime workspace
  writable?: boolean; // Default: false
  required?: boolean; // Default: true
  subpath?: string; // Optional subdirectory inside snapshot
}
```

## Source artifact config schema

```typescript
interface SourceArtifactConfig {
  specVersion?: "1.0.0";
  kind: "source";
  name: string;
  version: string;
  sourceType: "git" | "archive" | "directory";
  description?: string;

  origin?: {
    url?: string;
    repo?: string;
    ref?: string;
    commit?: string;
  };

  snapshot?: {
    preparedFromPath?: string;
    sparse?: string[];
    submodules?: "excluded" | "included";
    fileCount?: number;
  };
}
```

## Source creation patterns

### Git snapshot

The most common source artifact is a Git-derived snapshot.

Example config blob:

```json
{
  "specVersion": "1.0.0",
  "kind": "source",
  "name": "backend",
  "version": "2026.03.10-abc1234",
  "sourceType": "git",
  "origin": {
    "url": "https://github.com/acme/backend.git",
    "ref": "refs/heads/main",
    "commit": "abc1234def5678"
  },
  "snapshot": {
    "sparse": ["services/api", "packages/shared"],
    "submodules": "excluded",
    "fileCount": 1824
  }
}
```

### Directory snapshot

A consumer MAY build a source artifact from a prepared directory tree.

This is useful for:

- generated workspaces
- pre-expanded archives
- local prepared source trees

## Required exclusions

Builders creating source artifacts MUST exclude:

- `.git/`
- `.hg/`
- `.svn/`
- credentials or secret files intentionally placed outside the source tree policy
- device files, sockets, FIFOs, hard links, and symlinks

The goal is a **workspace snapshot**, not a VCS database.

## Caching expectations

Consumers SHOULD:

1. cache source artifacts by digest
2. avoid re-downloading identical source digests
3. reuse one cached source snapshot across many agents
4. materialize writable workspaces from the cached base snapshot

Examples of valid materialization strategies:

- copy-on-write filesystem clones
- overlayfs/unionfs layers
- per-agent extracted directories from one cached tarball
- local bare mirror + worktree generation from an equivalent pinned source snapshot

The spec does not mandate the mechanism, only the cacheability and reuse semantics.

## Multi-agent example

```text
ghcr.io/acme/sources/backend@sha256:xyz
├── used by reviewer-agent
├── used by fixer-agent
└── used by test-agent
```

The source digest is cached once. Each agent receives its own workspace materialization while reusing the same underlying snapshot.

## Materialization rules

When materializing a `workspaceSources` entry, a consumer MUST:

- pull the referenced source artifact
- validate that it is `application/vnd.stax.source.v1`
- extract the snapshot or selected `subpath`
- place it at `mountPath`
- honor `writable` according to runtime policy

If `required: true` and the source cannot be materialized, the consumer MUST fail before starting the agent.

## Relationship to knowledge

Workspace sources are not the same as `knowledge/`.

Use `knowledge/` for:

- docs
- reference files
- examples
- data intended for read-mostly retrieval

Use source artifacts for:

- editable codebases
- repo snapshots
- workspaces that tools will read and modify

## Relationship to runtime profiles

Workspace sources are also distinct from runtime profiles.

- source artifact: project/workspace bytes
- profile artifact: runtime configuration defaults
- agent artifact: agent brain

A consumer MAY combine all three.

## Publishing guidance

Source artifacts SHOULD:

- be pinned by digest in agent manifests
- use commit-derived versions when built from Git
- be updated independently of the agent brain
- prefer sparse snapshots for very large monorepos when appropriate
