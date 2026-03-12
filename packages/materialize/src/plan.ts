import type { InstallPlan } from "./types.ts";

export async function planInstall(_reference: string, _adapter: string): Promise<InstallPlan> {
  throw new Error("Not implemented");
}
