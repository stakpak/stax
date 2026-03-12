import { z } from "zod";

const nameRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const packageSchema = z
  .object({
    specVersion: z.string().optional(),
    name: z.string().regex(nameRegex, "Name must match ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"),
    version: z.string().regex(semverRegex, "Must be valid semver"),
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
