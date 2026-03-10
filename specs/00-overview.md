# 00 — Overview

## What is stax?

stax is a **packaging standard** for AI agents. It defines how to describe, bundle, version, validate, and distribute an agent's configuration as an OCI artifact.

stax does **not** run agents, orchestrate them, or manage their lifecycle. Those concerns belong to runtimes, orchestrators, IDEs, CLIs, and platforms built on top of the format.

stax is to agents what the OCI Image Spec is to containers, what `package.json` is to JavaScript packages, and what `Chart.yaml` is to Helm charts.

## Specification status

This specification describes **stax spec version `1.0.0`**.

All compiled JSON payloads defined by stax SHOULD include `specVersion: "1.0.0"` unless the relevant layer format says otherwise.

### Normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and **MAY** in this specification are to be interpreted as described in RFC 2119 / RFC 8174.

## Scope

### What stax defines

- **Authoring formats** for agents, packages, personas, prompt surfaces, MCP, rules, skills, knowledge, memory, and secrets
- **A compiled config blob** stored in OCI
- **Runtime profile artifacts** for portable non-secret runtime configuration when appropriate
- **Source artifacts** for cacheable workspace snapshots shared across many agents
- **Typed OCI layers** for each brain concern
- **Deterministic build rules** for packaged directories and compiled JSON
- **Package dependency and merge rules**
- **Adapter metadata** describing how a consumer materializes an artifact for a runtime
- **A consumer/materialization contract** for turning canonical layers into runtime-native files
- **A CLI contract** for build, validate, inspect, materialize, push, pull, and verify workflows
- **Referrer conventions** for signatures, evaluations, approvals, and memory snapshots

### What stax does NOT define

These remain out of scope and are owned by consumers of stax artifacts.

| Concern | Why it's out of scope | Who handles it |
|---------|----------------------|----------------|
| Running agents | stax describes what to run, not how | CLIs, IDEs, platforms, orchestrators |
| Swarm topology | Multi-agent relationships are orchestration concerns | Agent orchestrators |
| Replicas and scaling | Deployment behavior is operational | Orchestrators, K8s |
| Resource limits | CPU / memory allocation is runtime infrastructure | Container runtimes, microVMs |
| Secret resolution | stax declares needs, not providers or values | Vaults, env injection, orchestrators |
| Retry policy | Execution policy is runtime-specific | Consumers |
| Monitoring / tracing | Observability is infrastructure | Platforms, APM tools |
| Transport between agents | Messaging is orchestration | Message buses, platforms |
| Access control enforcement | Policy enforcement is runtime-specific | IAM, sandboxing, network layers |

## Boundary principle

> A stax artifact carries **what an agent is** and **what it needs to start**.
> Everything about **where it runs, with what limits, under what policies, and in what topology** is extrinsic and belongs to the consumer.

This is the same separation used by successful packaging standards:

- OCI images describe the image, not the deployment topology
- npm packages describe dependencies, not process supervision
- Helm charts describe desired resources, not cluster implementation details

## Core concepts

### Agent artifact
A versioned OCI artifact containing an agent's canonical configuration: identity, adapter, prompt, persona, rules, MCP servers, skills, knowledge, memory seed, secret declarations, and resolved package metadata.

### Package artifact
A reusable OCI artifact that contributes canonical layers such as MCP, skills, rules, knowledge, and secrets. Packages are merged into agents at build or materialization time according to the package merge rules.

### Runtime profile artifact
A separate OCI artifact for runtime-scoped, non-secret configuration that should not live inside an agent brain. For example: portable OpenClaw `openclaw.json` defaults packaged via `@stax/openclaw/profile`.

### Source artifact
A separate OCI artifact containing a cacheable workspace snapshot, typically derived from a Git repository or source archive. Agents reference source artifacts instead of embedding full repos in every brain artifact.

### Config blob
The OCI `config` object for an agent or package. This is the canonical compiled manifest and includes identity, adapter metadata, runtime hints, package references, and references to optional layers.

### Layer
A typed OCI layer containing one logical concern, such as persona JSON or a gzipped tarball of skills.

### Adapter
A runtime-specific description of how a canonical stax agent maps to a target runtime such as Claude Code, Codex, Cursor, or Windsurf.

### Consumer
Any tool that reads stax artifacts: a CLI, IDE plugin, runtime, orchestrator, registry-aware service, or platform.

### Materialization
The process of turning a canonical stax artifact into runtime-native files and settings. For example: rendering prompt templates, translating MCP to `.mcp.json`, and writing skills into a runtime-specific directory.

## Compatibility model

### Spec compatibility

- A consumer that implements stax `1.x` MUST reject artifacts with a higher unsupported **major** `specVersion`.
- A consumer SHOULD ignore unknown additive fields within the same supported major version unless a layer spec says the field is strict.
- Removing or changing the meaning of an existing field is a breaking change and requires a new major spec version.
- Adding optional fields is non-breaking.

### Forward compatibility

- A consumer encountering an unknown OCI layer media type within a stax artifact MUST skip the layer and SHOULD warn. Unknown layers MUST NOT cause a build or materialization failure.
- A consumer encountering unknown fields in a config blob or JSON layer MUST ignore them and SHOULD warn, unless the field is in a namespace the consumer explicitly manages.
- Builders SHOULD NOT strip unknown fields from JSON layers or config blobs when re-packaging or copying artifacts.

### Deprecation process

To deprecate a field or feature in a future minor version:

1. The spec MUST document the field as deprecated with a target removal version
2. Builders SHOULD warn when deprecated fields are used
3. Deprecated fields MUST NOT be removed until a new major spec version
4. Consumers MUST continue to accept deprecated fields for the entire major version

### Adapter compatibility

Adapters MUST declare:

- `type` — adapter identifier (for example `claude`)
- `runtime` — target runtime family (for example `claude-code`)
- `adapterVersion` — adapter schema version
- `features` — supported translation features

Consumers SHOULD warn when an artifact uses features unsupported by the selected adapter or runtime.

## Determinism principle

stax artifacts are intended to be **reproducible**.

Two conforming builders given the same source tree, ignore rules, dependency lockfile, and build options SHOULD produce identical OCI layer digests.

Deterministic packaging rules are defined in [03 — Layers](./03-layers.md).

## Architecture

```
┌──────────────────────────────────────────────────┐
│                     stax                         │
│               (packaging standard)               │
│                                                  │
│  TypeScript SDK → OCI Artifact → Registry        │
│                                                  │
│  defineAgent()     Typed layers    Push/Pull     │
│  definePackage()   Config blob     Inspect       │
│  definePersona()   Lockfile        Materialize   │
└──────────────────┬───────────────────────────────┘
                   │
                   │ OCI artifacts consumed by:
                   │
     ┌─────────────┼─────────────┬─────────────────┐
     ▼             ▼             ▼                 ▼
  Your           Agent         Cloud           Community
  Orchestrator   Platforms     Providers       Tools
```

## Conformance levels

### Builder
A builder compiles authoring files into canonical JSON and deterministic OCI artifacts.

### Consumer
A consumer reads artifacts, validates them, resolves packages, and optionally materializes them for a runtime.

### Registry tool
A registry tool pushes, pulls, copies, signs, verifies, and inspects artifacts and referrers.

A single implementation MAY satisfy one, two, or all three roles.

## Specification documents

| Spec | Description |
|------|-------------|
| [01 — Agent Manifest](./01-agent-manifest.md) | The root manifest and compiled config blob |
| [02 — OCI Artifact Format](./02-oci-artifact-format.md) | OCI manifests, media types, annotations, and referrers |
| [03 — Layers](./03-layers.md) | Deterministic layer construction and validation |
| [04 — Persona](./04-persona.md) | Persona format, validation, and prompt templating |
| [05 — Packages](./05-packages.md) | Shared configuration bundles, dependency resolution, and merge rules |
| [16 — Surfaces](./16-surfaces.md) | Named prompt/instruction documents for exact runtime file mapping |
| [06 — MCP](./06-mcp.md) | Canonical MCP server definitions |
| [07 — Skills](./07-skills.md) | Skill packaging and frontmatter schema |
| [08 — Rules](./08-rules.md) | Canonical behavioral rules |
| [09 — Knowledge](./09-knowledge.md) | Knowledge packaging and metadata |
| [10 — Memory](./10-memory.md) | Seed memory and memory snapshot conventions |
| [11 — Secrets](./11-secrets.md) | Secret declaration semantics |
| [12 — Adapters](./12-adapters.md) | Runtime adapters and feature contracts |
| [13 — CLI](./13-cli.md) | Reference CLI behavior |
| [14 — Use Cases](./14-use-cases.md) | Example scenarios |
| [15 — Materialization](./15-materialization.md) | Consumer contract for translating artifacts to runtime-native files |
| [17 — Runtime File Contracts](./17-runtime-file-contracts.md) | Exact file ownership and target mappings for runtime homes such as `~/.claude`, `~/.openclaw`, and `~/.codex` |
| [18 — Adapter: `@stax/claude-code`](./18-adapter-claude-code.md) | Exact Claude Code adapter contract |
| [19 — Adapter: `@stax/openclaw`](./19-adapter-openclaw.md) | Exact OpenClaw workspace adapter contract |
| [20 — Adapter: `@stax/codex`](./20-adapter-codex.md) | Exact Codex adapter contract |
| [21 — Profile: `@stax/openclaw/profile`](./21-openclaw-profile.md) | Portable OpenClaw runtime-profile artifact for `openclaw.json`-style config |
| [22 — Workspace Sources](./22-workspace-sources.md) | Cacheable source artifacts and agent references for shared Git/workspace snapshots |
