function adapterImport(adapter: string): { pkg: string; fn: string } {
  const map: Record<string, { pkg: string; fn: string }> = {
    "claude-code": { pkg: "@stax/claude-code", fn: "claudeCode" },
    codex: { pkg: "@stax/codex", fn: "codex" },
    cursor: { pkg: "@stax/cursor", fn: "cursor" },
    "github-copilot": { pkg: "@stax/github-copilot", fn: "githubCopilot" },
    openclaw: { pkg: "@stax/openclaw", fn: "openclaw" },
    opencode: { pkg: "@stax/opencode", fn: "opencode" },
    windsurf: { pkg: "@stax/windsurf", fn: "windsurf" },
  };

  return map[adapter] ?? { pkg: `@stax/${adapter}`, fn: adapter };
}

export function generateAgentTs(opts: {
  name: string;
  version: string;
  description: string;
  adapter: string;
}): string {
  const imp = adapterImport(opts.adapter);
  return `import { defineAgent } from "stax";
import ${imp.fn} from "${imp.pkg}";

export default defineAgent({
  name: "${opts.name}",
  version: "${opts.version}",
  description: "${opts.description}",

  adapter: ${imp.fn}(),

  prompt: "./SYSTEM_PROMPT.md",
  rules: "./rules/",
  skills: "./skills/",
});
`;
}

export function generatePackageTs(opts: {
  name: string;
  version: string;
  description: string;
}): string {
  return `import { definePackage } from "stax";

export default definePackage({
  name: "${opts.name}",
  version: "${opts.version}",
  description: "${opts.description}",

  rules: "./rules/",
  skills: "./skills/",
});
`;
}

export function generateSystemPrompt(name: string, description: string): string {
  return `# ${name}

${description}

## Instructions

You are a helpful assistant. Follow the rules and use the skills provided.
`;
}
