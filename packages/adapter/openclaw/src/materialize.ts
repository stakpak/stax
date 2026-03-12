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

  // Surface lookup — handles both {name, content} array format and SurfaceDefinition object format
  const surfaceMap = new Map<string, string>();
  if (context.surfaces) {
    for (const surface of context.surfaces as unknown[]) {
      if (typeof surface === "object" && surface !== null) {
        if ("name" in surface && "content" in surface) {
          // Array-of-{name, content} format
          const s = surface as { name: string; content: string };
          const name = s.name.replace(/\.md$/, "").replace(/^.*\//, "");
          surfaceMap.set(name, s.content);
        } else {
          // SurfaceDefinition object format: { instructions?, persona?, tools?, ... }
          const def = surface as Record<string, string | undefined>;
          for (const [key, value] of Object.entries(def)) {
            if (value) {
              surfaceMap.set(key, value);
            }
          }
        }
      }
    }
  }

  // AGENTS.md — primary source is surfaces/instructions.md, then prompt + rules
  let agentsMd = "";

  const instructionsSurface = surfaceMap.get("instructions");
  if (instructionsSurface) {
    agentsMd += instructionsSurface;
  }

  if (context.prompt) {
    if (agentsMd) agentsMd += "\n\n";
    agentsMd += context.prompt;
  }

  if (context.rules && (context.rules as unknown[]).length > 0) {
    const rulesSection = (context.rules as { id?: string; content: string }[])
      .map((r) => `## Rule: ${r.id ?? "unnamed"}\n\n${r.content}`)
      .join("\n\n");
    agentsMd += "\n\n" + rulesSection;
  }

  if (agentsMd) {
    files.set("AGENTS.md", agentsMd);
  }

  // SOUL.md from persona (native) or surfaces/persona.md
  const personaSurface = surfaceMap.get("persona");
  if (personaSurface) {
    files.set("SOUL.md", personaSurface);
  } else if (context.persona) {
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

  // Named surfaces — native, byte-exact from surface files
  for (const [surfaceName, fileName] of Object.entries(SURFACE_FILE_MAP)) {
    const content = surfaceMap.get(surfaceName);
    if (content) {
      files.set(fileName, content);
    }
  }

  // Skills — preserve directory structure: skills/<name>/SKILL.md
  if (context.skills) {
    for (const skill of context.skills as {
      name: string;
      content: string;
    }[]) {
      files.set(`skills/${skill.name}/SKILL.md`, skill.content);
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
