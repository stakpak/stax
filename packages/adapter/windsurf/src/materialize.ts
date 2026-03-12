import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

const CHAR_LIMIT = 12000;

const SCOPE_TO_TRIGGER: Record<string, string> = {
  always: "always_on",
  auto: "model_decision",
  glob: "glob",
  manual: "manual",
};

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

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // MCP — user-scoped only: ~/.codeium/windsurf/mcp_config.json
  if (context.mcp) {
    const mcp = context.mcp as { servers: Record<string, Record<string, unknown>> };
    const mcpServers: Record<string, Record<string, unknown>> = {};
    for (const [name, server] of Object.entries(mcp.servers)) {
      if ("command" in server) {
        mcpServers[name] = {
          command: server.command,
          args: (server.args as string[]) ?? [],
          ...(server.env ? { env: server.env } : {}),
        };
      } else if ("url" in server) {
        const transport = server.transport as string;
        if (transport === "http") {
          mcpServers[name] = {
            serverUrl: server.url,
            ...(server.headers ? { headers: server.headers } : {}),
          };
        } else {
          mcpServers[name] = {
            url: server.url,
            ...(server.headers ? { headers: server.headers } : {}),
          };
        }
      }
    }
    files.set("~/.codeium/windsurf/mcp_config.json", JSON.stringify({ mcpServers }, null, 2));
    warnings.push(
      "Windsurf MCP config is user-scoped only (~/.codeium/windsurf/mcp_config.json); it is not project-portable",
    );
  }

  // Rules as .windsurf/rules/<id>.md with trigger frontmatter
  if (context.rules) {
    for (const rule of context.rules as {
      id?: string;
      scope: string;
      globs?: string[];
      description?: string;
      priority?: number;
      severity?: string;
      triggers?: string[];
      content: string;
    }[]) {
      const ruleId = rule.id ?? "unnamed";
      const trigger = SCOPE_TO_TRIGGER[rule.scope] ?? "always_on";

      let frontmatter = "---\n";
      frontmatter += `trigger: ${trigger}\n`;

      if (trigger === "model_decision" && rule.description) {
        frontmatter += `description: "${rule.description}"\n`;
      }

      if (rule.globs && rule.globs.length > 0) {
        frontmatter += `globs:\n`;
        for (const glob of rule.globs) {
          frontmatter += `  - "${glob}"\n`;
        }
      }
      frontmatter += "---\n\n";

      const ruleContent = frontmatter + rule.content;

      // Character limit warning
      if (ruleContent.length > CHAR_LIMIT) {
        warnings.push(
          `Rule "${ruleId}" exceeds Windsurf's ${CHAR_LIMIT} character limit (${ruleContent.length} chars)`,
        );
      }

      // Lossy translations warning
      if (rule.priority !== undefined) {
        warnings.push(`Rule "${ruleId}": "priority" has no Windsurf equivalent and was dropped`);
      }
      if (rule.severity) {
        warnings.push(`Rule "${ruleId}": "severity" has no Windsurf equivalent and was dropped`);
      }

      files.set(`.windsurf/rules/${ruleId}.md`, ruleContent);
    }
  }

  // Skills translated to .windsurf/workflows/<name>.md
  if (context.skills) {
    warnings.push(
      "Skills translated to Windsurf workflows are manual-only and may lose auto-invocation semantics",
    );
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

      if (content.length > CHAR_LIMIT) {
        warnings.push(
          `Workflow "${skill.name}" exceeds Windsurf's ${CHAR_LIMIT} character limit (${content.length} chars)`,
        );
      }

      files.set(`.windsurf/workflows/${skill.name}.md`, content);
    }
  }

  return { files, warnings };
}
