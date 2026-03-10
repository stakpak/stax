# 08 — Rules

## Overview

Rules define behavioral constraints and policy guidance for agents: coding standards, review expectations, security requirements, escalation policies, and workflow conventions.

stax stores rules as Markdown files with YAML frontmatter in a deterministic tarball layer.

## Rule format

```markdown
---
id: ts-coding-standards
scope: always
priority: 100
severity: error
description: TypeScript coding standards
tags:
  - typescript
  - quality
---

# TypeScript Coding Standards

- Use camelCase for variables and functions
- Use PascalCase for types and classes
- Always handle errors explicitly
- Write tests for all public functions
```

## Frontmatter fields

| Field | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | string | No | archive path | Stable rule identifier |
| `scope` | enum | No | `always` | `always`, `glob`, `auto`, `manual` |
| `globs` | string[] | No | `[]` | File patterns for `glob` scope |
| `priority` | number | No | `100` | Lower runs earlier |
| `severity` | enum | No | `warn` | `info`, `warn`, `error` |
| `description` | string | No | — | Short summary |
| `tags` | string[] | No | `[]` | Discovery metadata |
| `triggers` | string[] | No | `[]` | Optional keywords for `auto` selection |

## Scope semantics

- `always` — always included
- `glob` — included when relevant files match `globs`
- `auto` — consumer MAY include automatically based on context, triggers, or heuristics
- `manual` — only included when a user or tool explicitly selects it

Consumers MUST treat unknown scopes as validation errors.

## Merge semantics

Rules are merged by:

1. `id` if present
2. otherwise normalized archive path

A higher-precedence source replaces the lower-precedence rule with the same merge key.

Rules without conflicts are concatenated in canonical rule order defined in [05 — Packages](./05-packages.md).

## Translation guidance

Each runtime has different rule mechanisms:

| Runtime | Common target |
|---------|---------------|
| Claude Code | `CLAUDE.md` or embedded instructions |
| Codex | `AGENTS.md` or embedded instructions |
| Cursor | `.cursor/rules/*.md` |
| Windsurf | `.windsurf/rules/*.md` |

Adapters define how much fidelity is preserved. Consumers SHOULD warn when fields such as `priority`, `severity`, or `manual` cannot be represented natively.

## OCI layer

Rules are packaged as `application/vnd.stax.rules.v1.tar+gzip`.

Builders SHOULD annotate the layer with `dev.stax.rules.count`.
