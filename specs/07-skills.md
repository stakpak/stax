# 07 — Skills

## Overview

Skills are reusable workflows packaged as directories with a `SKILL.md` entrypoint. They commonly materialize as slash commands or command-palette actions in agent runtimes.

stax packages skills as a deterministic tarball layer. Consumers decide how skills are exposed in each runtime.

## Skill structure

```text
skills/
├── fix-issue/
│   └── SKILL.md
├── review-pr/
│   ├── SKILL.md
│   └── templates/
│       └── checklist.md
└── deploy/
    └── SKILL.md
```

Each top-level directory is one skill.

## `SKILL.md` format

```markdown
---
name: fix-issue
description: Fix a GitHub issue following team standards
allowed-tools:
  - Read
  - Grep
  - Edit
  - Bash(git *)
  - Bash(gh *)
model: claude-sonnet-4-1
user-invocable: true
argument-hint: <issue-number>
---

Fix GitHub issue $ARGUMENTS.

1. Read issue details with `gh issue view $ARGUMENTS`
2. Understand the codebase context
3. Implement the fix
4. Write tests
5. Create a PR referencing the issue
```

## Frontmatter schema

| Field            | Type     | Required | Description                             |
| ---------------- | -------- | -------- | --------------------------------------- |
| `name`           | string   | Yes      | Skill name                              |
| `description`    | string   | Yes      | Human-readable summary                  |
| `allowed-tools`  | string[] | No       | Tool permission hints                   |
| `model`          | string   | No       | Model override hint                     |
| `user-invocable` | boolean  | No       | Whether users may call it directly      |
| `argument-hint`  | string   | No       | Placeholder text for expected arguments |
| `priority`       | number   | No       | Ordering hint in UIs                    |
| `tags`           | string[] | No       | Discovery metadata                      |

### Validation

- The top-level directory name SHOULD match `name`
- `name` MUST match `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- Unknown frontmatter fields MAY be preserved, but consumers MAY ignore them
- `allowed-tools` MUST be a YAML list in spec `1.0.0`

## Variable substitution

Supported variables in `SKILL.md` body:

| Variable            | Description                                       |
| ------------------- | ------------------------------------------------- |
| `$ARGUMENTS`        | Full argument string                              |
| `$ARGUMENTS[N]`     | Positional argument, zero-based                   |
| `${STAX_SKILL_DIR}` | Absolute path to the materialized skill directory |
| `${STAX_WORKSPACE}` | Workspace root if known                           |

### Substitution rules

- Substitution is textual only
- Missing positional arguments resolve to an empty string
- Consumers MUST NOT evaluate shell expressions during substitution
- To emit a literal `$ARGUMENTS`, consumers MUST support escaping as `\$ARGUMENTS`. The same escaping MUST apply to `\$ARGUMENTS[N]`, `\${STAX_SKILL_DIR}`, and `\${STAX_WORKSPACE}`

## Collision semantics

When packages are merged, skills are keyed by top-level skill directory name.

Higher-precedence sources replace the entire lower-precedence skill directory.

## OCI layer

Skills are packaged as `application/vnd.stax.skills.v1.tar+gzip`.

Builders SHOULD annotate the layer with `dev.stax.skills.count`.

## Consumer expectations

Consumers SHOULD:

- preserve the skill directory structure
- expose frontmatter metadata where supported
- warn when the runtime does not support per-skill tool permission hints or model overrides
