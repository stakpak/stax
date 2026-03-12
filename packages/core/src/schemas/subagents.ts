import { z } from "zod";

const nameRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const subagentDefinitionSchema = z
  .object({
    description: z.string().min(1),
    invocation: z.enum(["manual", "delegate", "automatic"]).optional(),
    instructions: z.string().min(1),
    model: z.string().optional(),
    tags: z.array(z.string()).optional(),
    handoff: z
      .object({
        allowedFrom: z.array(z.string()).optional(),
        returnMode: z.enum(["report", "patch", "continue"]).optional(),
      })
      .optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export const subagentsSchema = z.object({
  specVersion: z.string().optional(),
  agents: z
    .record(z.string(), subagentDefinitionSchema)
    .refine((agents) => Object.keys(agents).length > 0, { message: "Agents must not be empty" })
    .refine(
      (agents) => {
        for (const name of Object.keys(agents)) {
          if (!nameRegex.test(name)) return false;
        }
        return true;
      },
      { message: "Subagent names must match ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$" },
    ),
});
