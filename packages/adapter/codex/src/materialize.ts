import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md — spec composition order:
  // 1. surfaces/instructions.md, 2. prompt, 3. persona, 4. rules
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

  // 4. rules
  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id?: string; content: string }[])
      .map((r) => `## Rule: ${r.id ?? "unnamed"}\n\n${r.content}`)
      .join("\n\n");
    agentsMd += "\n\n" + rulesSection;
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // .codex/config.toml — correct table name is [mcp_servers.<name>]
  let toml = "";
  const adapterConfig = (context as unknown as Record<string, unknown>).adapterConfig as
    | Record<string, unknown>
    | undefined;

  // Model
  if (adapterConfig?.model) {
    toml += `model = "${adapterConfig.model}"\n`;
  }
  // Approval policy
  if (adapterConfig?.approval) {
    toml += `approval_policy = "${adapterConfig.approval}"\n`;
  }
  // Sandbox mode
  if (adapterConfig?.sandbox) {
    toml += `sandbox_mode = "${adapterConfig.sandbox}"\n`;
  }
  // Login shell
  if (adapterConfig?.allowLoginShell !== undefined) {
    toml += `allow_login_shell = ${adapterConfig.allowLoginShell}\n`;
  }

  // MCP servers
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        toml += `\n[mcp_servers.${name}]\n`;
        toml += `command = "${server.command}"\n`;
        if (server.args) {
          const args = (server.args as string[]).map((a) => `"${a}"`).join(", ");
          toml += `args = [${args}]\n`;
        }
        if (server.env) {
          toml += `\n[mcp_servers.${name}.env]\n`;
          for (const [k, v] of Object.entries(server.env as Record<string, string>)) {
            toml += `${k} = "${v}"\n`;
          }
        }
      } else if ("url" in server) {
        toml += `\n[mcp_servers.${name}]\n`;
        toml += `url = "${server.url}"\n`;
        toml += `transport = "${server.transport}"\n`;
      }
    }
  }

  files.set(".codex/config.toml", toml);

  // Skills — preserve directory structure: .agents/skills/<name>/SKILL.md
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.agents/skills/${skill.name}/SKILL.md`, skill.content);
    }
  }

  return { files, warnings };
}
