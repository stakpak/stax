import type { MergeResult } from "./types.ts";

/**
 * Merge layers from resolved packages.
 * Higher priority wins on conflict (last declared = highest).
 */
export function mergeLayers(packages: unknown[]): MergeResult {
  if (packages.length === 0) {
    return { warnings: [] };
  }

  let mcp: { servers: Record<string, unknown> } | undefined;
  let skills: { name: string; [k: string]: unknown }[] | undefined;
  let rules: { id: string; [k: string]: unknown }[] | undefined;
  let knowledge: { path: string; [k: string]: unknown }[] | undefined;
  let surfaces: { name: string; [k: string]: unknown }[] | undefined;
  let secrets: { key: string; [k: string]: unknown }[] | undefined;
  const warnings: string[] = [];

  for (const pkg of packages) {
    const p = pkg as Record<string, unknown>;

    // MCP: merge by server name, higher priority replaces
    if (p.mcp) {
      const incomingMcp = p.mcp as { servers: Record<string, unknown> };
      if (!mcp) {
        mcp = { servers: { ...incomingMcp.servers } };
      } else {
        for (const [name, server] of Object.entries(incomingMcp.servers)) {
          mcp.servers[name] = server;
        }
      }
    }

    // Skills: merge by name, higher priority replaces
    if (p.skills) {
      const incoming = p.skills as { name: string }[];
      if (!skills) {
        skills = [...incoming];
      } else {
        for (const skill of incoming) {
          const idx = skills.findIndex((s) => s.name === skill.name);
          if (idx !== -1) {
            skills[idx] = skill;
          } else {
            skills.push(skill);
          }
        }
      }
    }

    // Rules: merge by id, higher priority replaces
    if (p.rules) {
      const incoming = p.rules as { id: string }[];
      if (!rules) {
        rules = [...incoming];
      } else {
        for (const rule of incoming) {
          const idx = rules.findIndex((r) => r.id === rule.id);
          if (idx !== -1) {
            rules[idx] = rule;
          } else {
            rules.push(rule);
          }
        }
      }
    }

    // Knowledge: merge by path
    if (p.knowledge) {
      const incoming = p.knowledge as { path: string }[];
      if (!knowledge) {
        knowledge = [...incoming];
      } else {
        for (const item of incoming) {
          const idx = knowledge.findIndex((k) => k.path === item.path);
          if (idx !== -1) {
            knowledge[idx] = item;
          } else {
            knowledge.push(item);
          }
        }
      }
    }

    // Surfaces: merge by name
    if (p.surfaces) {
      const incoming = p.surfaces as { name: string }[];
      if (!surfaces) {
        surfaces = [...incoming];
      } else {
        for (const item of incoming) {
          const idx = surfaces.findIndex((s) => s.name === item.name);
          if (idx !== -1) {
            surfaces[idx] = item;
          } else {
            surfaces.push(item);
          }
        }
      }
    }

    // Secrets: merge by key
    if (p.secrets) {
      const incoming = p.secrets as { key: string }[];
      if (!secrets) {
        secrets = [...incoming];
      } else {
        for (const item of incoming) {
          const idx = secrets.findIndex((s) => s.key === item.key);
          if (idx !== -1) {
            secrets[idx] = item;
          } else {
            secrets.push(item);
          }
        }
      }
    }
  }

  return {
    ...(mcp !== undefined && { mcp }),
    ...(skills !== undefined && { skills }),
    ...(rules !== undefined && { rules }),
    ...(knowledge !== undefined && { knowledge }),
    ...(surfaces !== undefined && { surfaces }),
    ...(secrets !== undefined && { secrets }),
    warnings,
  };
}
