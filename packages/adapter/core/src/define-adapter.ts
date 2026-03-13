import { SEMVER_REGEX } from "@stax/core";
import type { Adapter } from "./types.ts";

export function defineAdapter(adapter: Adapter): Adapter {
  if (!adapter.type || adapter.type.length === 0) {
    throw new Error("Adapter type is required");
  }
  if (!adapter.runtime || adapter.runtime.length === 0) {
    throw new Error("Adapter runtime is required");
  }
  if (!adapter.adapterVersion || !SEMVER_REGEX.test(adapter.adapterVersion)) {
    throw new Error(`Invalid adapterVersion: "${adapter.adapterVersion}". Must be valid semver`);
  }
  return adapter;
}
