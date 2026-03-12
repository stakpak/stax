import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md from prompt + persona + rules (embedded)
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

  // Rules are embedded into AGENTS.md
  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id: string; content: string }[])
      .map((r) => `## Rule: ${r.id}\n\n${r.content}`)
      .join("\n\n");
    agentsMd += "\n\n" + rulesSection;
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // opencode.jsonc
  const config: Record<string, unknown> = {};
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    const servers: Record<string, Record<string, unknown>> = {};
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        servers[name] = {
          command: server.command,
          args: (server.args as string[]) ?? [],
          env: (server.env as Record<string, string>) ?? {},
        };
      } else if ("url" in server) {
        servers[name] = {
          url: server.url,
          transport: server.transport,
        };
      }
    }
    config.mcp = { servers };
  }
  files.set("opencode.jsonc", JSON.stringify(config, null, 2));

  // Skills
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.opencode/skill/${skill.name}.md`, skill.content);
    }
  }

  return { files, warnings };
}
