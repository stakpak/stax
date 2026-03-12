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

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // Rules as .cursor/rules/<id>.mdc with frontmatter
  if (context.rules) {
    for (const rule of context.rules as {
      id?: string;
      scope: string;
      globs?: string[];
      description?: string;
      content: string;
    }[]) {
      const ruleId = rule.id ?? "unnamed";
      let frontmatter = "---\n";
      if (rule.description) {
        frontmatter += `description: ${rule.description}\n`;
      }
      // Globs as YAML array
      if (rule.globs && rule.globs.length > 0) {
        frontmatter += `globs:\n`;
        for (const glob of rule.globs) {
          frontmatter += `  - "${glob}"\n`;
        }
      }
      if (rule.scope === "always") {
        frontmatter += `alwaysApply: true\n`;
      } else if (rule.scope === "manual") {
        // Manual scope: no globs, no description needed, not auto-applied
        frontmatter += `alwaysApply: false\n`;
        if (!rule.description) {
          warnings.push(
            `Rule "${ruleId}" has scope "manual" but no description; Cursor may not display it correctly`,
          );
        }
      } else {
        frontmatter += `alwaysApply: false\n`;
      }
      frontmatter += "---\n\n";
      files.set(`.cursor/rules/${ruleId}.mdc`, frontmatter + rule.content);
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

  // Skills — preserve directory structure
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`.cursor/skills/${skill.name}/SKILL.md`, skill.content);
    }
  }

  return { files, warnings };
}
