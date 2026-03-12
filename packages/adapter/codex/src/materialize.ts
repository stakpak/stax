import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md from prompt + persona + rules
  let agentsMd = "";

  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    agentsMd += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}\n\n`;
  }

  if (context.prompt) {
    agentsMd += context.prompt;
  }

  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id: string; content: string }[])
      .map((r) => `## Rule: ${r.id}\n\n${r.content}`)
      .join("\n\n");
    agentsMd += "\n\n" + rulesSection;
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // .codex/config.toml
  let toml = "";
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        toml += `[mcp.servers.${name}]\n`;
        toml += `command = "${server.command}"\n`;
        if (server.args) {
          const args = (server.args as string[]).map((a) => `"${a}"`).join(", ");
          toml += `args = [${args}]\n`;
        }
        if (server.env) {
          toml += "\n";
          for (const [k, v] of Object.entries(server.env as Record<string, string>)) {
            toml += `[mcp.servers.${name}.env]\n`;
            toml += `${k} = "${v}"\n`;
          }
        }
        toml += "\n";
      } else if ("url" in server) {
        toml += `[mcp.servers.${name}]\n`;
        toml += `url = "${server.url}"\n`;
        toml += `transport = "${server.transport}"\n\n`;
      }
    }
  }
  files.set(".codex/config.toml", toml);

  // Skills
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.agents/skills/${skill.name}.md`, skill.content);
    }
  }

  return { files, warnings };
}
