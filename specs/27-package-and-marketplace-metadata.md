# 27 — Package and Marketplace Metadata

> Draft design document. This is forward-looking and not part of stax `1.0.0` conformance.

## Overview

If stax is going to support open ecosystems, private catalogs, and marketplaces, artifact metadata must be richer than basic identity fields.

This document defines the future package and marketplace metadata layer.

## Design goals

Metadata SHOULD:

1. make packages discoverable
2. support marketplace browsing and enterprise cataloging
3. expose trust and compatibility summaries
4. remain descriptive rather than execution-defining

## Non-goals

This document does not define:

- runtime behavior
- pricing and billing models
- execution-time SLAs

## Metadata layers

Marketplace metadata SHOULD be split conceptually into:

1. **Artifact metadata**
   Portable metadata published with or derived from the artifact.
2. **Registry metadata**
   Discovery metadata maintained by a registry or catalog.
3. **Marketplace presentation metadata**
   Rich assets and summaries optimized for browsing.

## Proposed metadata fields

Artifacts and packages SHOULD eventually support:

- summary
- long description
- homepage
- documentation
- repository
- issue tracker
- icon
- screenshots
- categories
- maintainers
- publisher verification status
- changelog URL
- support policy

## Package categories

Suggested initial categories:

- agent
- package
- skills
- rules
- knowledge
- compliance
- customer-support
- engineering
- finance
- legal

Registries MAY expose additional marketplace-specific categories.

## Maintainer metadata

Registries SHOULD be able to show:

- maintainer name
- maintainer organization
- contact URL or email
- verified publisher linkage

## Marketplace summaries

Marketplaces SHOULD expose concise summaries for:

- supported runtimes
- trust state
- required secrets
- package dependencies
- source requirements

These summaries SHOULD be derivable from compatibility and trust metadata where possible.

## Presentation metadata

Marketplaces MAY additionally display:

- icon
- screenshots
- quick-start examples
- changelog links
- support tier

Presentation metadata SHOULD NOT be required for core discovery or install flows.

## Enterprise catalog extensions

Private registries MAY add:

- internal owner
- business unit
- data sensitivity classification
- approved environments
- internal support tier

## Relationship to discovery

This document complements [23 — Registry, Discovery, and Install](./23-registry-discovery-install.md).

Discovery records answer:

- what this package is
- where it lives
- which digest and versions exist

Marketplace metadata answers:

- how it should be presented and understood by humans

## Open design questions

1. which fields belong in the artifact itself versus registry metadata
2. whether images and rich assets should be stored inside OCI or referenced externally
3. how to keep marketplace metadata portable across registries
