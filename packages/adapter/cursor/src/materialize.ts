import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md from prompt + persona
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

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // Rules as .cursor/rules/<id>.mdc with frontmatter
  if (context.rules) {
    for (const rule of context.rules as {
      id: string;
      scope: string;
      globs?: string[];
      description?: string;
      content: string;
    }[]) {
      let frontmatter = "---\n";
      if (rule.description) {
        frontmatter += `description: ${rule.description}\n`;
      }
      if (rule.globs && rule.globs.length > 0) {
        frontmatter += `globs: ${rule.globs.join(", ")}\n`;
      }
      if (rule.scope === "always") {
        frontmatter += `alwaysApply: true\n`;
      } else {
        frontmatter += `alwaysApply: false\n`;
      }
      frontmatter += "---\n\n";
      files.set(`.cursor/rules/${rule.id}.mdc`, frontmatter + rule.content);
    }
  }

  // .cursor/mcp.json
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
    files.set(".cursor/mcp.json", JSON.stringify({ mcpServers }, null, 2));
  }

  // Skills
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.cursor/skills/${skill.name}.md`, skill.content);
    }
  }

  return { files, warnings };
}
