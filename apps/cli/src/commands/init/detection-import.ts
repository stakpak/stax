import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import type { DetectionResult, DetectedFile } from "@stax/core";

const SETTINGS_WHITELIST = ["permissions", "env"] as const;

export function importDetectedFiles(detected: DetectionResult, targetDir: string): string[] {
  const imported: string[] = [];
  const importedKinds = new Set<string>();
  const sorted = [...detected.files].sort((a, b) => {
    if (a.scope === "project" && b.scope === "user") return -1;
    if (a.scope === "user" && b.scope === "project") return 1;
    return 0;
  });

  for (const file of sorted) {
    try {
      const label = file.scope === "user" ? "global " : "";
      const src = basename(file.path);

      if (file.kind === "prompt") {
        if (importedKinds.has("prompt")) continue;
        const content = readFileSync(file.path, "utf-8");
        writeFileSync(join(targetDir, "SYSTEM_PROMPT.md"), content);
        imported.push(`SYSTEM_PROMPT.md (from ${label}${src})`);
        importedKinds.add("prompt");
        continue;
      }

      if (file.kind === "rules") {
        importRulesOrFile(file.path, join(targetDir, "rules"), label, src, imported);
        continue;
      }

      if (file.kind === "mcp") {
        if (importedKinds.has("mcp")) continue;
        const content = readFileSync(file.path, "utf-8");
        writeFileSync(join(targetDir, "mcp.json"), content);
        imported.push(`mcp.json (from ${label}${src})`);
        importedKinds.add("mcp");
        continue;
      }

      if (file.kind === "skills") {
        importSkillsDir(file.path, join(targetDir, "skills"), label, src, imported);
        continue;
      }

      if (file.kind === "config") {
        importConfigSafe(file, targetDir, importedKinds, imported);
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return imported;
}

function importRulesOrFile(
  sourcePath: string,
  rulesDir: string,
  label: string,
  src: string,
  imported: string[],
): void {
  mkdirSync(rulesDir, { recursive: true });

  try {
    const entries = readdirSync(sourcePath);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(sourcePath, entry);
      try {
        const content = readFileSync(entryPath, "utf-8");
        writeFileSync(join(rulesDir, entry), content);
      } catch {
        // skip non-readable entries
      }
    }
    imported.push(`rules/ (from ${label}${src}/)`);
  } catch {
    const content = readFileSync(sourcePath, "utf-8");
    writeFileSync(join(rulesDir, "imported-rules.md"), content);
    imported.push(`rules/imported-rules.md (from ${label}${src})`);
  }
}

function importSkillsDir(
  sourcePath: string,
  skillsDir: string,
  label: string,
  src: string,
  imported: string[],
): void {
  mkdirSync(skillsDir, { recursive: true });

  try {
    const entries = readdirSync(sourcePath);
    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(sourcePath, entry);
      try {
        const content = readFileSync(entryPath, "utf-8");
        writeFileSync(join(skillsDir, entry), content);
      } catch {
        try {
          const subDir = join(skillsDir, entry);
          mkdirSync(subDir, { recursive: true });
          copyDirShallow(entryPath, subDir);
        } catch {
          // skip unreadable directories
        }
      }
    }
    imported.push(`skills/ (from ${label}${src}/)`);
  } catch {
    // ignore non-directory
  }
}

function copyDirShallow(src: string, dest: string): void {
  for (const entry of readdirSync(src)) {
    if (entry.startsWith(".")) continue;
    try {
      const content = readFileSync(join(src, entry), "utf-8");
      writeFileSync(join(dest, entry), content);
    } catch {
      // skip non-readable / subdirs
    }
  }
}

function importConfigSafe(
  file: DetectedFile,
  targetDir: string,
  importedKinds: Set<string>,
  imported: string[],
): void {
  const label = file.scope === "user" ? "global " : "";
  const src = basename(file.path);
  const raw = readFileSync(file.path, "utf-8");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  if (!importedKinds.has("mcp") && parsed.mcpServers && typeof parsed.mcpServers === "object") {
    writeFileSync(
      join(targetDir, "mcp.json"),
      JSON.stringify({ mcpServers: parsed.mcpServers }, null, 2),
    );
    imported.push(`mcp.json (extracted from ${label}${src})`);
    importedKinds.add("mcp");
  }

  if (!src.includes("settings")) return;

  const safe: Record<string, unknown> = {};
  for (const key of SETTINGS_WHITELIST) {
    if (parsed[key] !== undefined) {
      safe[key] = parsed[key];
    }
  }

  if (Object.keys(safe).length === 0) return;

  const name = file.scope === "user" ? "global-settings.json" : "project-settings.json";
  const kindKey = `settings-${file.scope}`;
  if (importedKinds.has(kindKey)) return;

  writeFileSync(join(targetDir, name), JSON.stringify(safe, null, 2));
  imported.push(`${name} (extracted from ${label}${src})`);
  importedKinds.add(kindKey);
}

export function formatDetectionSummary(detected: DetectionResult): string {
  const local = detected.files.filter((file) => file.scope === "project");
  const global = detected.files.filter((file) => file.scope === "user");
  const lines: string[] = [];

  if (local.length > 0) {
    lines.push("Local (project):");
    for (const file of local) {
      lines.push(`  ${file.targetPath} — ${file.description}`);
    }
  }

  if (global.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Global (user):");
    for (const file of global) {
      lines.push(`  ${file.targetPath} — ${file.description}`);
    }
  }

  return lines.join("\n");
}

export function ensureRuleAndSkillDirs(targetDir: string, created: string[]): void {
  for (const dir of ["rules", "skills"]) {
    const dirPath = join(targetDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      writeFileSync(join(dirPath, ".gitkeep"), "");
    }
    if (!created.some((entry) => entry.startsWith(`${dir}/`) || entry.startsWith(`${dir} `))) {
      created.push(`${dir}/`);
    }
  }
}
