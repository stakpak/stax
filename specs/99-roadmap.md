# 99 — Roadmap and Draft Status

## Purpose

This document explains how to read the stax specification set:

- what is part of the current normative `1.0.0` scope
- what is forward-looking draft design
- what should be implemented first
- what depends on what

The goal is to keep the project ambitious without blurring the line between:

- current conformance requirements
- future ecosystem design

## Status model

stax documents currently fall into three categories:

### 1. Core `1.0.0`

Normative specification documents that define current conformance expectations.

These are the documents an implementation should treat as authoritative for `1.0.0`.

### 2. Runtime-specific `1.0.0`

Normative adapter and runtime-contract documents for exact current runtimes.

These are part of the `1.0.0` story, but narrower in scope than the core artifact model.

### 3. Forward drafts

Design documents that describe the next layer of the distribution standard.

These are intentionally not yet part of `1.0.0` conformance.

## Current scope

### Core `1.0.0`

| Spec                                 | Status                   | Notes                                     |
| ------------------------------------ | ------------------------ | ----------------------------------------- |
| 00 — Overview                        | Core `1.0.0`             | Distribution boundary, scope, terminology |
| 01 — Agent Manifest                  | Core `1.0.0`             | Root agent artifact definition            |
| 02 — OCI Artifact Format             | Core `1.0.0`             | Artifact types, media types, referrers    |
| 03 — Layers                          | Core `1.0.0`             | Determinism and archive safety            |
| 04 — Persona                         | Core `1.0.0`             | Persona format and templating             |
| 05 — Packages                        | Core `1.0.0`             | Package resolution and merge semantics    |
| 06 — MCP                             | Core `1.0.0`             | Canonical MCP server model                |
| 07 — Skills                          | Core `1.0.0`             | Skill packaging format                    |
| 08 — Rules                           | Core `1.0.0`             | Rule packaging and ordering               |
| 09 — Knowledge                       | Core `1.0.0`             | Static reference material                 |
| 10 — Memory                          | Core `1.0.0`             | Seed memory and snapshot conventions      |
| 11 — Secrets                         | Core `1.0.0`             | Secret declarations only                  |
| 12 — Adapters                        | Core `1.0.0`             | Generic adapter contract                  |
| 13 — CLI                             | Core `1.0.0`             | Reference CLI baseline                    |
| 14 — Use Cases                       | Informational            | Non-normative examples                    |
| 15 — Materialization                 | Core `1.0.0`             | Consumer contract                         |
| 16 — Surfaces                        | Core `1.0.0`             | Exact named prompt surfaces               |
| 17 — Runtime File Contracts          | Core `1.0.0`             | Exact runtime ownership model             |
| 18 — Adapter: `@stax/claude-code`    | Runtime-specific `1.0.0` | Exact Claude mapping                      |
| 19 — Adapter: `@stax/openclaw`       | Runtime-specific `1.0.0` | Exact OpenClaw mapping                    |
| 20 — Adapter: `@stax/codex`          | Runtime-specific `1.0.0` | Exact Codex mapping                       |
| 21 — OpenClaw Profile                | Runtime-specific `1.0.0` | Runtime profile artifact                  |
| 22 — Workspace Sources               | Core `1.0.0`             | Shared source artifacts                   |
| 33 — Adapter: `@stax/cursor`         | Runtime-specific `1.0.0` | Exact Cursor mapping                      |
| 34 — Adapter: `@stax/github-copilot` | Runtime-specific `1.0.0` | Exact Copilot mapping                     |
| 35 — Adapter: `@stax/windsurf`       | Runtime-specific `1.0.0` | Exact Windsurf mapping                    |
| 36 — Adapter: `@stax/opencode`       | Runtime-specific `1.0.0` | Exact OpenCode mapping                    |
| 37 — Subagents and Agent Bundles     | Core `1.0.0`             | Canonical delegate-agent packaging        |
| 38 — Instruction Trees               | Core `1.0.0`             | Path-scoped instruction hierarchies       |

### Forward drafts

| Spec                                              | Status | Theme                             |
| ------------------------------------------------- | ------ | --------------------------------- |
| 23 — Registry, Discovery, and Install             | Draft  | Search, install plans, channels   |
| 24 — Trust, Policy, and Attestations              | Draft  | Signatures, approvals, revocation |
| 25 — Hosted Platform Adapter Contract             | Draft  | Hosted/cloud consumers            |
| 26 — Compatibility and Capability Metadata        | Draft  | Preflight compatibility           |
| 27 — Package and Marketplace Metadata             | Draft  | Catalog and marketplace UX        |
| 28 — Conformance and Certification                | Draft  | Interop and exactness validation  |
| 29 — Source Governance and Provenance             | Draft  | Source admission and provenance   |
| 30 — Package and MCP Safety Policy                | Draft  | Dependency and MCP admission      |
| 31 — Registry Lifecycle, Promotion, and Mirroring | Draft  | Promotion, yanking, mirroring     |
| 32 — Distribution CLI Operations                  | Draft  | Full CLI distribution surface     |

## Recommended implementation order

If the goal is to make stax real as a distribution standard, the implementation order should be:

### Phase 1: Build, import, and materialize a real wedge

Implement first:

- 00
- 01
- 02
- 03
- 05
- 12
- 13
- 15
- 17
- 18
- 20
- 33
- 34
- 37
- 38
- 22

This produces a product teams can use to normalize and materialize coding-agent assets across real runtimes.

### Phase 2: Distribution safety and enterprise controls

Implement next:

- 23
- 24
- 26
- 30
- 31
- 32

This turns stax from artifact formatting into a governable install and promotion system.

### Phase 3: Exact runtime breadth and cloud readiness

Implement next:

- 19
- 21
- 25
- 35
- 36
- 29

This makes stax credible for hosted platforms, enterprise control planes, and source-governed installs.

### Phase 4: Ecosystem hardening

Implement next:

- 27
- 28

This makes stax discoverable, certifiable, and ecosystem-ready.

## Dependency map

The major draft dependencies are:

- 23 depends on the existence of artifact/package identity from 00–22 and 37–38
- 24 depends on referrer conventions from 02
- 25 depends on adapter/materialization concepts from 12 and 15
- 26 depends on adapters from 12 and hosted import ideas from 25
- 27 depends on discovery structures from 23, compatibility summaries from 26, and trust/attestation from 24
- 28 depends on the normative core and the exact runtime contracts in 17–20 and 33–38
- 29 depends on source artifacts from 22 and trust/provenance from 24
- 30 depends on packages from 05, MCP from 06, and trust policy from 24
- 31 depends on discovery/install from 23 and trust policy from 24
- 32 depends on 23, 24, 31, and 25

## What should not be confused

The following are intentionally distinct:

- `1.0.0` conformance vs forward draft design
- artifact trust vs package/MCP admission policy
- source provenance vs agent provenance
- materialization vs execution
- hosted import contracts vs runtime lifecycle

## Practical reading order

For a new implementer, the recommended reading order is:

1. 00 — Overview
2. 01 — Agent Manifest
3. 02 — OCI Artifact Format
4. 03 — Layers
5. 05 — Packages
6. 12 — Adapters
7. 15 — Materialization
8. 17–22, 33–38 depending on target runtime
9. 23–32 for future distribution work

## Project discipline

The project should remain strict about these rules:

- forward drafts do not silently redefine `1.0.0`
- current implementations may experiment, but should not claim conformance to draft surfaces unless explicitly stated
- runtime execution and orchestration remain outside stax
- the artifact digest remains the stable unit across all current and future layers
