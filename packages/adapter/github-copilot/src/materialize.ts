import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // Build instruction content — spec composition order
  let instructions = "";

  // Surface lookup
  const surfaceMap = new Map<string, string>();
  if (context.surfaces) {
    for (const surface of context.surfaces as { name: string; content: string }[]) {
      const name = surface.name.replace(/\.md$/, "").replace(/^.*\//, "");
      surfaceMap.set(name, surface.content);
    }
  }

  // 1. surfaces/instructions.md
  const instructionsSurface = surfaceMap.get("instructions");
  if (instructionsSurface) {
    instructions += instructionsSurface;
  }

  // 2. prompt
  if (context.prompt) {
    if (instructions) instructions += "\n\n";
    instructions += context.prompt;
  }

  // 3. persona
  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    if (instructions) instructions += "\n\n";
    instructions += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}`;
  }

  if (instructions) {
    files.set(".github/copilot-instructions.md", instructions);
  }

  // AGENTS.md — only write if option is not explicitly false
  const adapterConfig = (context as unknown as Record<string, unknown>).adapterConfig as
    | Record<string, unknown>
    | undefined;
  const writeAgentsMd = adapterConfig?.writeAgentsMd !== false;
  if (instructions && writeAgentsMd) {
    files.set("AGENTS.md", instructions);
  }

  // Rules as .github/instructions/<id>.instructions.md
  if (context.rules) {
    for (const rule of context.rules as {
      id?: string;
      scope: string;
      globs?: string[];
      content: string;
      description?: string;
    }[]) {
      const ruleId = rule.id ?? "unnamed";
      let content = "";
      if (rule.globs && rule.globs.length > 0) {
        content += `---\napplyTo:\n`;
        for (const glob of rule.globs) {
          content += `  - "${glob}"\n`;
        }
        content += `---\n\n`;
      }
      content += rule.content;
      files.set(`.github/instructions/${ruleId}.instructions.md`, content);
    }
  }

  // .vscode/mcp.json — VS Code format uses "servers" key with explicit type
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    const servers: Record<string, Record<string, unknown>> = {};
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        servers[name] = {
          type: "stdio",
          command: server.command,
          args: (server.args as string[]) ?? [],
          env: (server.env as Record<string, string>) ?? {},
        };
      } else if ("url" in server) {
        servers[name] = {
          type: server.transport as string,
          url: server.url,
        };
      }
    }
    files.set(".vscode/mcp.json", JSON.stringify({ servers }, null, 2));
  }

  // Skills
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.github/skills/${skill.name}/SKILL.md`, skill.content);
    }
  }

  // Subagents → .github/agents/<name>.agent.md
  if (context.subagents) {
    for (const agent of context.subagents as {
      name: string;
      description: string;
      instructions: string;
      model?: string;
    }[]) {
      let agentContent = `---\ndescription: "${agent.description}"\n`;
      if (agent.model) {
        agentContent += `model: ${agent.model}\n`;
      }
      agentContent += `---\n\n`;
      agentContent += agent.instructions;
      files.set(`.github/agents/${agent.name}.agent.md`, agentContent);
    }
  }

  // Instruction tree → .github/instructions/ scoped files
  if (context.instructionTree) {
    for (const node of context.instructionTree as { path: string; instructions: string }[]) {
      const filePath =
        node.path === "_root"
          ? ".github/copilot-instructions.md"
          : `.github/instructions/${node.path}.instructions.md`;
      // Don't overwrite root instructions if already set
      if (node.path !== "_root" || !files.has(".github/copilot-instructions.md")) {
        files.set(filePath, node.instructions);
      }
    }
  }

  return { files, warnings };
}
