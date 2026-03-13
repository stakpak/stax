import * as p from "@clack/prompts";

export { p as clack };

export function intro(msg: string): void {
  p.intro(msg);
}

export function outro(msg: string): void {
  p.outro(msg);
}

export function cancel(msg: string): void {
  p.cancel(msg);
}

export function isCancel(value: unknown): value is symbol {
  return p.isCancel(value);
}

export async function promptText(opts: {
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
}): Promise<string | symbol> {
  return p.text({
    message: opts.message,
    placeholder: opts.placeholder ?? opts.defaultValue,
    defaultValue: opts.defaultValue,
    validate: opts.validate,
  });
}

export async function promptSelect<
  T extends { value: string; label: string; hint?: string },
>(opts: { message: string; options: T[]; initialValue?: string }): Promise<string | symbol> {
  return p.select({
    message: opts.message,
    options: opts.options,
    initialValue: opts.initialValue,
  });
}

export async function promptConfirm(opts: {
  message: string;
  initialValue?: boolean;
}): Promise<boolean | symbol> {
  return p.confirm({
    message: opts.message,
    initialValue: opts.initialValue ?? true,
  });
}

export function spinner(): ReturnType<typeof p.spinner> {
  return p.spinner();
}

export function note(message: string, title?: string): void {
  p.note(message, title);
}
