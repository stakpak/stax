import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // Build CLAUDE.md following spec composition order:
  // 1. surfaces/instructions.md, 2. prompt, 3. persona summary,
  // 4. rules, 5. surfaces/tools.md, 6. surfaces/identity.md,
  // 7. surfaces/user.md, 8. surfaces/heartbeat.md
  let claudeMd = "";

  // Surface lookup helper
  const surfaceMap = new Map<string, string>();
  if (context.surfaces) {
    for (const surface of context.surfaces as { name: string; content: string }[]) {
      // Normalize surface name: "instructions.md" → "instructions", "persona.md" → "persona"
      const name = surface.name.replace(/\.md$/, "").replace(/^.*\//, "");
      surfaceMap.set(name, surface.content);
    }
  }

  // 1. surfaces/instructions.md (primary source for instructions)
  const instructionsSurface = surfaceMap.get("instructions");
  if (instructionsSurface) {
    claudeMd += instructionsSurface;
  }

  // 2. prompt
  if (context.prompt) {
    if (claudeMd) claudeMd += "\n\n";
    claudeMd += context.prompt;
  }

  // 3. rendered persona summary
  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
    };
    if (claudeMd) claudeMd += "\n\n";
    claudeMd += `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}`;
  }

  // 4. canonical rules translated to Markdown
  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id?: string; content: string }[])
      .map((r) => `## Rule: ${r.id ?? "unnamed"}\n\n${r.content}`)
      .join("\n\n");
    claudeMd += "\n\n" + rulesSection;
  }

  // 5-8. Named surfaces
  const namedSurfaces = ["tools", "identity", "user", "heartbeat"] as const;
  for (const surfaceName of namedSurfaces) {
    const content = surfaceMap.get(surfaceName);
    if (content) {
      claudeMd += `\n\n## ${surfaceName.charAt(0).toUpperCase() + surfaceName.slice(1)}\n\n${content}`;
    }
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

  // .claude/settings.json - populate from adapter config
  const adapterConfig = (context as unknown as Record<string, unknown>).adapterConfig as
    | Record<string, unknown>
    | undefined;
  const settings: Record<string, unknown> = {};
  if (adapterConfig?.permissions) {
    const perms = adapterConfig.permissions as { allowedTools?: string[]; denyRules?: string[] };
    if (perms.allowedTools) settings.allowedTools = perms.allowedTools;
    if (perms.denyRules) settings.denyRules = perms.denyRules;
  }
  if (adapterConfig?.settings) {
    Object.assign(settings, adapterConfig.settings);
  }
  files.set(".claude/settings.json", JSON.stringify(settings, null, 2));

  // Skills — preserve directory structure
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
