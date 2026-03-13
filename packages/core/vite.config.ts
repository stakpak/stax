import { defineLibraryViteConfig } from "@stax/config/vite.lib";

export default defineLibraryViteConfig(import.meta.url, {
  external: ["zod"],
});
