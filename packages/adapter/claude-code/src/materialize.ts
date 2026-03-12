import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // Build CLAUDE.md from prompt + persona + rules
  let claudeMd = "";

  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    claudeMd += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}\n\n`;
  }

  if (context.prompt) {
    claudeMd += context.prompt;
  }

  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id: string; content: string }[])
      .map((r) => `## Rule: ${r.id}\n\n${r.content}`)
      .join("\n\n");
    claudeMd += "\n\n" + rulesSection;
  }

  if (claudeMd) {
    files.set("CLAUDE.md", claudeMd);
  }

  // .mcp.json
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    const mcpServers: Record<string, Record<string, unknown>> = {};
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        mcpServers[name] = {
          command: server.command,
          args: (server.args as string[]) ?? [],
          env: (server.env as Record<string, string>) ?? {},
        };
      } else if ("url" in server) {
        mcpServers[name] = {
          url: server.url,
          transport: server.transport,
        };
      }
    }
    files.set(".mcp.json", JSON.stringify({ mcpServers }, null, 2));
  }

  // .claude/settings.json
  files.set(".claude/settings.json", JSON.stringify({}, null, 2));

  // Skills
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.claude/skills/${skill.name}/SKILL.md`, skill.content);
    }
  }

  // Subagents
  if (context.subagents) {
    for (const agent of context.subagents as {
      name: string;
      description: string;
      instructions: string;
    }[]) {
      files.set(
        `.claude/agents/${agent.name}.md`,
        `# ${agent.name}\n\n${agent.description}\n\n${agent.instructions}`,
      );
    }
  }

  return { files, warnings };
}
