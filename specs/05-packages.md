# 05 — Packages

## Overview

Packages are reusable configuration bundles published as OCI artifacts. They are the main unit of sharing in the stax ecosystem.

A package MAY contain any combination of:

- MCP
- Skills
- Rules
- Knowledge
- Surfaces
- Secrets
- Instruction trees
- Subagents
- Dependencies on other packages

Packages do not contain a prompt or persona in spec `1.0.0`.

## definePackage()

```typescript
import { definePackage } from "stax";

export default definePackage({
  name: "github-workflow",
  version: "2.0.0",
  description: "MCP servers and skills for GitHub workflows.",
  author: "myorg",
  license: "MIT",
  tags: ["github", "pr", "code-review"],

  mcp: "./mcp-servers.ts",
  skills: "./skills/",
  rules: "./rules/",
  knowledge: "./knowledge/",
  surfaces: "./surfaces/",

  packages: ["ghcr.io/myorg/packages/git-utils:1.0.0"],

  secrets: [{ key: "GITHUB_TOKEN", required: true }],
});
```

## Package artifact

Packages use the same OCI manifest shape as agents but with:

```text
artifactType: application/vnd.stax.package.v1
```

The config blob MUST contain `kind: "package"`.

## Dependency resolution

### Allowed references

Package references follow the same rules as agent package references:

- relative local path
- exact OCI tag reference
- OCI digest reference

### Resolution algorithm

Builders MUST resolve the dependency graph depth-first in declaration order.

Resolution rules:

1. The current artifact's direct `packages` list is traversed in source order
2. Each package is resolved to an exact digest
3. Transitive dependencies are resolved recursively
4. A previously resolved `(ref, digest)` pair MUST be deduplicated — if the same ref resolves to the same digest at a different point in the tree, it is visited only once
5. Circular dependencies MUST fail validation. The error message MUST include the cycle path (e.g., `A → B → C → A`)
6. The dependency graph MUST NOT exceed a depth of **32** levels. Builders MUST fail with a clear error if this limit is reached

### Conflict policy

If the same package reference resolves to different digests in one dependency graph (diamond dependency), the builder MUST:

1. Check `stax.lock` — if the lockfile pins an exact digest for the conflicting reference and all declarations are tag-based (not digest-pinned to a different value), the locked digest wins
2. If no lockfile resolution is possible, fail with a dependency conflict error that identifies:
   - the conflicting package reference
   - the two (or more) digests it resolved to
   - the dependency paths that produced each resolution

Builders SHOULD suggest resolution strategies in the error output, such as:

- pinning a specific digest in the agent's `packages` list
- running `stax build --refresh-lock` to resolve to the latest compatible version

### Floating version resolution

Package references in `packages` arrays in `definePackage()` follow the same rules as agent manifests: semver ranges and `latest` SHOULD NOT appear in committed source files. Builders MAY allow them interactively but MUST resolve and pin them in `stax.lock`.

## Merge semantics

Package layers are merged into the consuming agent or package in declaration order.

Precedence order:

1. Transitive dependencies (lowest)
2. Direct dependencies in declaration order
3. The consuming artifact's own layers (highest)

### Merge table

| Layer     | Merge unit                | Conflict key                            | Rule                                                                           |
| --------- | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| MCP       | server object             | server name                             | Replace entire server object at the highest-precedence definition              |
| Skills    | top-level skill directory | skill name                              | Higher precedence replaces the entire skill directory                          |
| Rules     | rule file                 | rule `id` if present, else archive path | Higher precedence replaces matching rule; otherwise append in precedence order |
| Knowledge | archive path              | normalized path                         | Higher precedence replaces matching path                                       |
| Surfaces  | surface file              | basename                                | Higher precedence replaces the entire file                                     |
| Secrets   | secret key                | `key`                                   | Higher precedence replaces entire declaration                                  |
| Instruction Trees | instruction file  | normalized archive path                 | Higher precedence replaces matching path                                       |
| Subagents | agent definition          | agent name                              | Higher precedence replaces entire agent definition                             |

### Rationale

stax uses **replace**, not deep merge, for structured conflicts. This avoids non-deterministic behavior and ambiguous list merging.

For example, if two packages define the `github` MCP server, the higher-precedence definition replaces the lower one entirely.

## Rules ordering

After rule replacement/deduplication, remaining rules are ordered by:

1. precedence level (lowest to highest)
2. explicit `priority` ascending
3. normalized archive path ascending

Consumers MAY apply additional runtime-specific ordering, but SHOULD preserve the canonical order when possible.

## Skills conflict behavior

A skill is identified by its top-level directory name.

If two packages provide `skills/fix-issue/`, the higher-precedence package wins and the lower-precedence directory is discarded entirely.

## Knowledge conflict behavior

Knowledge files are identified by normalized archive path.

If two sources provide the same path, the higher-precedence file wins.

Consumers SHOULD retain path provenance when materializing or indexing merged knowledge.

## Secrets merging

Secrets are merged by `key`.

Higher precedence replaces the full declaration, including:

- `required`
- `description`
- `kind`
- `exposeAs`

## Lock file

`stax build` MUST produce `stax.lock` when package resolution occurs.

### Lockfile goals

- pin exact digests
- make builds reproducible
- surface dependency conflicts early

### Lockfile example

```json
{
  "lockVersion": 1,
  "specVersion": "1.0.0",
  "packages": {
    "ghcr.io/myorg/packages/github-workflow:2.0.0": {
      "digest": "sha256:abc...",
      "dependencies": ["ghcr.io/myorg/packages/git-utils:1.0.0"]
    },
    "ghcr.io/myorg/packages/git-utils:1.0.0": {
      "digest": "sha256:def...",
      "dependencies": []
    }
  }
}
```

Builders SHOULD fail in CI when `stax.lock` is out of date unless explicitly told to refresh it.

## Package source directory structure

```text
my-package/
├── package.ts
├── mcp-servers.ts
├── skills/
├── rules/
├── knowledge/
├── surfaces/
├── .staxignore
└── stax.lock
```

## Publishing guidance

Package authors SHOULD:

- publish immutable semver tags
- sign released artifacts
- pin transitive dependencies via `stax.lock`
- avoid breaking package behavior behind unchanged tags
