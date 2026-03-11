# Brutal Spec Critique

Date: 2026-03-11

Scope reviewed:

- [VISION.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/VISION.md)
- [specs/00-overview.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/00-overview.md)
- [specs/01-agent-manifest.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/01-agent-manifest.md)
- [specs/05-packages.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/05-packages.md)
- [specs/12-adapters.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/12-adapters.md)
- [specs/15-materialization.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/15-materialization.md)
- [specs/17-runtime-file-contracts.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/17-runtime-file-contracts.md)
- [specs/23-registry-discovery-install.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/23-registry-discovery-install.md)
- [specs/24-trust-policy-attestations.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/24-trust-policy-attestations.md)
- [specs/25-hosted-platform-adapter-contract.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/25-hosted-platform-adapter-contract.md)
- [specs/26-compatibility-and-capability-metadata.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/26-compatibility-and-capability-metadata.md)
- [specs/27-package-and-marketplace-metadata.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/27-package-and-marketplace-metadata.md)
- [specs/28-conformance-and-certification.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/28-conformance-and-certification.md)

## Bottom line

The spec is strong where most agent projects are weak:

- boundary discipline
- artifact thinking
- OCI alignment
- package merge determinism
- runtime materialization
- conformance thinking

It is weak where the market is moving fastest:

- subagents and multi-agent composition
- hierarchical instruction trees
- hosted import surfaces
- policy and trust as a day-one product requirement
- marketplace and discovery ergonomics
- vendor-native ecosystem parity

The biggest problem is not quality. The biggest problem is product gravity. The parts that make `stax` commercially valuable are still drafts.

## What is excellent and should not be diluted

- The boundary principle in [VISION.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/VISION.md) is correct. `stax` should not become a runtime.
- `surfaces` is one of the best ideas in the spec. Most agent systems flatten too much.
- The split between agent, package, source, profile, and referrer artifacts is much more mature than most competing efforts.
- Deterministic packaging and content addressing are the right defaults if the target buyer is enterprise platform engineering.
- The conformance section is a real moat if executed.

## P0 issues

### 1. The product-defining value sits outside the normative core

Relevant specs:

- [specs/23-registry-discovery-install.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/23-registry-discovery-install.md)
- [specs/24-trust-policy-attestations.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/24-trust-policy-attestations.md)
- [specs/25-hosted-platform-adapter-contract.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/25-hosted-platform-adapter-contract.md)
- [specs/26-compatibility-and-capability-metadata.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/26-compatibility-and-capability-metadata.md)

Problem:

The spec claims to be the distribution standard for agents, but install planning, trust policy, hosted import, and compatibility are all forward drafts. That means the current normative core is closer to a packaging format than a usable distribution standard.

Why it matters:

- Buyers pay for governance and safe rollout, not just serialization.
- Open ecosystems only work when search, install intent, trust, and compatibility are first-class.
- "OCI artifact for agents" is intellectually clean but commercially incomplete.

Fix:

- Promote a minimum viable subset of install planning, trust, and compatibility into the first stable product contract.
- If that is too much, narrow the message: call `1.0` a packaging and materialization standard, not a full distribution standard.

### 2. Subagents are under-modeled

Relevant specs:

- [specs/17-runtime-file-contracts.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/17-runtime-file-contracts.md)
- [specs/34-adapter-github-copilot.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/34-adapter-github-copilot.md)
- [specs/36-adapter-opencode.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/36-adapter-opencode.md)

Problem:

The market already has subagents, custom agents, and agent-role definitions. The spec mostly treats these as future or adapter-local details. That is too late.

Why it matters:

- Multi-agent decomposition is moving from research novelty to product default.
- If `stax` cannot package an agent bundle with named agent roles and handoff metadata, it will feel incomplete.
- Competitors can position `stax` as "just a prompt packager."

Fix:

- Add a first-class `agents/` or `subagents/` canonical layer.
- Model named agent roles, invocation policy, handoff contracts, and scope.
- Keep orchestration out of scope, but do not keep agent bundles out of scope.

### 3. Hierarchical instruction trees are under-modeled

Relevant specs:

- [specs/16-surfaces.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/16-surfaces.md)
- [specs/20-adapter-codex.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/20-adapter-codex.md)
- [specs/33-adapter-cursor.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/33-adapter-cursor.md)
- [specs/34-adapter-github-copilot.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/34-adapter-github-copilot.md)

Problem:

The spec has a strong concept of `instructions.md`, but modern coding-agent tools increasingly support nested, scoped, or path-sensitive instruction discovery. `stax` currently models one primary instruction surface plus rule translation, which is not enough for exact parity.

Why it matters:

- Exactness claims become fragile.
- Teams with monorepos and subdirectory-specific behavior will hit the ceiling immediately.
- Path-scoped behavior is now normal, not edge case behavior.

Fix:

- Add a canonical multi-path instructions layer or extension.
- Model path scope directly rather than forcing every runtime into a single root document plus rules.

### 4. Hosted consumers are second-class in the current architecture

Relevant specs:

- [specs/12-adapters.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/12-adapters.md)
- [specs/15-materialization.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/15-materialization.md)
- [specs/25-hosted-platform-adapter-contract.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/25-hosted-platform-adapter-contract.md)

Problem:

The current core is file-oriented. The hosted import contract exists, but as a draft. That is misaligned with where budget is flowing: cloud and managed agent platforms.

Why it matters:

- If hosted import remains secondary, vendor runtimes become the real standard and `stax` becomes a translation layer for local tools.
- The strongest enterprise buyer is likely a hosted or centrally managed environment, not a single developer laptop.

Fix:

- Elevate non-filesystem targets into the main adapter model sooner.
- Define a minimum import-plan contract as part of the main product story.

### 5. There is no first-class interop strategy with MCP Registry

Relevant specs:

- [specs/06-mcp.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/06-mcp.md)
- [specs/23-registry-discovery-install.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/23-registry-discovery-install.md)
- [specs/30-package-and-mcp-safety-policy.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/30-package-and-mcp-safety-policy.md)

Problem:

MCP already has an official registry. `stax` talks about packages, discovery, and policy, but does not make it obvious whether it complements MCP Registry, wraps it, or competes with it.

Why it matters:

- Tool ecosystems are already standardizing around MCP server discovery.
- If `stax` looks like "another registry," it will pick a fight it should avoid.

Fix:

- State explicitly that MCP Registry is the source of truth for MCP server discovery when appropriate.
- Add first-class references to registry-backed MCP definitions instead of only packaging resolved config.

## P1 issues

### 6. Exactness is the right ambition, but the runtime drift burden is underestimated

Relevant specs:

- [specs/17-runtime-file-contracts.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/17-runtime-file-contracts.md)
- [specs/28-conformance-and-certification.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/28-conformance-and-certification.md)

Problem:

The spec understands runtime drift intellectually, but not operationally. Claude, Copilot, Codex, and editor-based tools are changing too fast for exactness to survive without aggressive version pinning and fixture maintenance.

Fix:

- Require explicit runtime-version ranges for exact adapter claims.
- Publish a public compatibility dashboard or fixture matrix.
- Treat "exact" as a tested certification claim, not just an adapter field.

### 7. The symlink ban collides with real runtime practices

Relevant specs:

- [specs/01-agent-manifest.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/01-agent-manifest.md)
- [specs/03-layers.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/03-layers.md)

Problem:

The spec bans symlinks aggressively for safety and determinism. That is defensible, but it clashes with real tool practices like shared rule directories.

Fix:

- Keep the default ban.
- Add a tightly constrained opt-in mode for symlinked inputs that are resolved and flattened deterministically at build time.
- Document the risk tradeoff instead of pretending the market will avoid symlinks.

### 8. Generic adapter is too vague

Relevant specs:

- [specs/12-adapters.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/12-adapters.md)
- [specs/25-hosted-platform-adapter-contract.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/25-hosted-platform-adapter-contract.md)

Problem:

`@stax/generic` is useful as an escape hatch, but it risks becoming a bucket for unverifiable claims about compatibility.

Fix:

- Make the generic adapter explicitly non-certifiable.
- Require import mode, fidelity class, and a declared target schema when using generic mode.

### 9. Discovery metadata is underspecified for go-to-market

Relevant specs:

- [specs/23-registry-discovery-install.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/23-registry-discovery-install.md)
- [specs/27-package-and-marketplace-metadata.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/27-package-and-marketplace-metadata.md)

Problem:

The discovery model is technically sane, but it is not yet good enough to power a compelling catalog experience. It lacks enough opinionated summary data to help a buyer decide quickly.

Fix:

- Add required summary fields for supported runtimes, fidelity, required secrets, source requirements, trust state, and maintenance status.
- Make the catalog speak to operators, not just artifact parsers.

### 10. Memory is conceptually right but commercially overvalued

Relevant specs:

- [specs/10-memory.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/10-memory.md)
- [specs/24-trust-policy-attestations.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/specs/24-trust-policy-attestations.md)

Problem:

Memory snapshots are elegant, but they are not the wedge. For many buyers, memory is privacy-sensitive, runtime-specific, and much less urgent than distribution and policy.

Fix:

- Keep the memory design.
- Stop treating it as a lead product message.
- Position it as an advanced extension.

## P2 issues

### 11. The naming thesis is powerful but too broad for v1 messaging

Problem:

The docs talk like `stax` should become the standard way agents are described and distributed everywhere. That is strategically dangerous before winning a narrower market.

Fix:

- Make the public positioning narrower than the long-term vision.
- Say "portable distribution for coding-agent assets" first.

### 12. Package model is strong, but package economics are absent

Problem:

The spec explains how packages work, not why publishers or buyers should care enough to adopt them.

Fix:

- Add package lifecycle, dependency trust UX, publisher reputation, and enterprise curation flows to the product narrative.

### 13. The spec is more mature than the implementation plan narrative

Problem:

The roadmap is sane, but the commercial sequence should be clearer. Packaging credibility alone will not create pull.

Fix:

- Reframe phases around buyer value:
- import/export and materialization
- registry and approvals
- policy and promotion
- ecosystem and certification

## Recommended v1 cut line

If the goal is a credible and winnable first product, the cut line should be:

- keep OCI artifact core
- keep packages, source artifacts, surfaces, adapters, materialization
- keep exact contracts for the most important coding-agent runtimes
- pull a minimum viable install-plan and trust-policy surface into the main contract
- add subagents and path-scoped instructions
- de-emphasize memory and public marketplace polish until enterprise workflows work

## Recommended spec edits in order

1. Add a "current commercial wedge" section to [VISION.md](/Users/ahmedhesham/Desktop/Work/stakpak/stax/VISION.md).
2. Add first-class subagent artifact support.
3. Add multi-path instruction tree support.
4. Promote minimum compatibility and install-plan metadata into the main contract.
5. Clarify MCP Registry interop.
6. Tighten exactness to runtime-version-certified claims.
7. Add a controlled symlink-flattening mode.
8. Constrain generic adapter claims.

## Final assessment

This is one of the better agent-spec efforts I have seen because it understands that packaging, trust, and exact materialization matter. The hard truth is that it still reads slightly more like a future standard than a product that has chosen its first battle.

That is fixable. The core ideas are not the problem. The sequencing is.
