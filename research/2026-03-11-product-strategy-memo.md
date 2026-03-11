# Product Strategy Memo

Date: 2026-03-11

## Executive summary

`stax` should not launch as "the standard for all agents."

It should launch as:

**the system of record for coding-agent assets across runtimes**

In practical terms:

- build
- import
- version
- sign
- approve
- promote
- materialize
- roll back

for agents, skills, rules, MCP config, and shared source context across Claude Code, Codex, Copilot-class tools, and enterprise environments.

That wedge is narrow enough to win and broad enough to matter.

## Market read

As of 2026-03-11, the market is fragmented in three ways:

- vendor-native runtimes own their own config surfaces
- agent frameworks own execution and deployment inside their own stack
- open standards are emerging, but mostly around protocols or schemas, not distribution

That creates a real gap:

- no neutral artifact layer
- no neutral promotion and rollback model
- no neutral package and policy layer
- no neutral install-plan and approval workflow

## The right buyer

Primary buyer:

- platform engineering
- developer productivity
- security and governance

Secondary buyer:

- large internal AI tooling teams
- consultancies standardizing client-facing agent assets

Poor initial buyer:

- solo developers
- general consumer marketplace users

Why:

- individual developers can tolerate ad hoc files
- enterprises cannot tolerate untracked agent drift, unreviewed MCP servers, or unmanaged instruction bundles

## Core problem to solve

Today, agent assets are operationally immature:

- prompts live in Markdown
- rules live in tool-specific folders
- MCP config is runtime-specific
- shared skills are copied, not versioned
- promotion is manual
- provenance is weak
- trust and policy are bolted on after the fact

`stax` should make agent assets behave like deployable software artifacts.

## Product definition

### Phase 1 product

Ship a practical control plane for coding-agent assets:

- import from vendor-native layouts
- build canonical artifacts
- materialize back into target runtimes
- show exact drift between artifact and workspace
- pin packages and MCP dependencies by digest
- attach signatures, evaluations, and approvals
- promote the same digest across environments

This is the first product that feels inevitable.

### Phase 2 product

Add registry and policy workflows:

- internal catalog
- install plans
- policy gates
- environment approvals
- mirroring and lifecycle state
- publisher and package trust

### Phase 3 product

Expand into hosted and remote import:

- hosted platform adapter contracts
- remote import plans
- account or org-scoped installs
- compatibility preflight for cloud runtimes

## Positioning

### Category

Do not position as:

- agent runtime
- agent framework
- workflow builder
- autonomous platform

Position as:

- distribution and governance layer for agent assets

### Messaging

Best short description:

`stax is OCI, lockfiles, and promotion workflows for coding-agent assets.`

Best buyer-centric description:

`stax lets enterprise teams manage agent instructions, skills, MCP config, and runtime packaging like real software artifacts.`

Bad description:

`universal standard for all agents`

That is a long-term ambition, not a useful wedge.

## Wedge strategy

### Why coding agents first

Coding-agent runtimes already expose file contracts, skills, rules, MCP, and approval models. That makes them unusually compatible with `stax`'s architecture.

This gives `stax`:

- concrete import/export surfaces
- obvious drift problems
- obvious package reuse
- obvious security and governance pain
- a buyer who already manages repos, policies, and registries

### Why enterprise internal distribution first

Public marketplaces are seductive but weak as an initial wedge.

The stronger first workflow is:

- "we have 50 internal agents and 20 MCP servers"
- "we need approvals and rollback"
- "we need one blessed package of rules and skills"
- "we need the same agent to land in Claude Code and Codex without hand-editing"

That pain already exists.

## Product pillars

### 1. Build and import

Turn runtime-native layouts into canonical artifacts and back again.

This is how `stax` becomes unavoidable instead of theoretical.

### 2. Policy and trust

Make agent packages safe to use in real organizations:

- trusted publishers
- signed artifacts
- policy-evaluated MCP servers
- approval workflows
- revocation and deprecation

### 3. Promotion and rollback

Enable real software delivery patterns:

- dev to staging to production
- channel-based promotion
- digest pinning
- reproducible rollback

### 4. Exactness and drift detection

Tell teams whether runtime materialization is:

- exact
- lossy
- unsupported

and show the consequences before changes are applied.

### 5. Shared packages

Drive package reuse for:

- org standards
- security rules
- compliance packs
- MCP bundles
- domain skill packs

## Competitive position

`stax` wins when the buyer wants:

- runtime neutrality
- artifact immutability
- governance
- promotion
- package reuse

`stax` loses when the buyer wants:

- one vendor stack end to end
- execution orchestration
- agent graph tooling
- hosted deployment without caring about portability

That is fine. Do not chase every buyer.

## Biggest risks

### 1. Spec-first trap

Risk:

The project becomes admired but not adopted.

Mitigation:

Ship import, materialize, diff, approve, promote, and policy as product workflows early.

### 2. Runtime-vendor capture

Risk:

Vendors improve their native packaging and marketplaces enough that cross-runtime tooling feels unnecessary.

Mitigation:

Focus on enterprise multi-runtime environments and internal governance, where neutral control still matters.

### 3. Over-broad scope

Risk:

Trying to support every kind of agent before owning coding-agent assets.

Mitigation:

Narrow public scope. Keep broad architecture privately.

### 4. Exactness maintenance burden

Risk:

Adapters rot as vendor contracts change.

Mitigation:

Certification fixtures, runtime-version pinning, and explicit fidelity classes.

## Strategic recommendations

### Recommendation 1

Own the phrase:

`agent asset supply chain`

It is precise, buyer-relevant, and difficult for frameworks to claim honestly.

### Recommendation 2

Make import/export first-class:

- import Claude Code project
- import Codex repo
- import Copilot workspace
- normalize into `stax`
- diff and re-materialize safely

This is the feature that converts curiosity into adoption.

### Recommendation 3

Make policy the premium feature, not the marketplace.

Buyers will pay faster for:

- allowed MCP servers
- signed packages
- required approvals
- environment-specific promotion gates

than for a public package storefront.

### Recommendation 4

Treat MCP as complementary infrastructure.

Do not fight the MCP Registry. Integrate with it and become the artifact layer above it.

### Recommendation 5

Add first-class support for:

- subagents
- path-scoped instructions
- hosted import

Those are now table stakes for a serious standard thesis.

## Success metrics

Early metrics:

- number of imported existing agent setups
- number of artifacts materialized back into more than one runtime
- number of approved package installs
- percentage of installs using digest pinning
- number of blocked unsafe MCP or package admissions

Later metrics:

- packages reused across teams
- environments promoted without rebuild
- external consumer implementations
- conformance profiles passed by third parties

## Recommended 12-month sequence

### Quarter 1

- stable artifact core
- import/export for top coding-agent runtimes
- artifact diff and materialization reports

### Quarter 2

- internal registry or registry overlay
- install plans
- signatures and approvals
- package and MCP policy gates

### Quarter 3

- promotion channels
- mirroring
- compatibility metadata
- conformance harness

### Quarter 4

- hosted import contracts
- subagent packaging
- selective ecosystem and partner rollout

## Final recommendation

The product should be built and sold as infrastructure for teams who already have agent sprawl and need control. If it wins there, it can later earn the right to call itself a standard.

If it starts by asking the market to adopt a universal format on faith, it will likely lose to vendor defaults and framework gravity.
