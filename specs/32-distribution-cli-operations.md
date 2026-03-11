# 32 — Distribution CLI Operations

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

If stax is the equivalent of `docker build`, `docker push`, and `docker pull` for agents, the CLI must eventually expose the full set of distribution operations required by real users.

This document defines the future CLI surface beyond `1.0.0`.

## Design goals

The CLI SHOULD:

1. make distribution workflows obvious
2. support both human and automation use cases
3. support local runtimes and hosted platforms
4. expose trust and lifecycle controls cleanly

## Command families

The future CLI surface SHOULD be grouped into:

- discovery
- install and import
- trust
- lifecycle
- transfer

## Proposed commands

```bash
stax search <query>
stax show <package>
stax install <ref-or-package>
stax import-plan <ref>
stax sign <ref>
stax attest <ref>
stax approve <ref>
stax policy check <ref>
stax promote <ref> --channel stable
stax deprecate <ref>
stax yank <ref>
stax revoke <ref>
stax copy <ref> <target>
stax mirror <source> <target>
```

## Discovery commands

### `stax search`

Searches discovery metadata for packages and agents.

The command SHOULD support filtering by:

- kind
- runtime
- publisher
- tags
- lifecycle state
- verified publisher

### `stax show`

Displays package-level and version-level metadata including:

- publisher
- versions
- channels
- lifecycle state
- compatibility summary
- trust summary

## Install and import commands

### `stax install`

`stax install` SHOULD:

1. resolve a package, version, channel, or digest
2. fetch discovery metadata
3. evaluate trust and safety policy
4. pull the artifact
5. generate an install plan
6. materialize or import the artifact

`install` SHOULD support:

- local runtime targets
- hosted consumer targets
- `--plan-only`
- `--json`
- `--policy <file>`

### `stax import-plan`

Generates an import or install plan without mutating the target environment.

This SHOULD be the primary command for:

- hosted platforms
- CI review of install impact
- enterprise approval workflows

## Trust commands

### `stax sign`

Attaches a signature or delegates to a configured signing backend.

### `stax attest`

Attaches attestations such as:

- provenance
- evaluation
- policy result

### `stax approve`

Attaches an approval attestation, optionally scoped to an environment.

### `stax policy check`

Evaluates policy against a selected artifact without installing it.

The command SHOULD be able to emit:

- pass/fail result
- failing checks
- warnings
- machine-readable JSON

## Lifecycle commands

### `stax promote`

Moves a channel pointer to a digest.

### `stax deprecate`

Marks an artifact as deprecated with a reason.

### `stax yank`

Marks an artifact as yanked from normal resolution.

### `stax revoke`

Marks an artifact as revoked, typically by attaching or referencing revocation metadata.

## Transfer commands

### `stax copy`

Copies one artifact and associated metadata to another registry location.

### `stax mirror`

Synchronizes packages, namespaces, or policy-selected artifact sets between registries.

## Machine-readable behavior

All future distribution commands SHOULD support a machine-readable mode.

Suggested flag:

```bash
--json
```

The JSON output SHOULD include:

- resolved digest
- selected package/version/channel
- policy results when applicable
- warnings
- actions taken or planned

## Failure behavior

Commands SHOULD fail before mutation when:

- trust policy fails
- compatibility is unsupported
- lifecycle state blocks installation
- required signatures or approvals are missing

## Relationship to the reference CLI

Some of these commands may initially ship as companion tools rather than the minimal reference CLI.

However, the logical operations themselves SHOULD be considered part of the long-term stax distribution experience.

## Open design questions

1. which of these commands belong in the reference CLI versus companion tools
2. how much install behavior should be standardized for hosted consumers
3. whether promotion and lifecycle commands require a standard registry API first
