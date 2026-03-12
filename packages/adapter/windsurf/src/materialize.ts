import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md from prompt + persona + MCP (embedded)
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

  // MCP is translated/embedded into AGENTS.md
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    agentsMd += "\n\n## MCP Servers\n\n";
    for (const [name, server] of Object.entries(mcp.servers)) {
      agentsMd += `### ${name}\n\n`;
      if ("command" in server) {
        agentsMd += `- Command: \`${server.command}\`\n`;
        if (server.args) {
          agentsMd += `- Args: ${(server.args as string[]).join(" ")}\n`;
        }
      } else if ("url" in server) {
        agentsMd += `- URL: ${server.url}\n`;
        agentsMd += `- Transport: ${server.transport}\n`;
      }
      agentsMd += "\n";
    }
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // Rules as .windsurf/rules/<id>.md
  if (context.rules) {
    for (const rule of context.rules as {
      id: string;
      scope: string;
      content: string;
    }[]) {
      files.set(`.windsurf/rules/${rule.id}.md`, rule.content);
    }
  }

  // Skills translated to .windsurf/workflows/<name>.md
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      description: string;
      content: string;
    }[]) {
      let content = `# ${skill.name}\n\n`;
      if (skill.description) {
        content += `${skill.description}\n\n`;
      }
      content += skill.content;
      files.set(`.windsurf/workflows/${skill.name}.md`, content);
    }
  }

  return { files, warnings };
}
