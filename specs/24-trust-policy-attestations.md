# 24 — Trust, Policy, and Attestations

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

Distribution standards matter most when artifacts can be trusted.

For stax to be viable across enterprises, hosted platforms, and public marketplaces, consumers need more than raw artifact bytes. They need a standard way to determine:

- who published an artifact
- whether it is signed
- what provenance it has
- what evaluations it passed
- whether it is approved for a target environment
- whether it has been deprecated, yanked, or revoked
- whether its declared packages, MCP servers, or capabilities violate policy

This document defines the future trust and policy layer for stax.

## Design goals

The trust model SHOULD:

1. preserve digest-first immutability
2. work with OCI referrers
3. support both public and private trust policies
4. allow artifact approval and promotion without rebuilding artifacts
5. separate publisher attestations from consumer policy decisions
6. support offline and air-gapped verification where feasible

## Non-goals

This document does not define:

- runtime authorization enforcement
- secret storage backends
- cloud IAM
- execution-time sandbox enforcement

## Terminology

### Trust root

A signing authority, public key set, or identity issuer trusted by a consumer.

### Attestation

A signed or attributable statement attached to an artifact digest.

### Policy bundle

A consumer-side ruleset describing admission requirements for install, import, mirror, or promotion operations.

### Policy result

A record stating whether a policy bundle passed or failed for a specific artifact at a point in time.

### Revocation

A trust state indicating that an artifact MUST be treated as unsafe or untrusted.

## Trust model

stax trust has four layers:

1. **Publisher identity**
   Who claims authorship of the artifact.
2. **Cryptographic verification**
   Whether the bytes were signed by a trusted identity.
3. **Attestations**
   Additional statements attached to the digest, such as provenance, evaluation results, or approvals.
4. **Consumer policy**
   Local or organizational rules deciding whether the artifact may be installed, mirrored, imported, or promoted.

## Publisher identity

Registries and consumers SHOULD track:

- publisher id
- display name
- verification status
- signing identities
- namespace ownership

The package namespace and the signing identity SHOULD be linkable, but need not be identical strings.

## Attestation artifact types

stax `1.0.0` already defines baseline referrers for:

- `application/vnd.stax.signature.v1`
- `application/vnd.stax.evaluation.v1`
- `application/vnd.stax.approval.v1`
- `application/vnd.stax.memory-snapshot.v1`

Future standardization SHOULD add:

- `application/vnd.stax.provenance.v1`
- `application/vnd.stax.policy-result.v1`
- `application/vnd.stax.revocation.v1`
- `application/vnd.stax.sbom.v1`

## Signature model

Signatures SHOULD support:

- offline verification by trusted public keys
- keyless verification with issuer identity when available
- multiple signatures on the same artifact
- signature copying during mirroring

Consumers SHOULD support verification policies:

- `none`
- `warn`
- `require`

Enterprises SHOULD be able to require signatures from specific publishers or trust roots.

### Signature decision rules

- `none` means signatures are not checked
- `warn` means missing or invalid signatures produce warnings but do not block installation
- `require` means at least one valid signature from a trusted identity MUST be present or the operation MUST fail

## Provenance attestation

A provenance attestation SHOULD answer:

- what source repository produced this artifact
- what commit or source snapshot was used
- what builder produced it
- what dependency lockfile was in effect
- when it was built

Example config blob:

```json
{
  "specVersion": "1.0.0",
  "builder": "stax-cli@1.2.0",
  "builtAt": "2026-03-11T12:00:00Z",
  "source": {
    "repo": "https://github.com/acme/backend-agent",
    "commit": "abc123"
  },
  "lockDigest": "sha256:def..."
}
```

### Required provenance fields

- `builder`
- `builtAt`
- either source repo+commit or an equivalent source artifact digest reference

## Evaluation attestation

An evaluation attestation SHOULD include:

- suite name
- suite version
- target artifact digest
- status
- summary metrics
- executed time
- evaluator identity

Suggested statuses:

- `passed`
- `failed`
- `warning`
- `informational`

### Evaluation policy semantics

When a policy requires an evaluation suite:

- at least one matching evaluation with `status: "passed"` MUST be present
- a newer `failed` evaluation for the same suite MAY be treated as blocking by consumer policy

The exact recency rules are consumer-defined unless standardized in a future policy profile.

## Approval attestation

An approval attestation SHOULD support:

- human approvals
- system approvals
- environment scoping
- expiry
- policy references

Example:

```json
{
  "specVersion": "1.0.0",
  "approvalId": "prod-approved-2026-03-11",
  "subject": "sha256:abc...",
  "approvedBy": "platform-security@acme",
  "scope": {
    "environment": "production"
  },
  "expiresAt": "2026-06-01T00:00:00Z"
}
```

### Approval decision rules

- approvals MAY be scoped by environment, registry, mirror, or consumer type
- expired approvals MUST NOT satisfy a policy requirement
- multiple approvals MAY coexist for one digest

## Revocation

Revocation is distinct from deprecation and yanking.

- `deprecated` means discouraged
- `yanked` means hidden from normal resolution
- `revoked` means actively unsafe or untrusted

A revocation attestation SHOULD contain:

- target digest
- revoked by
- reason code
- timestamp
- optional replacement digest

Consumers with trust enforcement enabled MUST fail installation of revoked artifacts unless explicitly overridden.

### Suggested reason codes

- `compromised`
- `malicious`
- `policy-failure`
- `publisher-request`
- `superseded-security-fix`

## Policy model

Consumer policy decides whether a given artifact may be installed, imported, mirrored, or promoted.

Policy SHOULD be evaluated against:

- artifact metadata
- package dependency graph
- source artifact metadata
- referrer attestations
- registry origin
- publisher identity

## Policy bundle

Organizations SHOULD be able to define a policy bundle separate from the artifact itself.

Example:

```json
{
  "policyVersion": 1,
  "requireSignatures": true,
  "trustedPublishers": ["acme", "community-approved"],
  "trustedSigners": ["sigstore:acme", "key:platform-security"],
  "requiredEvaluations": ["smoke", "policy"],
  "requiredApprovals": {
    "production": ["prod-approved"]
  },
  "allowedRegistries": ["ghcr.io/acme", "registry.acme.internal"],
  "denyPackages": ["untrusted/debug-agent"],
  "denyStates": ["revoked"]
}
```

Policy bundles are consumer-side controls and MUST NOT change artifact bytes.

### Recommended policy controls

Consumers SHOULD support policy rules for:

- allowed registries
- allowed namespaces
- required signatures
- trusted signer identities
- required evaluation suites
- required approvals for target environments
- forbidden MCP server publishers or commands
- forbidden package namespaces
- maximum artifact age
- required compatibility targets
- revocation enforcement

## Policy evaluation result

A policy engine SHOULD produce a result equivalent to:

```json
{
  "policy": "acme-prod-admission-v3",
  "subject": "sha256:abc...",
  "result": "passed",
  "evaluatedAt": "2026-03-11T12:30:00Z",
  "checks": [
    { "name": "signature", "result": "passed" },
    { "name": "provenance", "result": "passed" },
    { "name": "approval:production", "result": "passed" }
  ],
  "warnings": []
}
```

### Result values

Consumers SHOULD support:

- `passed`
- `failed`
- `warning`

If a required check fails, the overall result MUST be `failed`.

## Policy result attestation

A consumer or platform MAY attach a policy result referrer stating that an artifact passed a policy at a point in time.

This is useful for:

- promotion pipelines
- enterprise mirrors
- pre-approved marketplaces

Example:

```json
{
  "specVersion": "1.0.0",
  "policy": "acme-prod-admission-v3",
  "result": "passed",
  "evaluatedAt": "2026-03-11T12:30:00Z",
  "subject": "sha256:abc..."
}
```

Policy-result attestations are informative unless a consumer explicitly chooses to trust them as admission evidence.

## Promotion gates

Promotion SHOULD be driven by trust signals rather than rebuilds.

A registry or platform SHOULD be able to require:

- valid signature
- provenance present
- required evaluations passed
- required approval attached
- no revocation present

before an artifact can move to an `approved` or `stable` channel.

## Mirror behavior

Mirrors SHOULD:

- preserve upstream signatures and attestations
- allow local approvals and policy-result attestations
- preserve original digests
- reject revoked artifacts by default

Mirrors MUST NOT silently rewrite or strip trust metadata.

## CLI additions

The reference CLI SHOULD eventually add:

```bash
stax sign <ref>
stax verify <ref>
stax attest <ref> --type provenance
stax approve <ref> --environment production
stax revoke <ref> --reason compromised
stax policy check <ref> --policy ./policy.json
```

## Relationship to install

Install, import, mirror, and promotion flows SHOULD consume this trust model as follows:

1. resolve artifact digest
2. collect applicable attestations
3. verify signatures according to policy
4. evaluate policy bundle
5. fail, warn, or proceed according to result

`require`-style enforcement MUST fail before mutating the target environment.

## Open design questions

The following need further design:

1. the canonical signature payload format to require by default
2. how trust policies should be serialized and versioned
3. whether approval attestations should support delegation chains
4. whether policy bundles should themselves be distributable as stax artifacts
