import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const isAmplifyBuild = Boolean(
  process.env.AWS_BRANCH || process.env.AWS_APP_ID || process.env.AMPLIFY_MONOREPO_APP_ROOT,
);

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    mdx(await import("./source.config")),
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      prerender: {
        enabled: false,
      },
    }),
    react(),
    nitro({
      preset: isAmplifyBuild ? "aws-amplify" : "node-server",
    }),
  ],
});
