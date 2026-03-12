import type {
  InstallPlan,
  InstallAction,
  MaterializationWarning,
  MaterializedAgent,
} from "./types.ts";
import { materialize } from "./materialize.ts";

export async function planInstall(
  reference: string,
  adapter: string,
  options?: { outDir?: string; exact?: boolean },
): Promise<InstallPlan> {
  // 1. Materialize internally
  const agent = await materialize({
    source: reference,
    outDir: options?.outDir ?? process.cwd(),
    adapter,
    exact: options?.exact,
  });

  // 2. Generate plan based on adapter type
  return generatePlan(agent, adapter);
}

function generatePlan(agent: MaterializedAgent, adapter: string): InstallPlan {
  switch (adapter) {
    case "claude-code":
      return planClaudeCode(agent);
    case "cursor":
      return planCursor(agent);
    default:
      return planGeneric(agent, adapter);
  }
}

// ─── Claude Code ───────────────────────────────────────

function planClaudeCode(agent: MaterializedAgent): InstallPlan {
  const actions: InstallAction[] = [];
  const warnings: MaterializationWarning[] = [...agent.warnings];

  // Main instructions file
  if (agent.prompt) {
    actions.push({
      kind: "write",
      path: "CLAUDE.md",
      description: "Write main instructions",
      content: agent.prompt,
    });
  }

  // MCP config
  if (agent.mcp) {
    actions.push({
      kind: "write",
      path: ".mcp.json",
      description: "Write MCP configuration",
      content: JSON.stringify({ mcpServers: agent.mcp.servers }, null, 2),
    });
  }

  // Skills
  if (agent.skills && agent.skills.length > 0) {
    actions.push({
      kind: "mkdir",
      path: ".claude/skills/",
      description: "Create skills directory",
    });

    for (const skill of agent.skills) {
      actions.push({
        kind: "write",
        path: `.claude/skills/${skill.name}/SKILL.md`,
        description: `Write skill: ${skill.name}`,
        content: skill.content,
      });
    }
  }

  // Rules — embedded in CLAUDE.md for claude-code (append to prompt)
  // Rules are already part of the materialized agent; in claude-code they go into
  // the main CLAUDE.md or individual rule files. We'll create .claude/rules/ files.
  // Claude Code rules are typically embedded in CLAUDE.md or handled natively.
  // No separate rule files needed for claude-code adapter.

  // Subagents
  if (agent.subagents && agent.subagents.length > 0) {
    actions.push({
      kind: "mkdir",
      path: ".claude/agents/",
      description: "Create agents directory",
    });

    for (const subagent of agent.subagents) {
      actions.push({
        kind: "write",
        path: `.claude/agents/${subagent.name}.md`,
        description: `Write subagent: ${subagent.name}`,
        content: subagent.instructions,
      });
    }
  }

  // Settings
  if (agent.secrets && agent.secrets.length > 0) {
    // Secrets are consumer-only for claude-code; just warn
    warnings.push({
      code: "SECRETS_CONSUMER_ONLY",
      message: "Secrets must be configured manually in your environment",
    });
  }

  return { actions, warnings };
}

// ─── Cursor ────────────────────────────────────────────

function planCursor(agent: MaterializedAgent): InstallPlan {
  const actions: InstallAction[] = [];
  const warnings: MaterializationWarning[] = [...agent.warnings];

  // Main instructions file
  if (agent.prompt) {
    actions.push({
      kind: "write",
      path: "AGENTS.md",
      description: "Write main instructions",
      content: agent.prompt,
    });
  }

  // MCP config
  if (agent.mcp) {
    actions.push({
      kind: "write",
      path: ".cursor/mcp.json",
      description: "Write MCP configuration",
      content: JSON.stringify({ mcpServers: agent.mcp.servers }, null, 2),
    });
  }

  // Rules
  if (agent.rules && agent.rules.length > 0) {
    actions.push({
      kind: "mkdir",
      path: ".cursor/rules/",
      description: "Create rules directory",
    });

    for (const rule of agent.rules) {
      actions.push({
        kind: "write",
        path: `.cursor/rules/${rule.id}.mdc`,
        description: `Write rule: ${rule.id}`,
        content: formatCursorRule(rule),
      });
    }
  }

  // Skills
  if (agent.skills && agent.skills.length > 0) {
    actions.push({
      kind: "mkdir",
      path: ".cursor/skills/",
      description: "Create skills directory",
    });

    for (const skill of agent.skills) {
      actions.push({
        kind: "write",
        path: `.cursor/skills/${skill.name}/SKILL.md`,
        description: `Write skill: ${skill.name}`,
        content: skill.content,
      });
    }
  }

  return { actions, warnings };
}

function formatCursorRule(rule: {
  id: string;
  scope: string;
  content: string;
  priority: number;
}): string {
  return `---\nid: ${rule.id}\nscope: ${rule.scope}\npriority: ${rule.priority}\n---\n${rule.content}`;
}

// ─── Generic / fallback ────────────────────────────────

function planGeneric(agent: MaterializedAgent, adapter: string): InstallPlan {
  const actions: InstallAction[] = [];
  const warnings: MaterializationWarning[] = [
    ...agent.warnings,
    {
      code: "UNKNOWN_ADAPTER",
      message: `No specific plan generator for adapter "${adapter}". Using generic layout.`,
    },
  ];

  if (agent.prompt) {
    actions.push({
      kind: "write",
      path: "INSTRUCTIONS.md",
      description: "Write main instructions",
      content: agent.prompt,
    });
  }

  return { actions, warnings };
}
