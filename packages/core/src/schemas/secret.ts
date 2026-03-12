import { z } from "zod";

export const secretSchema = z.object({
  key: z.string().min(1),
  required: z.boolean(),
  description: z.string().optional(),
  kind: z
    .enum(["api-key", "token", "password", "certificate", "connection-string", "url", "opaque"])
    .optional(),
  exposeAs: z
    .object({
      env: z.string().optional(),
      file: z.string().optional(),
    })
    .optional(),
});
