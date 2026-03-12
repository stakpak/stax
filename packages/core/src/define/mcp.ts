import type { McpConfig } from "../types.ts";

export function defineMcp(config: McpConfig): McpConfig {
  if (!config.servers || Object.keys(config.servers).length === 0) {
    throw new Error("MCP servers must not be empty");
  }

  for (const [name, server] of Object.entries(config.servers)) {
    if (server.enabledTools && server.disabledTools) {
      const enabled = new Set(server.enabledTools);
      for (const tool of server.disabledTools) {
        if (enabled.has(tool)) {
          throw new Error(`Server "${name}": enabledTools and disabledTools overlap on "${tool}"`);
        }
      }
    }
  }

  return {
    ...config,
    specVersion: config.specVersion ?? "1.0.0",
  };
}
