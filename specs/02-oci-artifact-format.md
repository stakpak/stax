# 02 — OCI Artifact Format

## Overview

A stax artifact is an OCI image manifest with a custom `artifactType`, a stax config blob, and zero or more typed layers.

stax defines four primary artifact types:

| What             | artifactType                      |
| ---------------- | --------------------------------- |
| Agent            | `application/vnd.stax.agent.v1`   |
| Package          | `application/vnd.stax.package.v1` |
| Runtime profile  | `application/vnd.stax.profile.v1` |
| Workspace source | `application/vnd.stax.source.v1`  |

A consumer MUST treat stax artifacts as **agent distribution artifacts**, not runtime images or executable containers.

## Media types

### Agent and package config blob

```text
application/vnd.stax.config.v1+json
```

### Specialized config blob media types

| Config blob            | Media type                                    |
| ---------------------- | --------------------------------------------- |
| Runtime profile config | `application/vnd.stax.profile.config.v1+json` |
| Source artifact config | `application/vnd.stax.source.config.v1+json`  |

### Layers

| Layer            | Media type                                          | Cardinality per artifact |
| ---------------- | --------------------------------------------------- | ------------------------ |
| Persona          | `application/vnd.stax.persona.v1+json`              | `0..1`                   |
| Prompt           | `application/vnd.stax.prompt.v1+markdown`           | `0..1`                   |
| MCP              | `application/vnd.stax.mcp.v1+json`                  | `0..1`                   |
| Skills           | `application/vnd.stax.skills.v1.tar+gzip`           | `0..1`                   |
| Rules            | `application/vnd.stax.rules.v1.tar+gzip`            | `0..1`                   |
| Knowledge        | `application/vnd.stax.knowledge.v1.tar+gzip`        | `0..1`                   |
| Memory           | `application/vnd.stax.memory.v1.tar+gzip`           | `0..1`                   |
| Surfaces         | `application/vnd.stax.surfaces.v1.tar+gzip`         | `0..1`                   |
| Instruction tree | `application/vnd.stax.instruction-tree.v1.tar+gzip` | `0..1`                   |
| Subagents        | `application/vnd.stax.subagents.v1+json`            | `0..1`                   |
| Secrets          | `application/vnd.stax.secrets.v1+json`              | `0..1`                   |
| Packages         | `application/vnd.stax.packages.v1+json`             | `0..1`                   |
| Source snapshot  | `application/vnd.stax.source.snapshot.v1.tar+gzip`  | source artifact only     |

An artifact MUST NOT contain more than one layer of the same stax media type.

## Manifest structure

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "artifactType": "application/vnd.stax.agent.v1",
  "config": {
    "mediaType": "application/vnd.stax.config.v1+json",
    "digest": "sha256:<config-digest>",
    "size": 1536
  },
  "layers": [
    {
      "mediaType": "application/vnd.stax.knowledge.v1.tar+gzip",
      "digest": "sha256:<knowledge-digest>",
      "size": 524288,
      "annotations": {
        "org.opencontainers.image.title": "knowledge.tar.gz",
        "dev.stax.knowledge.files": "42"
      }
    },
    {
      "mediaType": "application/vnd.stax.rules.v1.tar+gzip",
      "digest": "sha256:<rules-digest>",
      "size": 8192,
      "annotations": {
        "org.opencontainers.image.title": "rules.tar.gz",
        "dev.stax.rules.count": "4"
      }
    },
    {
      "mediaType": "application/vnd.stax.skills.v1.tar+gzip",
      "digest": "sha256:<skills-digest>",
      "size": 16384,
      "annotations": {
        "org.opencontainers.image.title": "skills.tar.gz",
        "dev.stax.skills.count": "7"
      }
    },
    {
      "mediaType": "application/vnd.stax.prompt.v1+markdown",
      "digest": "sha256:<prompt-digest>",
      "size": 4096,
      "annotations": {
        "org.opencontainers.image.title": "SYSTEM_PROMPT.md"
      }
    },
    {
      "mediaType": "application/vnd.stax.persona.v1+json",
      "digest": "sha256:<persona-digest>",
      "size": 1024,
      "annotations": {
        "org.opencontainers.image.title": "persona.json",
        "dev.stax.persona.name": "maya-chen"
      }
    }
  ],
  "annotations": {
    "org.opencontainers.image.created": "2026-03-10T12:00:00Z",
    "org.opencontainers.image.version": "3.1.0",
    "org.opencontainers.image.title": "backend-engineer",
    "org.opencontainers.image.description": "Senior backend engineer with Go expertise",
    "org.opencontainers.image.vendor": "myorg",
    "dev.stax.spec.version": "1.0.0",
    "dev.stax.adapter.type": "claude-code",
    "dev.stax.adapter.runtime": "claude-code",
    "dev.stax.persona": "maya-chen"
  }
}
```

## Minimal artifacts

The `config` object is always required.

If an artifact has no stax layers, builders SHOULD include the OCI empty descriptor in `layers`:

```json
{
  "mediaType": "application/vnd.oci.empty.v1+json",
  "digest": "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
  "size": 2
}
```

Consumers MUST accept both:

- a manifest with no stax layers and one OCI empty descriptor
- a manifest with one or more stax layers

## Layer ordering

Layers SHOULD be emitted in this order for stable manifests and efficient cache reuse:

1. Knowledge
2. Rules
3. Skills
4. MCP
5. Secrets
6. Packages
7. Instruction tree
8. Surfaces
9. Prompt
10. Persona
11. Subagents
12. Memory

Ordering does not change semantics, but builders SHOULD follow the canonical ordering above.

## Annotations

### Required manifest annotations

| Key                                | Required   | Description              |
| ---------------------------------- | ---------- | ------------------------ |
| `org.opencontainers.image.created` | Yes        | RFC 3339 timestamp       |
| `org.opencontainers.image.version` | Yes        | Agent or package version |
| `org.opencontainers.image.title`   | Yes        | Artifact name            |
| `dev.stax.spec.version`            | Yes        | stax spec version        |
| `dev.stax.adapter.type`            | Agent only | Adapter identifier       |
| `dev.stax.adapter.runtime`         | Agent only | Runtime family           |

### Optional manifest annotations

| Key                                    | Description                          |
| -------------------------------------- | ------------------------------------ |
| `org.opencontainers.image.description` | Description                          |
| `org.opencontainers.image.vendor`      | Author or organization               |
| `dev.stax.persona`                     | Active persona name                  |
| `dev.stax.lock.digest`                 | Digest of `stax.lock` used for build |

### Layer annotations

| Key                               | Layer            | Description                              |
| --------------------------------- | ---------------- | ---------------------------------------- |
| `org.opencontainers.image.title`  | all              | Friendly file name                       |
| `dev.stax.persona.name`           | persona          | Persona identifier                       |
| `dev.stax.mcp.count`              | mcp              | Number of servers                        |
| `dev.stax.skills.count`           | skills           | Number of skills                         |
| `dev.stax.rules.count`            | rules            | Number of rules                          |
| `dev.stax.knowledge.files`        | knowledge        | Number of files                          |
| `dev.stax.memory.entries`         | memory           | Number of memory files                   |
| `dev.stax.memory.snapshot`        | memory           | `seed` or `snapshot`                     |
| `dev.stax.surfaces.count`         | surfaces         | Number of named runtime-facing documents |
| `dev.stax.instruction-tree.count` | instruction tree | Number of scoped instruction files       |
| `dev.stax.subagents.count`        | subagents        | Number of bundled subagents              |

## Config blob requirements

The config blob MUST:

- use canonical JSON serialization
- include `specVersion`
- identify `kind` as `agent`, `package`, `profile`, or `source`
- include the resolved package references that participated in the build when applicable
- include adapter metadata for agents

Runtime profile artifacts such as `@stax/openclaw/profile` use `application/vnd.stax.profile.v1` and SHOULD store their primary payload in the config blob with media type `application/vnd.stax.profile.config.v1+json`.

Workspace source artifacts use `application/vnd.stax.source.v1` and SHOULD store source metadata in the config blob with media type `application/vnd.stax.source.config.v1+json`, plus one source layer with media type `application/vnd.stax.source.snapshot.v1.tar+gzip`.

## Referrer conventions

stax does not require referrers, but standardizes common ones so tools can interoperate.

| Referrer artifactType                     | Purpose                     |
| ----------------------------------------- | --------------------------- |
| `application/vnd.stax.signature.v1`       | Signatures and attestations |
| `application/vnd.stax.evaluation.v1`      | Benchmark or eval results   |
| `application/vnd.stax.approval.v1`        | Human approval records      |
| `application/vnd.stax.memory-snapshot.v1` | Runtime memory snapshots    |

### Signature referrer baseline

A `application/vnd.stax.signature.v1` referrer config blob SHOULD contain at minimum:

```json
{
  "specVersion": "1.0.0",
  "signer": "identity-of-signer",
  "signedAt": "2026-03-10T12:00:00Z",
  "algorithm": "ecdsa-p256-sha256"
}
```

The actual signature payload SHOULD be stored as a layer with media type `application/vnd.stax.signature.payload.v1`. The format of the payload is implementation-defined in `1.0.0`, but consumers SHOULD prefer established formats such as Sigstore bundles or Notary v2 signatures.

### Signature verification policy

Consumers SHOULD support a verification policy with the following modes:

- `none` (default) — signatures are not checked
- `warn` — warn if no valid signature is found, but proceed
- `require` — fail materialization if no valid signature is found

Consumers operating in regulated environments SHOULD default to `warn` or `require`.

Consumers MUST NOT strip or modify signature referrers when copying artifacts between registries unless explicitly instructed.

### Evaluation referrer baseline

A `application/vnd.stax.evaluation.v1` referrer config blob SHOULD contain at minimum:

```json
{
  "specVersion": "1.0.0",
  "evaluationId": "eval_2026_03_10_001",
  "suite": "code-review-benchmark",
  "version": "1.2.0",
  "runAt": "2026-03-10T14:00:00Z",
  "summary": {
    "passed": 42,
    "failed": 3,
    "skipped": 1,
    "score": 0.93
  }
}
```

Required fields: `evaluationId`, `suite`, `runAt`. All other fields are OPTIONAL.

The evaluation payload (detailed results, logs, traces) SHOULD be stored as a layer with media type `application/vnd.stax.evaluation.payload.v1+json`. The structure of the payload is implementation-defined in `1.0.0`.

### Approval referrer baseline

A `application/vnd.stax.approval.v1` referrer config blob SHOULD contain at minimum:

```json
{
  "specVersion": "1.0.0",
  "approvalId": "apr_2026_03_10_001",
  "approver": "identity-of-approver",
  "decision": "approved",
  "approvedAt": "2026-03-10T15:00:00Z",
  "reason": "Passed security review and benchmark suite."
}
```

Required fields: `approvalId`, `approver`, `decision`, `approvedAt`. The `decision` field MUST be one of `approved`, `rejected`, or `conditional`.

An optional approval payload MAY be stored as a layer with media type `application/vnd.stax.approval.payload.v1+json` for additional context such as review checklists or conditions.

## OCI indexes

A builder MAY publish an OCI index that groups related agent manifests, for example multiple persona variants.

If used, the index SHOULD annotate each manifest descriptor with:

- `org.opencontainers.image.ref.name`
- `dev.stax.persona`
- `dev.stax.adapter.runtime`

Consumers MUST NOT assume indexes are present.

## What this artifact is not

A stax artifact does not contain:

- an operating system
- a runtime binary
- a shell toolchain
- an MCP executable environment
- secret values

The artifact is the **brain**, not the body.
