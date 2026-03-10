# 04 — Persona

## Overview

A persona defines an agent's identity, expertise, voice, values, and behavioral boundaries. Persona is the primary replication mechanism in stax: the same agent with different persona layers becomes a new artifact that shares every other unchanged layer by digest.

Personas are authored in TypeScript using `definePersona()` and compiled to canonical JSON.

## definePersona()

```typescript
import { definePersona } from 'stax';

export default definePersona({
  name: 'maya-chen',
  displayName: 'Maya Chen',
  role: 'Senior Backend Engineer',

  background: '10 years building distributed systems at scale.',
  expertise: {
    primary: ['Go', 'distributed systems', 'PostgreSQL'],
    secondary: ['Kubernetes', 'Terraform'],
    learning: ['Rust'],
  },

  personality: {
    traits: ['pragmatic', 'thorough', 'mentoring'],
    communicationStyle: 'direct',
    verbosity: 'concise',
  },

  voice: {
    tone: 'Professional but warm. Uses concrete examples.',
    codeComments: 'minimal',
    patterns: [
      'Starts with positives before suggestions',
      'Uses "we" when proposing improvements',
    ],
    avoid: ['Overly academic language', 'Unnecessary hedging'],
  },

  values: [
    'Correctness over speed',
    'Explicit over implicit',
    'Simplicity over cleverness',
  ],

  preferences: {
    testing: 'Table-driven tests, no mocks unless necessary.',
    errorHandling: 'Explicit error returns, no panic.',
  },

  boundaries: {
    willNot: ['Write code without tests', 'Skip error handling'],
    always: ['Consider backwards compatibility', 'Document breaking changes'],
    escalates: ['Security-sensitive changes', 'Database migrations'],
  },
});
```

## Type definition

```typescript
interface PersonaDefinition {
  specVersion?: '1.0.0';

  name: string;
  displayName: string;
  role: string;
  background?: string;
  expertise?: {
    primary?: string[];
    secondary?: string[];
    learning?: string[];
  };

  personality?: {
    traits?: string[];
    communicationStyle?: 'direct' | 'diplomatic' | 'academic' | 'casual' | 'formal';
    verbosity?: 'minimal' | 'concise' | 'balanced' | 'detailed' | 'verbose';
  };

  voice?: {
    tone?: string;
    codeComments?: 'none' | 'minimal' | 'moderate' | 'thorough';
    patterns?: string[];
    avoid?: string[];
  };

  values?: string[];
  preferences?: Record<string, unknown>;
  boundaries?: {
    willNot?: string[];
    always?: string[];
    escalates?: string[];
  };
}
```

## Validation

- `name` MUST match the same identifier rules as agent names
- `displayName` and `role` MUST be non-empty strings
- Arrays SHOULD contain unique strings
- Unknown fields MAY be preserved by builders but consumers MAY ignore them

## Persona discovery

Builders support three persona modes:

```bash
stax build                    # build default persona.ts if present
stax build --persona maya-chen
stax build --all-personas     # build every personas/*.ts except files starting with _
```

Discovery rules:

- Files in `personas/` whose basename starts with `_` MUST be ignored for standalone builds
- `_`-prefixed files MAY be imported for inheritance or composition
- The build identity for a persona variant is the persona `name`, not the file name

## Storage efficiency

All persona variants SHOULD share every unchanged layer.

```text
backend-engineer:3.1.0-maya-chen     persona sha256:111
backend-engineer:3.1.0-alex-rivera   persona sha256:222
                                     all other layer digests identical
```

## Inheritance

Persona inheritance is an authoring pattern, not a wire-format feature.

```typescript
import base from './_base.ts';

export default definePersona({
  ...base,
  name: 'maya-chen',
  displayName: 'Maya Chen',
  role: 'Senior Backend Engineer',
  expertise: { primary: ['Go', 'distributed systems'] },
});
```

## Prompt templating

Prompts MAY reference persona fields using `{{ ... }}` expressions.

Example:

```markdown
You are {{persona.displayName}}, a {{persona.role}}.
{{persona.background}}
```

### Template rules

- Only `persona` is in scope in spec `1.0.0`
- Expressions MUST use dotted paths such as `persona.role`
- Missing values MUST resolve to an empty string unless a consumer provides strict mode
- Consumers MUST NOT execute arbitrary code in templates
- Consumers SHOULD HTML-escape or otherwise sanitize only when required by their target runtime; plain-text Markdown materialization SHOULD insert raw string values

### Supported grammar

```text
{{persona.name}}
{{persona.displayName}}
{{persona.expertise.primary}}
```

Array values SHOULD be rendered as comma-separated lists unless a consumer exposes a richer formatting mode.

## Layer mapping

| Persona field group | Conceptual purpose |
|---------------------|-------------------|
| `name`, `displayName`, `role`, `background`, `expertise` | Identity |
| `personality`, `voice`, `values`, `preferences`, `boundaries` | Behavioral philosophy |

Capabilities such as MCP, skills, rules, and knowledge remain separate agent layers.
