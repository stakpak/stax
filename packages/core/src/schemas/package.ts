import { z } from "zod";
import { NAME_REGEX, SEMVER_REGEX } from "../validation.ts";

export const packageSchema = z
  .object({
    specVersion: z.string().optional(),
    name: z.string().regex(NAME_REGEX, "Name must match ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"),
    version: z.string().regex(SEMVER_REGEX, "Must be valid semver"),
    description: z.string().min(1),
    author: z.string().optional(),
    license: z.string().optional(),
    tags: z
      .array(z.string())
      .refine((tags) => new Set(tags).size === tags.length, { message: "Tags must be unique" })
      .optional(),
    mcp: z.string().optional(),
    skills: z.string().optional(),
    rules: z.string().optional(),
    knowledge: z.string().optional(),
    surfaces: z.string().optional(),
    secrets: z.string().optional(),
    packages: z.array(z.string()).optional(),
  })
  .passthrough();
