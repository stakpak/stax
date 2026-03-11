# 29 — Source Governance and Provenance

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

Workspace source artifacts are a major strength of stax, but broad enterprise and cloud distribution requires stronger governance around them.

This document defines future source governance and provenance requirements.

## Design goals

Source governance SHOULD:

1. preserve digest-level reproducibility
2. record where snapshots came from
3. support mirroring and enterprise controls
4. prevent accidental inclusion of unsafe or secret-bearing content

## Non-goals

This document does not define:

- runtime workspace lifecycle
- execution-time source mutation policy
- source code semantics or build systems

## Terminology

### Source artifact

A stax artifact of type `application/vnd.stax.source.v1` containing a workspace snapshot.

### Source provenance

Metadata describing where the snapshot came from and how it was produced.

### Source origin

The upstream repository, archive, or directory from which the source artifact was built.

### Source approval

A trust or policy decision specifically about the source artifact and origin.

## Source classes

Recommended source classes:

- `git-full`
- `git-sparse`
- `archive`
- `prepared-directory`

These classes MAY be derived from the existing `sourceType` and snapshot metadata in [22 — Workspace Sources](./22-workspace-sources.md).

## Provenance fields

Source artifacts SHOULD support richer provenance including:

- source repository URL
- commit hash
- branch or ref
- sparse checkout rules
- submodule policy
- builder identity
- build timestamp

## Proposed provenance block

Future source config blobs SHOULD support a block equivalent to:

```json
{
  "provenance": {
    "class": "git-sparse",
    "origin": {
      "repo": "https://github.com/acme/backend.git",
      "ref": "refs/heads/main",
      "commit": "abc123"
    },
    "builder": "stax-cli@1.3.0",
    "builtAt": "2026-03-11T16:00:00Z",
    "snapshot": {
      "sparse": ["services/api", "packages/shared"],
      "submodules": "excluded"
    }
  }
}
```

### Required provenance fields

Source artifacts intended for enterprise or hosted distribution SHOULD include:

- `class`
- `builder`
- `builtAt`
- at least one origin identifier

## Governance controls

Consumers and registries SHOULD support policy for:

- allowed source origins
- forbidden repositories
- required provenance fields
- maximum source size
- allowed sparse paths
- mirror-only source consumption

### Suggested source policy controls

Consumers SHOULD support:

- allowed repository domains
- blocked repository domains
- required commit pinning
- blocked submodule inclusion
- maximum file count
- maximum uncompressed size
- required source approvals

## Source decision rules

- a forbidden source origin MUST fail admission
- a source artifact without required provenance fields MUST fail when policy requires them
- an unpinned or floating source reference SHOULD fail when strict provenance is required
- a source artifact exceeding configured size or file-count limits MUST fail admission

## Required exclusions

Source builders already exclude VCS metadata and unsafe file types under [03 — Layers](./03-layers.md) and [22 — Workspace Sources](./22-workspace-sources.md).

Enterprise policy SHOULD additionally be able to detect and block:

- accidentally included credential files
- oversized binary payloads
- forbidden path patterns

This detection MAY happen during build, mirror, or install policy evaluation.

## Source approval

Organizations MAY require explicit source approval separate from agent approval.

Rationale:

- the same agent can be attached to different source snapshots
- the source origin may carry independent legal or supply-chain risk

Source approval MAY be represented as:

- a generic approval attestation scoped to the source artifact digest
- a future source-specific approval type

## Enterprise mirror behavior

Enterprises SHOULD be able to:

- mirror source artifacts by digest
- preserve provenance
- attach internal approvals
- block unapproved source origins

Mirrors MUST preserve:

- source artifact digests
- provenance metadata
- upstream source identity when known

## Hosted platform behavior

Hosted platforms MAY:

- hydrate source snapshots into workspace services
- attach source digests as references
- delay actual source extraction until runtime preparation

Regardless of mechanism, platforms SHOULD preserve the source artifact identity and provenance chain.

## Relationship to trust policy

This document complements [24 — Trust, Policy, and Attestations](./24-trust-policy-attestations.md).

Trust policy answers:

- who signed this source artifact
- whether provenance and approvals exist

Source governance answers:

- whether the underlying origin and snapshot characteristics are acceptable

## Open design questions

1. whether source provenance should be its own required referrer type
2. how to represent incremental or delta snapshots in a future version
3. whether source approval should be separate from agent approval
