export type FlagValue = boolean | string | string[];
export type ParsedFlags = Record<string, FlagValue | undefined>;

export interface ParsedArgs {
  flags: ParsedFlags;
  positionals: string[];
}

export interface CommandResult {
  code: number;
  stdout?: string;
  stderr?: string;
}

export interface CommandModule {
  name: string;
  summary: string;
  usage: string;
  booleanFlags?: readonly string[];
  valueFlags?: readonly string[];
  repeatableValueFlags?: readonly string[];
  run(args: string[]): CommandResult | Promise<CommandResult>;
}
