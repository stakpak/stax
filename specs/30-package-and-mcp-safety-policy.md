# 30 — Package and MCP Safety Policy

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

Distribution at scale requires policy around reusable packages and external tool connectivity.

MCP servers, package dependencies, and skill packs are high-leverage distribution primitives, but they also create supply-chain and safety risk.

This document defines the future package and MCP safety policy model.

## Design goals

Safety policy SHOULD:

1. make package and MCP risk visible before install
2. allow enterprise allowlists and deny lists
3. avoid embedding secrets or execution semantics into the distribution layer
4. support public ecosystems without assuming trust

## Non-goals

This document does not define:

- runtime sandbox enforcement
- secret backend integrations
- network transport enforcement after launch

## Policy surfaces

Consumers SHOULD be able to evaluate:

- package namespace
- publisher identity
- MCP server command or URL
- declared secret keys
- required capabilities
- package dependency graph

## Package policy

Package admission policy SHOULD be able to evaluate:

- direct package references
- transitive package references
- package namespaces
- package publishers
- package signatures
- package lifecycle state
- dependency depth

### Suggested package policy controls

Consumers SHOULD support:

- allowed namespaces
- blocked namespaces
- required signatures for shared packages
- maximum dependency depth
- transitive dependency review
- allowed publishers
- blocked lifecycle states

### Package decision rules

- a blocked namespace MUST fail admission
- an untrusted publisher MAY fail or warn depending on policy mode
- a transitive dependency that violates policy MUST fail the overall package graph unless explicitly overridden

## MCP policy

MCP admission policy SHOULD evaluate each server independently and as part of the overall artifact graph.

Consumers SHOULD support policy over:

- server name
- transport
- command
- args
- URL
- declared secret keys
- enabled tools and disabled tools

### Suggested MCP policy controls

Consumers SHOULD support:

- allowed MCP publishers
- allowed command prefixes
- blocked command prefixes
- allowed URL domains
- blocked URL domains
- forbidden transports
- required secret declarations
- blocked server names

### MCP decision rules

- a forbidden transport MUST fail admission
- a blocked command prefix MUST fail admission
- a blocked URL domain MUST fail admission
- a missing required secret declaration MUST fail admission

Policies MAY distinguish between:

- `warn-only`
- `require`

## Command prefix policy

For stdio MCP servers, policy SHOULD evaluate:

- `command`
- optionally the joined `command + args` prefix

Consumers SHOULD match prefixes literally after argument tokenization rather than by shell parsing.

Example:

- allow `npx @modelcontextprotocol/`
- block `curl`
- block `bash`

Consumers MUST NOT interpret shell expansions when evaluating MCP policy.

## URL policy

For remote MCP servers, policy SHOULD evaluate:

- scheme
- host
- port when present
- path prefix when policy requires it

Example rules:

- allow `https://mcp.acme.internal/*`
- block `http://*`
- block `*.example.net`

## Risk summaries

Discovery metadata SHOULD summarize:

- number of MCP servers
- presence of remote MCP URLs
- presence of stdio commands
- secret count
- package dependency count

Install plans SHOULD surface:

- matched allow/deny rules
- warnings
- blocked dependencies or servers

## Safety result

A consumer or policy engine SHOULD be able to emit a result equivalent to:

```json
{
  "result": "passed",
  "packages": {
    "direct": 2,
    "transitive": 4,
    "blocked": []
  },
  "mcp": {
    "servers": 3,
    "blocked": [],
    "warnings": [
      "remote MCP URL uses external domain"
    ]
  }
}
```

### Result values

Consumers SHOULD support:

- `passed`
- `failed`
- `warning`

## Relationship to trust policy

This document complements [24 — Trust, Policy, and Attestations](./24-trust-policy-attestations.md).

Trust policy answers:

- who signed this
- what approvals and attestations exist

Package and MCP safety policy answers:

- should these dependencies and external tool endpoints be allowed at all

Both SHOULD be evaluated before install or import.

## Open design questions

1. whether MCP risk metadata should be stored in artifact annotations
2. whether package safety summaries should be standardized as install-plan output
3. how to express allowed command-prefix policy portably across operating systems
