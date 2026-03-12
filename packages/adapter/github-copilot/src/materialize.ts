import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // Build instruction content from prompt + persona
  let instructions = "";

  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    instructions += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}\n\n`;
  }

  if (context.prompt) {
    instructions += context.prompt;
  }

  if (instructions) {
    files.set(".github/copilot-instructions.md", instructions);
    files.set("AGENTS.md", instructions);
  }

  // Rules as .github/instructions/<id>.instructions.md
  if (context.rules) {
    for (const rule of context.rules as {
      id: string;
      scope: string;
      globs?: string[];
      content: string;
      description?: string;
    }[]) {
      let content = "";
      if (rule.globs && rule.globs.length > 0) {
        content += `---\napplyTo: "${rule.globs.join(", ")}"\n---\n\n`;
      }
      content += rule.content;
      files.set(`.github/instructions/${rule.id}.instructions.md`, content);
    }
  }

  // .vscode/mcp.json — VS Code format uses "servers" key
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
      files.set(`.github/skills/${skill.name}.md`, skill.content);
    }
  }

  return { files, warnings };
}
