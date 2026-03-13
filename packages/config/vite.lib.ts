import { fileURLToPath } from "node:url";
import type { ExternalOption } from "rollup";
import { defineConfig } from "vite";

function asExternalList(external?: ExternalOption): ExternalOption[] {
  if (external === undefined) return [];
  return Array.isArray(external) ? external : [external];
}

export function defineLibraryViteConfig(metaUrl: string, options?: { external?: ExternalOption }) {
  return defineConfig({
    build: {
      lib: {
        entry: fileURLToPath(new URL("./src/index.ts", metaUrl)),
        formats: ["es"],
        fileName: "index",
      },
      rollupOptions: {
        external: [/^@stax\//, /^node:/, ...asExternalList(options?.external)],
      },
    },
  });
}
