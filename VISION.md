# VISION

## Mission

stax exists to become the standard way agents are described, packaged, versioned, verified, distributed, promoted, and installed across every environment where agents run.

The long-term goal is simple:

**Any agent, for any runtime, in any environment, should have one canonical distribution format.**

That includes:

- local developer agents
- IDE-native agents
- long-running remote agents
- autonomous cloud agents
- scheduled or event-driven agents
- organization-wide internal agents
- marketplace-delivered third-party agents
- portable private agents in air-gapped environments

stax is not the runtime. stax is the thing the runtime consumes.

## The Core Thesis

Software won because it became packageable.

Containers became standard once there was a portable image format.
Kubernetes became practical once workloads could be described declaratively.
Package ecosystems scaled once artifacts were versioned, signed, addressable, and installable.

Agents are still early because most of the ecosystem is stuck in pre-package form:

- prompts in Markdown
- skills in folders
- MCP config in runtime-specific JSON
- runtime-specific instruction files
- ad hoc memory directories
- undocumented assumptions about tools, sources, and environment

Today an "agent" is usually a pile of files tied to one tool.

stax turns that into a real artifact.

## What stax Is

stax is the **distribution layer for agents**.

It should become the standard for:

- authoring agent artifacts
- bundling their canonical brain
- expressing portable dependencies
- packaging reusable agent packages
- attaching source snapshots and runtime profiles
- publishing to registries
- signing and verifying supply chain integrity
- promoting artifacts across environments
- materializing artifacts into runtime-native formats
- enabling discovery, installation, rollback, and governance

In the future, "ship the agent" should mean "publish a stax artifact."

## What stax Is Not

stax is intentionally **not**:

- an agent runtime
- an orchestrator
- a scheduler
- a workflow engine
- a session manager
- an execution loop
- a hosting platform
- a queue processor
- a secret manager
- an observability system
- a multi-agent topology engine

Those products may consume stax, extend stax, or integrate with stax.
They should not be collapsed into stax itself.

This boundary is critical.

If stax tries to own execution, orchestration, and hosting, it will become opinionated too early, fragment by runtime, and lose the neutrality required of a standard.

## The Boundary Principle

stax should carry:

- what an agent is
- what bytes define it
- what dependencies it needs
- what source context it expects
- what secrets it declares
- what runtime-native outputs it can materialize into
- what trust and policy metadata is attached to it

stax should not carry:

- where the agent is scheduled
- how many replicas it runs
- what event starts it
- how long it executes
- how jobs are retried
- what service mesh or queue transports it uses
- what cloud account or cluster hosts it

Execution contracts can live in other products.
stax remains the distribution substrate.

## The Long-Term Vision

The future agent stack should look like this:

1. An author builds an agent in a canonical source format.
2. The agent is compiled into a deterministic stax artifact.
3. The artifact is signed, tested, approved, and published to a registry.
4. A consumer selects that artifact by tag, digest, policy, or compatibility.
5. The artifact is materialized or installed into a target runtime or platform.
6. Execution systems run it according to their own contracts.
7. Memory snapshots, evals, approvals, and attestations accumulate around the immutable artifact.
8. The same artifact can be promoted, rolled back, mirrored, and audited everywhere.

In that world:

- local tools use stax to install agents
- cloud platforms use stax to distribute agent definitions
- enterprises use stax to govern approved agents
- marketplaces use stax to list and deliver portable packages
- agent builders publish stax packages the way developers publish libraries

The artifact becomes the stable unit of exchange.

## The Standard stax Should Become

stax should aim to be:

- **OCI for agent artifacts**
- **npm for reusable agent packages**
- **Helm-like for installable agent bundles**
- **Sigstore-aware for agent trust**
- **a universal import/export layer between agent runtimes**

Not every part has to ship in one product, but the standard should be able to support all of it cleanly.

## The Core Objects

stax should continue to separate distinct concerns into distinct artifact families.

### 1. Agent artifacts

The canonical brain of an agent:

- persona
- prompt
- surfaces
- MCP
- skills
- rules
- knowledge
- seed memory
- secret declarations
- adapter metadata

### 2. Package artifacts

Reusable bundles of shared behavior and context:

- org standards
- domain toolkits
- compliance rules
- skill packs
- knowledge packs
- MCP packs

### 3. Source artifacts

Cacheable workspace or repository snapshots consumed by many agents.

### 4. Runtime profile artifacts

Portable, non-secret runtime defaults that should not live inside the agent brain.

### 5. Referrer artifacts

Metadata attached after publication:

- signatures
- evaluations
- approvals
- memory snapshots
- provenance
- policy attestations

This model is already directionally correct and should remain the foundation.

## The Jobs stax Must Do Well

If stax is the distribution standard, it must solve the full lifecycle of artifact movement.

### 1. Packaging

Build deterministic artifacts from source trees so the same inputs always produce the same digests.

### 2. Addressing

Every agent, package, source snapshot, and profile must be:

- versioned
- content-addressed
- taggable
- diffable
- reproducible

### 3. Dependency management

Agents should depend on packages and source artifacts in a way that is:

- explicit
- lockable
- inspectable
- mergeable
- conflict-aware

### 4. Materialization

A single canonical artifact should map into many runtimes without manual rewriting.

### 5. Verification

Consumers must be able to answer:

- who published this artifact
- what changed
- whether it is signed
- what evals it passed
- whether it was approved for this environment

### 6. Promotion

The same artifact should move cleanly through:

- personal development
- shared staging
- production deployment
- internal mirrors
- regulated environments

### 7. Discovery and installation

Artifacts must be easy to search, install, update, and roll back.

## The Future Possibilities

If stax succeeds, it can unlock a much larger ecosystem than the current spec surface.

### Portable agent marketplaces

An ecosystem where agents are published once and consumed across many runtimes.

### Enterprise private registries

Internal catalogs of approved agents, packages, skills, and source snapshots with strict signing and policy gates.

### Agent promotion pipelines

Teams can move an agent from draft to approved to production by attaching evals, approvals, and signatures instead of rebuilding it.

### Policy-driven installation

A company can say:

- only install signed artifacts
- only allow packages from approved namespaces
- only allow MCP servers from audited publishers
- only allow artifacts that passed required evaluations

### Cross-runtime portability

A team can ship one logical agent to:

- local IDE environments
- cloud workspaces
- hosted agent platforms
- sandboxed enterprise environments

### Reusable agent package ecosystems

Communities can publish:

- compliance packs
- support-agent packs
- coding-agent packs
- industry-specific knowledge packs
- approved tool bundles

### Distribution for remote and autonomous agents

Long-running or autonomous agents should still be distributed as stax artifacts even when they are executed elsewhere.

stax should be the thing you point your hosting system at:

- "run this agent artifact"
- "pin to this digest"
- "promote this version"
- "attach this workspace source"
- "admit only if these attestations exist"

### Rich supply-chain tooling

Because stax uses OCI-style distribution, it can support:

- signatures
- provenance
- attestations
- mirrors
- air-gapped sync
- policy admission
- digest pinning
- rollback by artifact selection

### Ecosystem bridges

stax can become the neutral format behind import/export bridges for:

- agent registries
- runtime-specific project formats
- MCP ecosystems
- cloud provider agent products
- future open standards

## Where the Product Should Go

The best product strategy is not "write many specs."
It is to make stax the most reliable way to package and distribute agents in practice.

That requires a product stack around the spec.

## Product Surfaces

### 1. Core spec

The canonical model for artifacts, layers, packages, adapters, profiles, sources, and referrers.

This must stay rigorous, minimal, and boring in the best way.

### 2. Reference CLI

The CLI is the adoption engine.

It should become the trusted tool for:

- init
- build
- validate
- diff
- inspect
- materialize
- push
- pull
- verify
- copy
- sign
- install

If the CLI is weak, the standard will not matter.

### 3. Reference registry conventions

stax should define discoverability and registry behavior clearly enough that public and private registries can interoperate.

That includes:

- naming
- metadata
- package listing
- search
- compatibility metadata
- download/install flows
- referrer discovery

### 4. Trust and policy layer

This is one of the strongest future wedges.

stax should become the standard way to answer:

- is this artifact trusted
- is it approved for this environment
- what policies apply
- what evaluations were attached
- who published it

### 5. Runtime adapters

Adapters remain essential because a standard without runtime installation paths stays theoretical.

stax should support:

- exact adapters where runtimes have stable file contracts
- translated adapters where runtimes need structural mapping
- generic adapters for cloud and hosted systems

### 6. Discovery and install experience

Users should not need to think in terms of raw OCI.

They should be able to:

- search for an agent
- inspect provenance
- preview install impact
- install to a runtime
- update or roll back safely

### 7. Enterprise distribution product

This can be a separate commercial layer on top of the standard:

- internal registries
- policy enforcement
- approval workflows
- package mirrors
- usage reporting
- promotion pipelines

## How to Build It the Best Way

### Principle 1: Keep the scope hard

Do not let stax absorb runtime execution semantics.

The standard stays valuable only if:

- local tools can consume it
- cloud systems can consume it
- enterprises can govern it
- future runtimes can adopt it without inheriting one execution model

### Principle 2: Win the artifact first

Before expanding, make the artifact story excellent:

- deterministic builds
- exact digests
- strong validation
- clean package resolution
- stable merge rules
- trustworthy materialization

### Principle 3: Make installation real

A standard is not real until users can install artifacts into working environments in minutes.

The best proof of value is:

- build an artifact
- push it
- materialize it correctly
- verify it
- roll it back

### Principle 4: Invest in trust early

Distribution standards become strategic when they can enforce trust boundaries.

This means first-class support for:

- signing
- provenance
- evaluation referrers
- approvals
- policy-aware installation

### Principle 5: Design for remote agents without owning execution

For cloud and long-running agents, stax should define how agents are distributed into those systems, not how those systems execute them.

A hosted platform should be able to say:

- import this stax artifact
- resolve these packages
- attach this source
- apply this runtime profile
- verify these attestations

The platform remains responsible for lifecycle and execution.

### Principle 6: Prefer composition over monoliths

The future stack should be composable:

- stax core artifact
- stax registry conventions
- stax policy and attestation conventions
- stax adapters
- third-party execution systems

### Principle 7: Be neutral but opinionated

stax should be neutral about runtime choice, but opinionated about artifact quality:

- reproducibility
- explicit boundaries
- deterministic packaging
- supply-chain integrity
- no secret embedding
- no undocumented mutation

## Suggested Roadmap

### Phase 1: Core credibility

Goal: make the artifact model undeniable.

Ship:

- agent, package, source, and profile artifacts
- deterministic builders
- lockfile
- diff and inspect
- exact Claude Code, Codex, and OpenClaw adapters
- strong validation and error reporting

Success signal:

- teams can replace ad hoc runtime config with stax artifacts

### Phase 2: Distribution UX

Goal: make publishing and installation feel easy.

Ship:

- install command
- search and discovery conventions
- package metadata improvements
- compatibility metadata
- import/export bridges for adjacent ecosystems

Success signal:

- people use stax as the default way to publish and consume reusable agent packages

### Phase 3: Trust and enterprise policy

Goal: make stax viable for real organizational deployment.

Ship:

- signing and verification defaults
- attestation conventions
- approval workflows
- evaluation attachment and gating
- namespace and publisher policy

Success signal:

- enterprises can approve and promote agents by artifact digest

### Phase 4: Cloud distribution integrations

Goal: make stax the default package handed to remote systems.

Ship:

- generic cloud/hosted adapter guidance
- source/profile attachment workflows
- registry mirroring and promotion flows
- environment compatibility declarations

Success signal:

- remote platforms accept stax artifacts as deployment inputs

### Phase 5: Ecosystem standardization

Goal: move from product to category infrastructure.

Ship:

- conformance suites
- multiple independent implementations
- registry interoperability
- stable import/export bridges
- formal standardization process

Success signal:

- stax is treated as a neutral ecosystem layer rather than one vendor's project

## Key Strategic Decisions

### 1. OCI should remain the transport substrate

This is the right choice because it gives:

- existing registries
- existing distribution patterns
- existing mirroring models
- content addressing
- referrers
- enterprise familiarity

Users should not need to understand OCI deeply, but stax benefits from building on it.

### 2. Runtime-specific exactness is a feature, not a compromise

Portability does not mean flattening every runtime into the lowest common denominator.

stax should preserve high-fidelity mappings where possible and expose lossy translations clearly where not.

### 3. Registry and discovery matter almost as much as the artifact format

If users cannot find, inspect, trust, and install stax artifacts easily, another thinner standard with better packaging UX can win adoption.

### 4. The package ecosystem is a major wedge

Reusable packages may drive adoption faster than full agent artifacts.

A team may adopt stax first for:

- standards packs
- MCP bundles
- skill packs
- knowledge packs

and only later standardize full agent distribution.

### 5. Cloud agent distribution should be a first-class narrative

stax should explicitly state that remote and autonomous agents are in scope as **distribution targets**, even though their lifecycle is managed elsewhere.

## What Success Looks Like

stax wins if, in a few years, the common language of the ecosystem looks like this:

- "Publish the agent as a stax artifact."
- "Pin the source snapshot by digest."
- "Install the approved package set."
- "Attach the latest evaluation referrer."
- "Promote the same artifact from staging to production."
- "Mirror the registry internally."
- "Roll back to the last approved digest."

That is the right level of ambition.

## Non-Goals to Defend Relentlessly

The following should remain outside stax unless there is a very strong reason otherwise:

- runtime execution APIs
- scheduling semantics
- queue and event contracts
- agent loop behavior
- checkpoint execution semantics
- orchestration topologies
- inter-agent messaging protocols
- billing and usage metering
- observability data models
- secret backend integrations

Other products can standardize those layers.
stax should remain the distribution foundation they build on.

## Final Position

stax should aim to be the universal distribution substrate for agents.

Not a coding-agent niche tool.
Not a runtime.
Not an orchestrator.

The artifact standard.
The package format.
The promotion unit.
The trust boundary.
The install surface.
The thing every agent platform can consume.

That is the highest-value version of stax, and the current architecture is a strong start if the project stays disciplined about the boundary.
