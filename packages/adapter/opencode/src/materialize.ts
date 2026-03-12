import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md — spec composition order
  let agentsMd = "";

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
    agentsMd += instructionsSurface;
  }

  // 2. prompt
  if (context.prompt) {
    if (agentsMd) agentsMd += "\n\n";
    agentsMd += context.prompt;
  }

  // 3. persona
  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    if (agentsMd) agentsMd += "\n\n";
    agentsMd += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}`;
  }

  // 4. rules embedded in AGENTS.md
  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id?: string; content: string }[])
      .map((r) => `## Rule: ${r.id ?? "unnamed"}\n\n${r.content}`)
      .join("\n\n");
    agentsMd += "\n\n" + rulesSection;
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // opencode.jsonc — correct format per spec 36
  const config: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
  };

  const adapterConfig = (context as unknown as Record<string, unknown>).adapterConfig as
    | Record<string, unknown>
    | undefined;

  // Model
  if (adapterConfig?.model) {
    config.model = adapterConfig.model;
  }

  // Agent config
  if (adapterConfig?.agent) {
    config.agent = adapterConfig.agent;
  }

  // Permission
  if (adapterConfig?.permission) {
    config.permission = adapterConfig.permission;
  }

  // MCP — correct format: type "local", command as string array, environment (not env)
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    const mcpConfig: Record<string, Record<string, unknown>> = {};
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        const command = [server.command as string, ...((server.args as string[]) ?? [])];
        mcpConfig[name] = {
          type: "local",
          command,
          ...(server.env ? { environment: server.env } : {}),
        };
      } else if ("url" in server) {
        mcpConfig[name] = {
          type: "remote",
          url: server.url,
          ...(server.headers ? { headers: server.headers } : {}),
        };
      }
    }
    config.mcp = mcpConfig;
  }

  files.set("opencode.jsonc", JSON.stringify(config, null, 2));

  // Skills — preserve directory structure: .opencode/skill/<name>/SKILL.md
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      description?: string;
      content: string;
    }[]) {
      files.set(`.opencode/skill/${skill.name}/SKILL.md`, skill.content);

      // Also emit as command if skill has description
      if (skill.description) {
        let commandContent = "---\n";
        commandContent += `description: "${skill.description}"\n`;
        commandContent += "---\n\n";
        commandContent += skill.content;
        files.set(`.opencode/command/${skill.name}.md`, commandContent);
      }
    }
  }

  // Subagents → .opencode/agent/<name>.md
  if (context.subagents) {
    for (const agent of context.subagents as {
      name: string;
      description: string;
      instructions: string;
      model?: string;
    }[]) {
      let agentContent = "---\n";
      if (agent.model) {
        agentContent += `model: ${agent.model}\n`;
      }
      agentContent += `description: "${agent.description}"\n`;
      agentContent += "---\n\n";
      agentContent += agent.instructions;
      files.set(`.opencode/agent/${agent.name}.md`, agentContent);
    }
  }

  return { files, warnings };
}
