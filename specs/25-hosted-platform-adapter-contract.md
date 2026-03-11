# 25 — Hosted Platform Adapter Contract

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

stax `1.0.0` models adapters primarily around filesystem-oriented runtimes such as Claude Code, Codex, and OpenClaw.

That is necessary but incomplete for the broader vision.

Many future consumers of stax artifacts will be:

- hosted agent platforms
- cloud control planes
- remote agent registries
- internal enterprise import systems

These systems do not necessarily materialize local files.

Instead, they often:

- ingest JSON payloads
- import bundles through APIs
- translate artifacts into internal records
- attach sources and profiles through control plane objects

This document defines the future adapter and import contract for those consumers.

## Design goals

The hosted platform contract SHOULD:

1. let remote systems consume stax artifacts without pretending to be local filesystems
2. preserve the same artifact as the unit of distribution
3. make import behavior explicit and inspectable
4. support compatibility checks before import
5. avoid leaking execution semantics into the stax distribution layer

## Non-goals

This document does not define:

- execution loops
- job APIs
- scheduling
- scale-out behavior
- runtime lifecycle

## Terminology

### Hosted consumer

A consumer that imports or installs a stax artifact into a remote service or control plane rather than writing local runtime files.

### Import payload

A consumer-native representation derived from the canonical stax model and submitted to a hosted system.

### Import mode

The way a hosted consumer accepts the artifact or its derived form.

### Fidelity

The degree to which canonical stax information is preserved in the hosted target.

## Hosted consumer model

A hosted consumer SHOULD perform the following steps:

1. resolve the artifact ref or digest
2. verify trust and policy requirements
3. pull the artifact and related dependencies
4. construct the canonical materialized model
5. transform that model into a hosted import payload
6. return or apply an import plan

The hosted consumer remains responsible for execution after import.

## Problem with `1.0.0` target kinds

`1.0.0` defines:

```typescript
kind: 'file' | 'directory' | 'setting'
```

That is too narrow for remote consumers.

Future versions SHOULD extend target modeling to include non-filesystem outputs.

## Proposed target model

Future adapter contracts SHOULD support:

```typescript
interface MaterializationTargetV2 {
  kind: 'file' | 'directory' | 'setting' | 'api' | 'bundle' | 'object';
  target: string;
  scope?: 'user' | 'project' | 'workspace' | 'local' | 'remote' | 'account' | 'organization';
  exact?: boolean;
  description?: string;
  mediaType?: string;
}
```

Semantics:

- `file` and `directory` retain current meaning
- `setting` maps to native configuration fields
- `api` represents a named remote API import surface
- `bundle` represents a packaged import artifact sent to a platform
- `object` represents a named remote record or configuration object

## Import modes

Hosted adapters SHOULD declare an import mode.

Suggested values:

- `filesystem`
- `api`
- `bundle`
- `object-map`

Example:

```json
{
  "type": "hosted-platform",
  "runtime": "acme-cloud-agent",
  "adapterVersion": "2.0.0",
  "config": {
    "importMode": "api"
  }
}
```

### Import mode semantics

- `filesystem` means the hosted system still consumes a file tree or archive
- `api` means a structured request is sent to a remote endpoint
- `bundle` means a packaged import bundle is generated and handed to another system
- `object-map` means the artifact is translated into one or more named remote objects

## Fidelity classes

Filesystem exactness is not the only notion of fidelity.

Hosted consumers SHOULD support these fidelity classes:

- `byte-exact`
- `schema-exact`
- `best-effort`

Definitions:

- `byte-exact` means bytes are preserved exactly in a known target
- `schema-exact` means all canonical fields are represented exactly in a target schema
- `best-effort` means some canonical data is embedded, transformed, or omitted with warnings

## Hosted adapter responsibilities

A hosted adapter SHOULD declare:

- runtime family
- supported import mode
- supported fidelity class
- compatibility constraints
- target objects or APIs
- how prompt, persona, rules, skills, MCP, knowledge, sources, and profiles are mapped

## Proposed hosted adapter shape

Future hosted adapters SHOULD compile to a payload equivalent to:

```typescript
interface HostedAdapterConfig extends AdapterConfig {
  config: {
    importMode: 'filesystem' | 'api' | 'bundle' | 'object-map';
    fidelity: 'byte-exact' | 'schema-exact' | 'best-effort';
    apiVersion?: string;
    targetObjects?: string[];
    maxArtifactSizeMb?: number;
  };
}
```

## Import plan

Hosted consumers SHOULD expose an import plan before applying changes.

Example:

```json
{
  "artifact": "sha256:abc...",
  "consumer": {
    "runtime": "acme-cloud-agent",
    "scope": "organization"
  },
  "adapter": {
    "runtime": "acme-cloud-agent",
    "importMode": "api",
    "fidelity": "schema-exact"
  },
  "targets": [
    {
      "kind": "api",
      "target": "POST /v1/agents/import",
      "mediaType": "application/json"
    },
    {
      "kind": "object",
      "target": "agent-profile/default"
    }
  ],
  "lossy": false,
  "warnings": []
}
```

### Required import plan fields

- `artifact`
- `consumer`
- `adapter`
- `targets`
- `lossy`
- `warnings`

## Apply semantics

A hosted install or import operation SHOULD:

1. resolve the artifact and adapter
2. verify trust and policy requirements
3. construct the canonical materialized model
4. generate an import payload or bundle
5. apply that payload to the hosted consumer

If trust or compatibility checks fail, the operation MUST fail before any remote mutation occurs.

## Workspace source handling

Hosted consumers MAY not mount source artifacts directly to a filesystem path.

Instead, they MAY:

- import source snapshots into a workspace service
- attach source digests as references
- hydrate workspaces lazily

stax only requires that source artifact identity and dependency semantics be preserved.

The exact workspace execution model remains out of scope.

## Runtime profile handling

Hosted platforms MAY ignore local-machine profile concepts entirely.

For hosted environments, runtime profile artifacts MAY map to:

- account-scoped defaults
- organization policies
- workspace templates

This mapping is consumer-defined and MUST be surfaced clearly in compatibility metadata.

## Partial import behavior

Hosted consumers MAY support partial import of canonical concerns such as:

- prompt and persona only
- MCP and tool config only
- source and profile attachment only

If partial import drops canonical information, the consumer MUST report a warning and mark the import as lossy.

## Generic cloud adapter

The current `@stax/generic` adapter is the bridge for early hosted systems.

Future versions SHOULD define a stronger cloud-oriented adapter contract with:

- remote scopes
- import modes
- compatibility metadata
- target fidelity class

until specific hosted platforms publish exact adapters.

## Suggested compatibility metadata

Hosted adapters SHOULD publish:

- supported import mode
- fidelity class
- accepted artifact kinds
- source artifact support
- profile artifact support
- package support
- maximum supported layer sizes when relevant
- supported API version range when relevant

## CLI additions

The reference CLI SHOULD eventually support:

```bash
stax import-plan <ref> --consumer acme-cloud
stax install <ref> --consumer acme-cloud
```

`install` for a hosted consumer MAY mean:

- invoking a control plane API
- generating a signed import bundle
- handing off a validated payload to another system

## Relationship to materialization

Hosted import is an extension of materialization, not a separate concept.

The canonical materialized model SHOULD remain the same.
Only the output targets and application method differ.

## Open design questions

The following need further design:

1. whether hosted target kinds should be added as a minor or major adapter schema change
2. whether import-plan JSON should be standardized independently from filesystem materialization output
3. how to represent compatibility ranges for hosted platform API versions
4. whether hosted platform adapters should support partial import of layers
