# 09 — Knowledge

## Overview

Knowledge is static reference material that an agent can consult: documentation, API specs, architecture notes, code examples, diagrams, or policy documents.

stax packages knowledge as a deterministic tarball preserving directory structure.

## Directory structure

```text
knowledge/
├── api-docs/
│   ├── rest-api.md
│   └── graphql-schema.graphql
├── architecture/
│   ├── system-overview.md
│   └── diagrams/
│       └── data-flow.mermaid
├── guides/
│   ├── onboarding.md
│   └── deployment.md
├── reference/
│   ├── glossary.md
│   └── error-codes.md
└── knowledge.manifest.json
```

## Supported formats

Any file type MAY be included.

Common text formats:

- Markdown
- Plain text
- JSON / YAML
- GraphQL
- Mermaid
- Source code files

Binary files such as images and PDFs MAY be included, but builders SHOULD warn when large binary payloads make the knowledge layer difficult to distribute or index.

## Optional `knowledge.manifest.json`

A knowledge directory MAY include a root file named `knowledge.manifest.json` with metadata that helps consumers index or present files.

Example:

```json
{
  "specVersion": "1.0.0",
  "files": {
    "api-docs/rest-api.md": {
      "title": "REST API",
      "tags": ["api", "rest"],
      "source": "https://docs.example.com/rest-api",
      "chunkHint": "section"
    },
    "architecture/system-overview.md": {
      "title": "System Overview",
      "tags": ["architecture"],
      "source": "git://repo/docs/system-overview.md"
    }
  }
}
```

### Manifest rules

- Paths MUST be relative to the `knowledge/` root
- Paths MUST use `/` as the separator, MUST NOT begin with `/` or `./`, and MUST NOT contain `..` segments
- Unknown metadata keys MAY be included
- Consumers MAY ignore unknown metadata keys
- The manifest MUST NOT reference files outside the layer
- Builders MUST validate that every path in the `files` object corresponds to a file that exists in the `knowledge/` directory at build time. If a referenced file does not exist, the builder MUST fail with a validation error listing the missing paths
- Consumers encountering a manifest entry for a file not present in the archive MUST ignore the entry and SHOULD warn

## Referencing knowledge in an agent

```typescript
export default defineAgent({
  name: 'backend-engineer',
  knowledge: './knowledge/'
});
```

## OCI layer

Knowledge is packaged as `application/vnd.stax.knowledge.v1.tar+gzip`.

Builders SHOULD annotate the layer with `dev.stax.knowledge.files`.

## Safety rules

- Builders MUST warn when the uncompressed knowledge layer exceeds 100 MB
- Builders MUST warn when any single file exceeds 10 MB
- `knowledge.manifest.json` MUST NOT reference files outside the `knowledge/` directory (paths with `..` or absolute paths MUST be rejected)
- If `knowledge.manifest.json` references a file that does not exist in the archive, builders SHOULD warn; consumers MUST ignore the missing entry

## Consumer behavior

Consumers MAY:

- index files for search or retrieval
- embed files into a vector store
- mount files directly into a filesystem
- surface files in a UI browser

stax does not require any specific retrieval strategy.

Consumers SHOULD retain source attribution when available from `knowledge.manifest.json`.
