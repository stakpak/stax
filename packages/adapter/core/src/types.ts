import type { AdapterConfig, AdapterFeatureMap, MaterializationTarget } from "@stax/core";

export interface Adapter {
  /** Adapter type identifier */
  type: string;
  /** Runtime family */
  runtime: string;
  /** Schema version */
  adapterVersion: string;

  /** Build an AdapterConfig from user options */
  createConfig(options: Record<string, unknown>): AdapterConfig;

  /** Materialize canonical layers into runtime-native files */
  materialize(context: MaterializeContext): Promise<MaterializeResult>;

  /** Get the capabilities of this adapter */
  capabilities(): AdapterCapabilities;
}

export interface AdapterFactory {
  (options?: Record<string, unknown>): AdapterConfig;
}

export interface MaterializeContext {
  outDir: string;
  prompt?: string;
  persona?: unknown;
  mcp?: unknown;
  skills?: unknown[];
  rules?: unknown[];
  knowledge?: unknown[];
  surfaces?: unknown[];
  subagents?: unknown[];
  secrets?: unknown[];
  memory?: unknown[];
  instructionTree?: unknown[];
  adapterType?: string;
  adapterConfig?: Record<string, unknown>;
}

export interface MaterializeResult {
  files: Map<string, string | Uint8Array>;
  warnings: string[];
}

export interface AdapterCapabilities {
  features: AdapterFeatureMap;
  targets: MaterializationTarget[];
}
