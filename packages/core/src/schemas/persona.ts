import { z } from "zod";
import { NAME_REGEX } from "../validation.ts";

export const personaSchema = z
  .object({
    specVersion: z.string().optional(),
    name: z.string().regex(NAME_REGEX, "Name must match ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"),
    displayName: z.string().min(1),
    role: z.string().min(1),
    background: z.string().optional(),
    expertise: z
      .object({
        primary: z.array(z.string()).optional(),
        secondary: z.array(z.string()).optional(),
        learning: z.array(z.string()).optional(),
      })
      .optional(),
    personality: z
      .object({
        traits: z.array(z.string()).optional(),
        communicationStyle: z
          .enum(["direct", "diplomatic", "academic", "casual", "formal"])
          .optional(),
        verbosity: z.enum(["minimal", "concise", "balanced", "detailed", "verbose"]).optional(),
      })
      .optional(),
    voice: z
      .object({
        tone: z.string().optional(),
        codeComments: z.enum(["none", "minimal", "moderate", "thorough"]).optional(),
        patterns: z.array(z.string()).optional(),
        avoid: z.array(z.string()).optional(),
      })
      .optional(),
    values: z.array(z.string()).optional(),
    preferences: z.record(z.string(), z.unknown()).optional(),
    boundaries: z
      .object({
        willNot: z.array(z.string()).optional(),
        always: z.array(z.string()).optional(),
        escalates: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .passthrough();
