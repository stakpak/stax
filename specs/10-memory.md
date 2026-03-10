# 10 — Memory

## Overview

Memory captures learned context that evolves over time: decisions, user preferences, recurring patterns, and project-specific context.

In stax `1.0.0`, memory exists in two forms:

1. **Seed memory** inside an agent artifact
2. **Memory snapshots** attached later, typically via OCI referrers

The base memory layer format is standardized. Runtime synchronization strategy remains a consumer concern.

## Memory vs knowledge

| | Knowledge | Memory |
|---|-----------|--------|
| Mutability | Immutable author input | Mutable runtime output |
| Source | Docs, specs, guides | Learned context |
| Lifecycle | Updated by rebuild | Updated by execution |
| Scope | Usually shared broadly | Often scoped to user, workspace, or instance |

## Directory structure

```text
memory/
├── decisions.md
├── patterns.md
├── user-preferences.md
├── project-context.md
└── memory.meta.json
```

## Optional `memory.meta.json`

A memory directory MAY include `memory.meta.json`.

Example:

```json
{
  "specVersion": "1.0.0",
  "snapshotId": "mem_2026_03_10_120000Z",
  "scope": {
    "type": "workspace",
    "id": "acme/backend"
  },
  "sourceArtifact": "ghcr.io/acme/agents/backend-engineer@sha256:abc...",
  "parentSnapshot": null,
  "createdAt": "2026-03-10T12:00:00Z"
}
```

### Scope types

Supported scope types in `1.0.0`:

- `agent`
- `user`
- `workspace`
- `project`
- `session`

Consumers MAY define narrower internal scopes, but SHOULD map them to one of the types above when publishing snapshots.

## Seed memory

An agent definition MAY include `memory: './memory/'`.

This creates a `application/vnd.stax.memory.v1.tar+gzip` layer with annotation `dev.stax.memory.snapshot=seed`.

## Memory snapshots via referrers

Consumers SHOULD publish mutable memory as OCI referrers using artifact type:

```text
application/vnd.stax.memory-snapshot.v1
```

A memory snapshot referrer SHOULD:

- reference the base agent artifact as its OCI `subject`
- contain a config blob with snapshot metadata
- contain one `application/vnd.stax.memory.v1.tar+gzip` layer
- annotate the memory layer with `dev.stax.memory.snapshot=snapshot`

## Merge expectations

stax does not define automatic semantic merging of memory file contents.

In `1.0.0`, snapshot replacement semantics are recommended:

- a snapshot replaces the previous snapshot for the same `(scope.type, scope.id)` when selected by a consumer
- consumers MAY maintain lineage using `parentSnapshot`
- consumers SHOULD avoid line-based auto-merging unless they fully control both producer and consumer

## Concurrency and lineage

To avoid ambiguous writes, consumers SHOULD treat memory snapshots as append-only lineage records.

Recommended policy:

1. read the latest selected snapshot for a scope
2. produce a new snapshot with `parentSnapshot` set to the previous snapshot id
3. publish the new snapshot as a referrer

### Conflict avoidance

When multiple agents or sessions may write memory concurrently, consumers SHOULD:

- Use `parentSnapshot` as an optimistic concurrency token — if another snapshot with the same `parentSnapshot` already exists, the consumer has a conflict
- On conflict, consumers SHOULD either:
  - retry by re-reading the latest snapshot and producing a new one based on it
  - write a new snapshot with a distinct `scope.id` (e.g., session-scoped) to avoid collision
- Consumers MUST NOT silently overwrite snapshots produced by other writers

### Snapshot metadata config blob

A memory snapshot referrer's config blob MUST contain:

```json
{
  "specVersion": "1.0.0",
  "snapshotId": "mem_2026_03_10_120000Z",
  "scope": {
    "type": "workspace",
    "id": "acme/backend"
  },
  "sourceArtifact": "ghcr.io/acme/agents/backend-engineer@sha256:abc...",
  "parentSnapshot": "mem_2026_03_09_080000Z",
  "createdAt": "2026-03-10T12:00:00Z"
}
```

All fields except `parentSnapshot` are REQUIRED. `parentSnapshot` is `null` for the first snapshot in a lineage.

## Privacy and retention

Consumers are responsible for:

- deciding what may be remembered
- scoping memory correctly
- redacting secrets and sensitive data
- retention and deletion policies

Builders and consumers MUST NOT copy secret values into memory artifacts.
