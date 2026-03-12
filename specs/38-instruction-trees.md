# 38 — Instruction Trees

## Overview

Instruction trees are path-scoped instruction hierarchies for runtimes that discover instructions by directory or scope rather than from one root document.

This spec exists because a single `instructions.md` surface is not enough for:

- nested `AGENTS.md` discovery
- repo-subtree instruction overrides
- monorepo-local agent behavior
- user, project, and workspace instruction layering

## Authoring

An agent MAY declare:

```typescript
export default defineAgent({
  name: "monorepo-assistant",
  version: "1.0.0",
  adapter: codex({}),
  instructionTree: "./instruction-tree/",
});
```

### Directory shape

```text
instruction-tree/
├── _root/
│   └── instructions.md
├── services/
│   └── api/
│       └── instructions.md
└── packages/
    └── ui/
        └── instructions.md
```

Rules:

- `_root/instructions.md` represents the repo or primary root scope
- every other `instructions.md` applies to the relative directory path represented by its parent directories

## Validation

- every scoped instruction document MUST be named `instructions.md`
- all instruction documents MUST be Markdown files
- `_root/instructions.md` SHOULD be present when a tree is declared
- duplicate normalized paths MUST be rejected
- empty directories MUST be ignored

## OCI layer

Instruction trees are packaged as a deterministic tarball layer:

```text
application/vnd.stax.instruction-tree.v1.tar+gzip
```

Builders SHOULD annotate the layer with `dev.stax.instruction-tree.count`.

## Semantics

An instruction tree preserves the structure of path-scoped guidance without committing the artifact to any one runtime's exact file names.

Consumers mapping an instruction tree SHOULD:

- preserve path scope
- preserve instruction bytes
- translate to runtime-native names when required
- warn when a runtime cannot represent the full hierarchy

## Example mapping

For a runtime that uses nested `AGENTS.md`:

- `_root/instructions.md` -> `AGENTS.md` at repo root
- `services/api/instructions.md` -> `services/api/AGENTS.md`
- `packages/ui/instructions.md` -> `packages/ui/AGENTS.md`

For a runtime that lacks nested instruction files:

- consumers MAY embed scoped content into a single file with warnings
- consumers MAY fail in `exact` mode

## Relationship to surfaces

- `surfaces/instructions.md` represents one primary instruction document
- `instructionTree` represents a hierarchy of path-scoped instruction documents

Artifacts MAY include both:

- `surfaces` for runtimes with one or a few named files
- `instructionTree` for runtimes with nested discovery behavior
