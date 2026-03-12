import { z } from "zod";

const mcpServerBaseSchema = z
  .object({
    description: z.string().optional(),
    secrets: z.array(z.string()).optional(),
    enabledTools: z.array(z.string()).optional(),
    disabledTools: z.array(z.string()).optional(),
    enabled: z.boolean().optional(),
    connectTimeoutMs: z.number().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    registryRef: z
      .object({
        registry: z.string().optional(),
        package: z.string(),
        version: z.string().optional(),
        digest: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

const mcpStdioServerSchema = mcpServerBaseSchema.extend({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  cwd: z.string().optional(),
});

const mcpHttpServerSchema = mcpServerBaseSchema.extend({
  url: z.string(),
  transport: z.enum(["http", "sse"]),
  headers: z.record(z.string(), z.string()).optional(),
});

const mcpServerSchema = z.union([mcpStdioServerSchema, mcpHttpServerSchema]);

export const mcpSchema = z
  .object({
    specVersion: z.string().optional(),
    servers: z
      .record(z.string(), mcpServerSchema)
      .refine((servers) => Object.keys(servers).length > 0, {
        message: "Servers must not be empty",
      }),
  })
  .refine(
    (config) => {
      for (const server of Object.values(config.servers)) {
        const s = server as Record<string, unknown>;
        if (s.enabledTools && s.disabledTools) {
          const enabled = new Set(s.enabledTools as string[]);
          for (const tool of s.disabledTools as string[]) {
            if (enabled.has(tool)) return false;
          }
        }
      }
      return true;
    },
    { message: "enabledTools and disabledTools must not overlap" },
  );
