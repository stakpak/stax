import path from "node:path";
import type { InstallPlan, InstallAction, RenderedMaterialization } from "./types.ts";
import { renderMaterialization } from "./render.ts";

export async function planInstall(
  reference: string,
  adapter: string,
  options?: { outDir?: string; exact?: boolean },
): Promise<InstallPlan> {
  const rendered = await renderMaterialization({
    source: reference,
    outDir: options?.outDir ?? process.cwd(),
    adapter,
    exact: options?.exact,
  });

  return generatePlan(rendered);
}

function collectDirectories(files: RenderedMaterialization["files"]): string[] {
  const dirs = new Set<string>();

  for (const file of files) {
    let current = path.posix.dirname(file.path.replace(/^~\//, ""));
    while (current !== "." && current !== "/" && current.length > 0) {
      const dirPath = current.endsWith("/") ? current : `${current}/`;
      dirs.add(dirPath);
      current = path.posix.dirname(current);
    }
  }

  return [...dirs].sort();
}

function generatePlan(rendered: RenderedMaterialization): InstallPlan {
  const actions: InstallAction[] = [];

  for (const dirPath of collectDirectories(rendered.files)) {
    actions.push({
      kind: "mkdir",
      path: dirPath,
      description: `Create directory ${dirPath}`,
    });
  }

  for (const file of rendered.files) {
    actions.push({
      kind: "write",
      path: file.path,
      description: `Write ${file.path}`,
      content: typeof file.content === "string" ? file.content : undefined,
    });
  }

  return {
    selectedAdapter: rendered.adapter.type,
    fidelity: rendered.fidelity,
    lossy: rendered.lossy,
    actions,
    warnings: rendered.warnings,
  };
}
