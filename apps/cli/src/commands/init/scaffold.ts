import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { DetectionResult } from "@stax/core";

import { ensureRuleAndSkillDirs, importDetectedFiles } from "./detection-import.ts";
import { generateAgentTs, generatePackageTs, generateSystemPrompt } from "./templates.ts";

export function scaffoldFiles(
  cwd: string,
  kind: "agent" | "package",
  opts: {
    name: string;
    version: string;
    description: string;
    adapter?: string;
    detected?: DetectionResult;
  },
): string[] {
  const targetDir = join(cwd, ".stax", opts.name);
  mkdirSync(targetDir, { recursive: true });

  const created: string[] = [];
  let importedPrompt = false;

  if (opts.detected?.found) {
    const imported = importDetectedFiles(opts.detected, targetDir);
    for (const entry of imported) {
      created.push(entry);
      if (entry.startsWith("SYSTEM_PROMPT.md")) {
        importedPrompt = true;
      }
    }
  }

  if (kind === "agent") {
    writeFileSync(
      join(targetDir, "agent.ts"),
      generateAgentTs({
        name: opts.name,
        version: opts.version,
        description: opts.description,
        adapter: opts.adapter!,
      }),
    );
    created.push("agent.ts");

    if (!importedPrompt) {
      writeFileSync(
        join(targetDir, "SYSTEM_PROMPT.md"),
        generateSystemPrompt(opts.name, opts.description),
      );
      created.push("SYSTEM_PROMPT.md");
    }
  } else {
    writeFileSync(join(targetDir, "package.ts"), generatePackageTs(opts));
    created.push("package.ts");
  }

  ensureRuleAndSkillDirs(targetDir, created);

  const rootIgnore = join(cwd, ".staxignore");
  if (!existsSync(rootIgnore)) {
    writeFileSync(rootIgnore, "node_modules\n.stax/artifacts\n.stax/cache\ndist\n*.log\n");
    created.push(".staxignore (project root)");
  }

  return created;
}
