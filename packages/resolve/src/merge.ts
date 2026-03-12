import type { MergeResult } from "./types.ts";

/**
 * Merge layers from resolved packages.
 * Higher priority wins on conflict (last declared = highest).
 * Rules are sorted after merge per spec: precedence → priority → archive path.
 */
export function mergeLayers(packages: unknown[]): MergeResult {
  if (packages.length === 0) {
    return { warnings: [] };
  }

  let mcp: { servers: Record<string, unknown> } | undefined;
  let skills: { name: string; [k: string]: unknown }[] | undefined;
  let rules:
    | { id?: string; priority?: number; archivePath?: string; [k: string]: unknown }[]
    | undefined;
  let knowledge: { path: string; [k: string]: unknown }[] | undefined;
  let surfaces: { name: string; [k: string]: unknown }[] | undefined;
  let secrets: { key: string; [k: string]: unknown }[] | undefined;
  const warnings: string[] = [];

  for (let pkgIdx = 0; pkgIdx < packages.length; pkgIdx++) {
    const p = packages[pkgIdx] as Record<string, unknown>;
    // Track precedence level for rules ordering
    const precedenceLevel = pkgIdx;

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

    // Rules: merge by id (or archive path), higher priority replaces
    if (p.rules) {
      const incoming = p.rules as { id?: string; archivePath?: string }[];
      if (!rules) {
        rules = incoming.map((r) => ({ ...r, _precedence: precedenceLevel }));
      } else {
        for (const rule of incoming) {
          const ruleKey = rule.id ?? rule.archivePath ?? "";
          const idx = rules.findIndex((r) => (r.id ?? r.archivePath ?? "") === ruleKey);
          if (idx !== -1) {
            rules[idx] = { ...rule, _precedence: precedenceLevel };
          } else {
            rules.push({ ...rule, _precedence: precedenceLevel });
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

  // Sort rules by: precedence (lowest first), priority (ascending), archive path (ascending)
  if (rules) {
    rules.sort((a, b) => {
      const precA = ((a as Record<string, unknown>)._precedence as number) ?? 0;
      const precB = ((b as Record<string, unknown>)._precedence as number) ?? 0;
      if (precA !== precB) return precA - precB;

      const prioA = a.priority ?? 0;
      const prioB = b.priority ?? 0;
      if (prioA !== prioB) return prioA - prioB;

      const pathA = a.archivePath ?? a.id ?? "";
      const pathB = b.archivePath ?? b.id ?? "";
      return pathA.localeCompare(pathB);
    });

    // Clean up internal _precedence field
    for (const rule of rules) {
      delete (rule as Record<string, unknown>)._precedence;
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
