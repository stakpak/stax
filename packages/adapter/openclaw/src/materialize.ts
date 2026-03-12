import type { MaterializeContext, MaterializeResult } from "@stax/adapter-core";

const SURFACE_FILE_MAP: Record<string, string> = {
  tools: "TOOLS.md",
  identity: "IDENTITY.md",
  user: "USER.md",
  heartbeat: "HEARTBEAT.md",
  bootstrap: "BOOTSTRAP.md",
};

export async function materialize(context: MaterializeContext): Promise<MaterializeResult> {
  const files = new Map<string, string | Uint8Array>();
  const warnings: string[] = [];

  // AGENTS.md from prompt + rules
  let agentsMd = "";

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

  // SOUL.md from persona (native)
  if (context.persona) {
    const p = context.persona as {
      name: string;
      displayName?: string;
      role: string;
      background?: string;
    };
    let soul = `# ${p.displayName ?? p.name}\n\n**Role:** ${p.role}`;
    if (p.background) {
      soul += `\n\n${p.background}`;
    }
    files.set("SOUL.md", soul);
  }

  // Surfaces — native support for dedicated files
  if (context.surfaces) {
    for (const surface of context.surfaces as unknown[]) {
      // Handle array-of-{name, content} format
      if (
        typeof surface === "object" &&
        surface !== null &&
        "name" in surface &&
        "content" in surface
      ) {
        const s = surface as { name: string; content: string };
        const fileName = SURFACE_FILE_MAP[s.name];
        if (fileName) {
          files.set(fileName, s.content);
        }
      }
      // Handle SurfaceDefinition object format
      else if (typeof surface === "object" && surface !== null) {
        const def = surface as Record<string, string | undefined>;
        for (const [key, fileName] of Object.entries(SURFACE_FILE_MAP)) {
          if (def[key]) {
            files.set(fileName, def[key]!);
          }
        }
      }
    }
  }

  // Skills — native
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`skills/${skill.name}.md`, skill.content);
    }
  }

  // Memory — native
  if (context.memory) {
    for (const mem of context.memory as {
      path: string;
      content: Uint8Array;
    }[]) {
      files.set(`memory/${mem.path}`, mem.content);
    }
  }

  // MCP — unsupported
  if (context.mcp) {
    warnings.push("OpenClaw does not support MCP servers; mcp configuration was ignored.");
  }

  return { files, warnings };
}
