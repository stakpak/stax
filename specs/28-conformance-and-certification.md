# 28 — Conformance and Certification

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

A standard without conformance testing becomes documentation, not infrastructure.

This document defines how stax should approach conformance, interoperability, and certification.

## Design goals

Conformance SHOULD:

1. prove that builders generate deterministic artifacts
2. prove that consumers interpret artifacts consistently
3. prove adapter exactness claims against real runtime versions
4. allow multiple independent implementations

## Non-goals

This document does not define:

- commercial program ownership
- trademark policy
- runtime vendor endorsement

## Conformance roles

### Builder conformance

Validates that a builder:

- produces canonical JSON
- produces deterministic tarball layers
- honors ignore behavior
- resolves packages correctly
- fails correctly on invalid input

### Consumer conformance

Validates that a consumer:

- enforces spec version compatibility
- merges layers and packages correctly
- applies adapter fallback correctly
- emits required warnings for lossy behavior
- handles secret declarations correctly

### Adapter conformance

Validates that an adapter implementation:

- writes exact targets where claimed
- preserves bytes where required
- reports lossy translation correctly
- matches the documented runtime file contract

### Registry conformance

Validates that a registry or registry-compatible service:

- preserves pull/push semantics
- preserves referrers
- maintains metadata consistency
- supports channels and lifecycle behavior correctly

## Conformance profiles

Implementations SHOULD be tested and reported by profile.

Suggested profiles:

- `builder-core`
- `consumer-core`
- `registry-core`
- `claude-exact`
- `codex-exact`
- `openclaw-exact`
- `hosted-import`

An implementation MAY claim multiple profiles.

## Certification labels

Suggested labels:

- `stax-builder-compatible`
- `stax-consumer-compatible`
- `stax-registry-compatible`
- `stax-claude-exact`
- `stax-codex-exact`
- `stax-openclaw-exact`
- `stax-hosted-import-compatible`

These labels SHOULD only be used if the corresponding profile passes.

## Test corpus

stax SHOULD maintain a public corpus of:

- valid artifacts
- intentionally invalid artifacts
- lossy adapter cases
- trust-policy examples
- source artifact examples
- lifecycle and mirroring examples

### Corpus categories

The corpus SHOULD include at least:

1. minimal valid agent
2. package merge conflicts
3. deterministic rebuild equivalence
4. invalid symlink or unsafe archive inputs
5. runtime exactness fixtures for Claude, Codex, and OpenClaw
6. install-plan and trust-policy fixtures
7. hosted import fixtures

## Builder conformance requirements

A builder profile SHOULD test:

- identical inputs produce identical digests
- canonical JSON ordering
- tar path normalization
- metadata normalization
- `.staxignore` behavior
- package resolution and lockfile behavior
- validation failure behavior

A builder MUST fail the profile if it produces different digests for the same canonical input under repeated execution in the same environment.

## Consumer conformance requirements

A consumer profile SHOULD test:

- major-version rejection behavior
- unknown additive field tolerance
- package merge precedence
- adapter fallback behavior
- exact versus portable materialization mode behavior
- secret validation timing

## Adapter exactness requirements

An adapter claiming exactness MUST be tested against:

- the documented runtime file contract
- the runtime version range it claims to support
- byte-preserving mappings where applicable
- failure or warning behavior for synthesized outputs

Generic adapters MUST NOT claim exactness certification.

### Runtime fixtures

Each exact adapter profile SHOULD include:

- canonical input artifact
- expected output tree
- expected warnings
- runtime version metadata
- subagent and instruction-tree fixtures when the runtime supports them

## Registry conformance requirements

A registry profile SHOULD test:

- digest-stable artifact storage
- referrer preservation
- lifecycle metadata behavior
- channel movement
- copy and mirror semantics
- search and lookup consistency where discovery APIs are implemented

## Hosted import conformance

A hosted import profile SHOULD test:

- import-plan generation
- fidelity reporting
- compatibility preflight behavior
- failure on unsupported targets
- lossy warnings for partial imports

## Result format

Conformance runs SHOULD produce machine-readable results.

Suggested shape:

```json
{
  "implementation": "stax-cli",
  "version": "1.3.0",
  "profiles": [
    {
      "name": "builder-core",
      "result": "passed"
    },
    {
      "name": "codex-exact",
      "result": "passed"
    }
  ],
  "testedAt": "2026-03-11T16:00:00Z"
}
```

## Publishing results

Conformance results MAY be published:

- in CI logs
- in registry metadata
- as discovery metadata
- as stax referrers in a future extension

## Runtime drift

Exact adapter claims are sensitive to runtime changes.

Therefore:

- exact adapter profiles SHOULD record the runtime version tested
- implementations SHOULD re-run exactness profiles when runtime versions change materially
- an implementation SHOULD NOT claim exact support for an untested runtime major version
- an implementation SHOULD downgrade exact claims when runtime-version coverage is missing or stale

## Open design questions

1. whether certification should be self-attested or centrally verified
2. how runtime-version drift should invalidate exact adapter claims
3. whether conformance results should be publishable as stax referrers
