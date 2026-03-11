# 26 — Compatibility and Capability Metadata

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

For stax to work as a broad distribution standard, consumers need to know whether an artifact is likely to work before they pull and materialize it.

`1.0.0` includes adapter metadata, but that is not enough for discovery, install planning, enterprise policy, or hosted platform import flows.

This document defines a future compatibility and capability metadata layer for stax artifacts.

## Design goals

Compatibility metadata SHOULD:

1. help consumers evaluate fit before pulling artifact bytes
2. remain advisory until the full artifact is fetched and validated
3. support local runtimes, hosted platforms, and cloud control planes
4. support exact, schema-exact, and best-effort compatibility classes
5. expose requirements relevant to policy and install planning

## Terminology

### Compatibility target

A runtime family, hosted platform, or import surface the artifact is designed for.

### Capability requirement

A declared need such as filesystem access, shell, network, source hydration, or runtime profiles.

### Fidelity

The degree to which a consumer can preserve canonical stax information when representing the artifact.

## Core concepts

### Compatibility

Whether a consumer can represent the artifact correctly enough for the requested operation.

### Capability summary

A condensed view of the artifact's requirements, suitable for preflight checks, policy, and discovery.

## Proposed compatibility block

Future agent config blobs SHOULD support a top-level block equivalent to:

```json
{
  "compatibility": {
    "targets": [
      {
        "runtime": "claude-code",
        "adapterVersionRange": "^1.0.0",
        "runtimeVersionRange": ">=1.0.0",
        "fidelity": "byte-exact"
      },
      {
        "runtime": "acme-cloud-agent",
        "adapterVersionRange": "^2.0.0",
        "runtimeVersionRange": ">=2026.03",
        "fidelity": "schema-exact"
      }
    ],
    "requirements": {
      "workspaceSources": true,
      "runtimeProfiles": false,
      "secrets": 3
    }
  }
}
```

## Target metadata

Each compatibility target SHOULD support:

- `runtime`
- `adapterVersionRange`
- `runtimeVersionRange`
- `fidelity`
- `supportedScopes`
- `importModes` when relevant

Example:

```json
{
  "runtime": "acme-cloud-agent",
  "adapterVersionRange": "^2.0.0",
  "runtimeVersionRange": ">=2026.03",
  "fidelity": "schema-exact",
  "supportedScopes": ["organization", "account"],
  "importModes": ["api"]
}
```

## Fidelity classes

Consumers SHOULD recognize:

- `byte-exact`
- `schema-exact`
- `best-effort`
- `unsupported`

### Fidelity semantics

- `byte-exact` means bytes are preserved exactly in the consumer target
- `schema-exact` means the consumer can represent all canonical information without loss, even if bytes change
- `best-effort` means some information may be embedded, transformed, or omitted with warnings
- `unsupported` means the target MUST be treated as incompatible

## Capability declaration

Compatibility metadata SHOULD summarize the artifact's declared needs:

- shell
- processes
- docker
- network mode
- filesystem workspace
- workspace source requirement
- runtime profile requirement
- memory snapshot support
- package count
- secret count

## Proposed requirements block

Future artifacts SHOULD support a block equivalent to:

```json
{
  "requirements": {
    "capabilities": {
      "shell": true,
      "processes": true,
      "docker": false,
      "networkMode": "restricted"
    },
    "filesystem": {
      "workspaceRequired": true
    },
    "sources": {
      "required": true,
      "count": 1
    },
    "profiles": {
      "required": false
    },
    "packages": {
      "count": 3
    },
    "secrets": {
      "requiredCount": 2,
      "optionalCount": 1
    }
  }
}
```

## Consumer behavior

Consumers SHOULD:

- use compatibility metadata for preflight checks
- warn when runtime versions fall outside known ranges
- reject `unsupported`
- avoid treating advisory metadata as authoritative when the pulled artifact says otherwise

### Preflight rules

Before pulling or applying an artifact, a consumer SHOULD be able to answer:

- is there a matching target for this consumer runtime
- is the target fidelity acceptable for this operation
- are required scopes supported
- are required source or profile dependencies supported

If the answer is clearly no, the consumer SHOULD fail early.

## Discovery usage

Registries and marketplaces SHOULD index:

- supported runtimes
- fidelity class
- supported scopes
- import modes
- source requirements
- profile requirements
- secret count

## Install-plan usage

Install brokers SHOULD include compatibility reasoning in install plans or plan diagnostics.

Example:

```json
{
  "compatibility": {
    "consumer": "acme-cloud-agent",
    "matchedTarget": true,
    "fidelity": "schema-exact",
    "warnings": []
  }
}
```

## Policy usage

Policy engines SHOULD be able to evaluate:

- required runtime families
- minimum fidelity
- source support
- profile support
- unsupported capability requirements

## Relationship to adapters

Compatibility metadata does not replace adapters.

Adapters define how canonical data maps into a consumer.
Compatibility metadata summarizes where that mapping is expected to succeed and at what fidelity.

## Open design questions

1. how much compatibility data should live in the artifact versus discovery indices
2. whether capability summaries should be duplicated into OCI annotations
3. how to version compatibility metadata independently from adapters
