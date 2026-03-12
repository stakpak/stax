# 03 — Layers

## Overview

Each logical concern of an agent's brain is stored as a separate OCI layer with its own media type. Layers are independent, content-addressable, and individually cacheable.

This document defines layer construction, validation, deterministic packaging rules, and archive safety requirements.

## Layer summary

| Layer            | Media type                                          | Format         | Mutable                  |
| ---------------- | --------------------------------------------------- | -------------- | ------------------------ |
| Persona          | `application/vnd.stax.persona.v1+json`              | Canonical JSON | No                       |
| Prompt           | `application/vnd.stax.prompt.v1+markdown`           | UTF-8 Markdown | No                       |
| MCP              | `application/vnd.stax.mcp.v1+json`                  | Canonical JSON | No                       |
| Skills           | `application/vnd.stax.skills.v1.tar+gzip`           | Tarball        | No                       |
| Rules            | `application/vnd.stax.rules.v1.tar+gzip`            | Tarball        | No                       |
| Knowledge        | `application/vnd.stax.knowledge.v1.tar+gzip`        | Tarball        | No                       |
| Memory           | `application/vnd.stax.memory.v1.tar+gzip`           | Tarball        | Seed: No / Snapshot: Yes |
| Surfaces         | `application/vnd.stax.surfaces.v1.tar+gzip`         | Tarball        | No                       |
| Instruction tree | `application/vnd.stax.instruction-tree.v1.tar+gzip` | Tarball        | No                       |
| Subagents        | `application/vnd.stax.subagents.v1+json`            | Canonical JSON | No                       |
| Secrets          | `application/vnd.stax.secrets.v1+json`              | Canonical JSON | No                       |
| Packages         | `application/vnd.stax.packages.v1+json`             | Canonical JSON | No                       |
| Source snapshot  | `application/vnd.stax.source.snapshot.v1.tar+gzip`  | Tarball        | No                       |

## Deterministic build rules

All conforming builders MUST apply the following rules to tar-backed layers (`skills`, `rules`, `knowledge`, `memory`, `surfaces`, `instruction trees`, and `source snapshots`).

### Archive entry rules

- Paths inside the archive MUST use `/` as the separator
- Paths MUST be relative and MUST NOT begin with `/` or `./`
- Paths MUST NOT contain `..` path traversal segments
- Paths MUST be sorted lexicographically by their raw UTF-8 byte values (i.e., `memcmp`-style comparison, case-sensitive, no locale collation)
- Directory entries MUST be emitted immediately before their children
- Builders MUST use the POSIX ustar tar format; pax extended headers MUST NOT be used unless a filename exceeds 255 bytes

### Metadata normalization

- `mtime` MUST be set to `0` (Unix epoch)
- `uid` and `gid` MUST be `0`
- `uname` and `gname` MUST be empty strings
- File mode MUST be normalized to:
  - `0644` for regular non-executable files
  - `0755` for executable files
  - `0755` for directories
- Gzip MUST use compression level `6` (the default level in zlib/flate)
- Gzip headers MUST use `mtime = 0`, `OS = 0xFF` (unknown), and no extra fields, filename, or comment

### File content rules

- Builders MUST preserve file bytes exactly
- Builders MUST NOT rewrite line endings
- Builders MUST NOT transcode text encodings during packaging
- Builders SHOULD warn for non-UTF-8 Markdown or YAML files

### Safety rules

- Symlinks MUST be rejected unless the builder is explicitly run with `--symlink-mode flatten` for a layer that permits flattening
- Hard links MUST be rejected
- Device files, FIFOs, and sockets MUST be rejected
- Files outside the selected directory tree MUST NOT be packaged

### Controlled symlink flattening

Builders MAY support a controlled `flatten` mode for symlinked inputs in these tar-backed layers only:

- `skills`
- `rules`
- `knowledge`
- `surfaces`
- `instruction tree`

When `--symlink-mode flatten` is enabled:

- each symlink target MUST resolve within the project root after normalization
- builders MUST package the resolved file bytes, not the symlink entry itself
- builders MUST reject dangling symlinks
- builders MUST reject symlink cycles
- builders MUST preserve deterministic archive ordering after flattening
- builders SHOULD annotate the build output or config metadata to indicate flattening occurred

## Ignore rules

Builders MUST support `.staxignore` using gitignore-style pattern semantics.

Ignore rules are evaluated relative to the project root.

Builders MUST always ignore:

- `.git/`
- `.stax/`
- artifact output directories produced by the same build command

Builders MAY expose flags to disable additional default ignores, but MUST NOT allow inclusion of the mandatory ignores above.

## Canonical JSON rules

All JSON-backed layers and config blobs MUST be serialized as **canonical JSON**:

- UTF-8 encoding, no BOM
- Object keys sorted lexicographically by raw UTF-8 byte value at every nesting level
- No whitespace between tokens (compact serialization: no spaces after `:` or `,`, no newlines)
- Stable array ordering where order is semantically meaningful
- Numbers serialized without unnecessary leading zeros or trailing fractional zeros
- Strings use minimal escaping (only characters required by JSON: `"`, `\`, and control characters U+0000–U+001F)

These rules ensure that two conforming builders produce byte-identical JSON from the same logical input.

## Prompt layer

The prompt layer contains a single Markdown document.

- It MUST be stored exactly as authored
- It MAY contain persona template expressions described in [04 — Persona](./04-persona.md)
- Templating is resolved during materialization, not during packaging

## Persona layer

The persona layer is compiled from `definePersona()` and stored as canonical JSON.

See [04 — Persona](./04-persona.md).

## MCP layer

The MCP layer is compiled from `defineMcp()` and stored as canonical JSON.

See [06 — MCP](./06-mcp.md).

## Skills layer

The skills layer is a deterministic gzipped tarball of the `skills/` directory.

Expected structure:

```text
skills/
├── fix-issue/
│   └── SKILL.md
└── review-pr/
    ├── SKILL.md
    └── templates/
```

Validation rules:

- Each top-level skill directory MUST contain `SKILL.md`
- Top-level skill directory names MUST be unique after case-sensitive comparison
- Empty top-level directories MUST be rejected

## Rules layer

The rules layer is a deterministic gzipped tarball of the `rules/` directory.

Validation rules:

- Rule files SHOULD use `.md`
- Non-Markdown files MAY be included as referenced assets, but consumers MAY ignore them
- Duplicate archive paths MUST be rejected

## Knowledge layer

The knowledge layer is a deterministic gzipped tarball of the `knowledge/` directory.

Validation rules:

- Builders SHOULD emit file-count metadata in `dev.stax.knowledge.files`
- Builders MAY include `knowledge.manifest.json` as defined in [09 — Knowledge](./09-knowledge.md)
- Consumers MUST tolerate unknown file types

## Memory layer

The memory layer is a deterministic gzipped tarball of the `memory/` directory.

Validation rules:

- Seed memory included in an agent artifact MUST set annotation `dev.stax.memory.snapshot=seed`
- Referrer-based snapshots SHOULD set `dev.stax.memory.snapshot=snapshot`
- Builders SHOULD include memory metadata described in [10 — Memory](./10-memory.md)

## Surfaces layer

The surfaces layer is a deterministic gzipped tarball of the `surfaces/` directory.

It contains named runtime-facing Markdown documents whose exact file identity matters to a consumer runtime.

Validation rules:

- Surface files MUST be UTF-8 Markdown files ending in `.md`
- Supported canonical basenames are defined in [16 — Surfaces](./16-surfaces.md)
- Builders SHOULD annotate the layer with `dev.stax.surfaces.count`
- Consumers MUST preserve file bytes for one-to-one mapped targets such as OpenClaw workspace files

## Instruction tree layer

The instruction tree layer is a deterministic gzipped tarball of the `instruction-tree/` directory.

It contains path-scoped instruction documents for runtimes that discover instructions hierarchically by directory or scope. See [38 — Instruction Trees](./38-instruction-trees.md).

Validation rules:

- scoped instruction files MUST be Markdown files ending in `.md`
- duplicate normalized archive paths MUST be rejected
- builders SHOULD annotate the layer with `dev.stax.instruction-tree.count`

## Subagents layer

The subagents layer is compiled from `defineSubagents()` and stored as canonical JSON.

See [37 — Subagents and Agent Bundles](./37-subagents-and-agent-bundles.md).

## Secrets layer

The secrets layer contains canonical JSON with declared secret keys and metadata only.

It MUST NOT contain values.

## Packages layer

The packages layer contains canonical JSON listing resolved package references and digests.

Example:

```json
{
  "specVersion": "1.0.0",
  "packages": [
    {
      "ref": "ghcr.io/myorg/packages/github-workflow:2.0.0",
      "digest": "sha256:abc...",
      "kind": "package"
    }
  ]
}
```

## Source snapshot layer

The source snapshot layer is used only in `application/vnd.stax.source.v1` artifacts.

It contains a deterministic tarball of a prepared workspace snapshot, typically derived from:

- a Git checkout at a pinned commit
- a sparse checkout
- a source archive expanded into a directory tree

Validation rules:

- `.git/` MUST NOT be included
- VCS metadata directories such as `.hg/` and `.svn/` SHOULD NOT be included
- paths MUST be safe and deterministic under the same tar rules as other archive layers
- builders SHOULD emit annotations describing source type, commit, and file count where available

Consumers SHOULD cache source snapshot layers by digest and SHOULD reuse the same cached snapshot across many agents.

## Layer size limits

Builders SHOULD enforce the following default limits and MUST allow users to override them explicitly:

| Layer     | Default max uncompressed size | Rationale                                                |
| --------- | ----------------------------- | -------------------------------------------------------- |
| Knowledge | 256 MB                        | Largest expected layer; prevents accidental binary bloat |
| Skills    | 64 MB                         | Skills are Markdown + templates                          |
| Rules     | 16 MB                         | Rules are Markdown files                                 |
| Surfaces  | 16 MB                         | Surfaces are Markdown files                              |
| Memory    | 64 MB                         | Memory accumulates over time                             |
| Persona   | 1 MB                          | Single JSON document                                     |
| Prompt    | 1 MB                          | Single Markdown document                                 |
| MCP       | 1 MB                          | Single JSON document                                     |
| Secrets   | 1 MB                          | Single JSON document                                     |

Builders MUST warn when any single file in a tarball layer exceeds 10 MB. Builders SHOULD warn when the total uncompressed knowledge layer exceeds 100 MB.

## Layer deduplication

Because OCI storage is content-addressable, identical layers MUST produce identical digests when built by conforming builders.

Examples:

- Persona variants share all non-persona layers
- Multiple agents using the same standards package share identical rules and knowledge layers
- Unchanged knowledge layers are reused across versions

## Validation failure behavior

A builder MUST fail the build if any of the following occur:

- duplicate stax layer media types in one artifact
- invalid archive paths
- rejected file types (symlink when not flattened, socket, device, FIFO)
- unresolved declared source path
- duplicate normalized paths in a tarball
- malformed JSON or invalid frontmatter in source files
