import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

interface AuthFileShape {
  [registry: string]: {
    auth?: string;
  };
}

export async function getRegistryAuthorizationHeader(
  registry: string,
): Promise<string | undefined> {
  const authFile = join(homedir(), ".stax", "auth.json");

  let parsed: AuthFileShape;
  try {
    parsed = JSON.parse(await readFile(authFile, "utf-8")) as AuthFileShape;
  } catch {
    return undefined;
  }

  const token = parsed[registry]?.auth;
  if (!token) return undefined;
  return `Basic ${token}`;
}
