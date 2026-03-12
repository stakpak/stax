import { join } from "node:path";

const CLI_ENTRY = join(import.meta.dir, "..", "index.ts");

/**
 * Run the CLI with the given arguments and return stdout, stderr, and exit code.
 */
export async function run(
  args: string[],
  options?: { stdin?: string; cwd?: string },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", CLI_ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    stdin: options?.stdin ? "pipe" : undefined,
    cwd: options?.cwd,
  });

  if (options?.stdin && proc.stdin) {
    proc.stdin.write(new TextEncoder().encode(options.stdin));
    proc.stdin.end();
  }

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}
