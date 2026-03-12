# 11 — Secrets

## Overview

Secrets in stax are **declarations only**. The artifact says what secret keys the agent needs, not where values come from.

Secret values, providers, rotation, and access control remain the consumer's responsibility.

## Declaring secrets

### In agents and packages

```typescript
secrets: [
  {
    key: "ANTHROPIC_API_KEY",
    required: true,
    description: "API key for Claude",
    kind: "api-key",
    exposeAs: { env: "ANTHROPIC_API_KEY" },
  },
  {
    key: "GITHUB_TOKEN",
    required: true,
    description: "GitHub personal access token",
    kind: "token",
  },
  {
    key: "TLS_CERT",
    required: false,
    description: "Optional client certificate",
    kind: "certificate",
    exposeAs: { file: "/run/secrets/tls.crt" },
  },
];
```

## Type definition

```typescript
interface SecretDeclaration {
  key: string;
  required: boolean;
  description?: string;
  kind?: "api-key" | "token" | "password" | "certificate" | "connection-string" | "url" | "opaque";
  exposeAs?: {
    env?: string;
    file?: string;
  };
}
```

### Field semantics

- `key` is the logical secret identifier used throughout the artifact
- `required` says whether the agent can function without the secret
- `kind` is descriptive only and MAY be used for validation or UX
- `exposeAs` is a consumer hint, not an enforcement mechanism

## MCP references

MCP definitions reference secrets by `key` only.

Every referenced key MUST exist in the merged secret declarations after package resolution.

## OCI layer

Secrets metadata is stored as `application/vnd.stax.secrets.v1+json`.

Example:

```json
{
  "specVersion": "1.0.0",
  "secrets": [
    {
      "key": "ANTHROPIC_API_KEY",
      "required": true,
      "description": "API key for Claude",
      "kind": "api-key",
      "exposeAs": { "env": "ANTHROPIC_API_KEY" }
    }
  ]
}
```

## What is explicitly not stored

Artifacts MUST NOT contain:

- secret values
- vault provider config
- IAM bindings
- rotation policies
- secret access logs

## Merge behavior

Secrets merge by `key` using replace semantics.

Higher precedence replaces the full declaration.

## Consumer responsibilities

Consumers MUST:

1. resolve secret values before launch
2. validate that all `required: true` secrets are available
3. inject secrets using a runtime-appropriate mechanism
4. fail clearly when required secrets are missing
5. avoid leaking secret values into logs, artifacts, or memory snapshots

## Secret redaction

Builders and consumers MUST follow these redaction rules:

- Error messages, warnings, and diagnostics MUST NOT include secret values
- Error messages MAY include secret key names (e.g., "missing required secret: GITHUB_TOKEN")
- Debug logs, if supported, MUST redact any resolved secret values before output
- Build logs MUST NOT echo secret values even when verbose mode is enabled
- If a consumer detects a secret value in a generated file (prompt, memory, surface), it SHOULD warn and MAY refuse to write the file
