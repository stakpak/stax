# Competitor Matrix

Date: 2026-03-11

## Scoring rubric

Scores are from 1 to 5.

- Portability: how well the offering supports cross-runtime or cross-environment portability
- Distribution and governance: versioning, policy, approvals, promotion, rollback, or managed deployment controls
- Runtime reach: breadth of environments and consumption surfaces
- Enterprise trust: suitability for enterprise control, provenance, and policy workflows
- Ecosystem pull: distribution advantage from installed base, marketplace gravity, or protocol adoption
- Threat to `stax`: practical threat to `stax` winning its wedge

## Matrix

| Competitor                                | Category                                      | Portability | Distribution and governance | Runtime reach | Enterprise trust | Ecosystem pull | Threat to `stax` | Positioning read                                                                                      |
| ----------------------------------------- | --------------------------------------------- | ----------: | --------------------------: | ------------: | ---------------: | -------------: | ---------------: | ----------------------------------------------------------------------------------------------------- |
| Anthropic Claude Code                     | Vendor runtime                                |           1 |                           2 |             1 |                3 |              4 |                4 | Strong de facto format inside its own ecosystem; weak as a neutral standard                           |
| OpenAI Codex                              | Vendor runtime                                |           1 |                           2 |             1 |                3 |              4 |                4 | Same pattern as Claude Code; important because of distribution via OpenAI's developer base            |
| GitHub Copilot                            | Vendor runtime and platform                   |           2 |                           3 |             2 |                4 |              5 |                5 | Biggest de facto enterprise threat because GitHub already owns repos, policy, and developer workflows |
| Microsoft AgentSchema                     | Open schema standard                          |           4 |                           2 |             2 |                4 |              3 |                4 | Direct schema-level competition, but less mature on OCI-style distribution and artifact lifecycle     |
| Oracle Agent Spec                         | Open schema standard                          |           4 |                           2 |             3 |                2 |              2 |                3 | Strong portability story on paper; weaker current ecosystem gravity                                   |
| LangGraph Platform / LangSmith Deployment | Agent framework and deployment platform       |           2 |                           4 |             3 |                4 |              5 |                4 | Strong for teams willing to live inside one framework and hosted stack                                |
| Google ADK                                | Agent framework                               |           2 |                           3 |             3 |                4 |              4 |                3 | Strong developer and cloud adjacency; less obviously a neutral packaging standard                     |
| AWS Bedrock Agents                        | Cloud agent platform                          |           1 |                           4 |             2 |                5 |              4 |                4 | Strong enterprise-hosted alternative when portability is not a priority                               |
| CrewAI Enterprise                         | Agent framework and enterprise platform       |           2 |                           3 |             2 |                3 |              3 |                3 | Credible for workflow-heavy buyers; less powerful as a neutral artifact layer                         |
| MCP Registry                              | Adjacent registry and protocol infrastructure |           3 |                           2 |             4 |                3 |              5 |                3 | Complementary and strategically important; `stax` should integrate, not compete                       |

## Notes by competitor

### Anthropic Claude Code

- Official docs show first-class support for `CLAUDE.md`, settings, skills, MCP, rules, plugins, and managed configuration.
- This is not a neutral packaging standard, but it is a strong local maximum for teams standardizing on Claude.
- Threat profile is high on de facto format power and low on cross-runtime portability.

### OpenAI Codex

- OpenAI's developer docs now expose Codex-specific surfaces including AGENTS guidance, config, MCP, skills, multi-agent concepts, automation, and security controls.
- The threat is not openness. The threat is developer gravity and default adoption.

### GitHub Copilot

- GitHub has repo-native gravity, enterprise policy gravity, MCP support, custom instructions, custom agents, plugins, skills, and marketplace distribution.
- This is the most dangerous practical competitor for `stax` in enterprise coding workflows because it sits closest to source control and existing governance.

### Microsoft AgentSchema

- AgentSchema positions itself as a unified exchange format across Microsoft AI agents, Semantic Kernel, and Copilot Studio.
- It competes directly on portable definition and exchange.
- It currently appears less complete than `stax` on artifact packaging, OCI transport, and lifecycle operations.

### Oracle Agent Spec

- Oracle Agent Spec explicitly targets portable, platform-agnostic configuration with adapters into multiple frameworks.
- It is one of the cleanest direct strategic competitors because it claims portability across ecosystems.
- It still looks lighter on governance, distribution, and supply-chain rigor than `stax`.

### LangGraph Platform / LangSmith Deployment

- LangChain offers deployment, scaling, and hosting for agent apps.
- This is strong competition for buyers who want an end-to-end stack rather than a neutral artifact layer.
- It is weaker if the buyer values runtime neutrality.

### Google ADK

- Google ADK is a modular framework for building and deploying AI agents.
- It is more framework and runtime than neutral packaging layer.
- It is still a threat because large ecosystems tend to absorb packaging needs into their framework defaults.

### AWS Bedrock Agents

- Bedrock Agents is strong on enterprise posture, hosted deployment, and managed cloud workflows.
- It is a meaningful threat when the buyer prefers cloud lock-in over portability.

### CrewAI Enterprise

- CrewAI is credible for orchestrated workflows and enterprise automation.
- It competes more on execution model than on neutral artifact distribution.

### MCP Registry

- MCP Registry is not a direct substitute for `stax`.
- It is strategically important because it can become the default source of truth for MCP discovery while `stax` handles artifact composition, policy, and promotion.
- If `stax` competes with MCP Registry instead of integrating with it, that would be a strategic mistake.

## Positioning implications for `stax`

### What `stax` should claim

- runtime-neutral agent asset distribution
- exact or explicit-fidelity materialization
- OCI-backed artifact lifecycle
- enterprise governance and promotion workflows

### What `stax` should not claim

- best runtime for building or executing agents
- best orchestration framework
- best hosted deployment platform
- the only place to discover MCP servers

## Strategic conclusion

The main competitive threat is not another open standard. It is vendor default behavior plus platform gravity.

That means `stax` wins by solving a problem those vendors and platforms do not want to solve well:

- cross-runtime portability
- enterprise policy over mixed ecosystems
- digest-stable promotion and rollback
- shared packages across tools

## Primary sources

- Anthropic Claude Code docs: https://docs.anthropic.com/en/docs/claude-code/memory
- Anthropic settings: https://docs.anthropic.com/en/docs/claude-code/settings
- Anthropic skills: https://docs.anthropic.com/en/docs/claude-code/skills
- Anthropic MCP: https://docs.anthropic.com/en/docs/claude-code/mcp
- OpenAI developers docs hub: https://developers.openai.com/
- GitHub Copilot CLI docs: https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-agents/overview
- Microsoft AgentSchema: https://microsoft.github.io/AgentSchema/
- Oracle Agent Spec: https://oracle.github.io/agent-spec/development/agentspec/index.html
- LangSmith Deployment: https://docs.langchain.com/langgraph-platform
- Google ADK quickstart: https://google.github.io/adk-docs/get-started/quickstart/
- AWS Bedrock Agents: https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html
- CrewAI Automations: https://docs.crewai.com/en/enterprise/features/automations
- MCP Registry: https://modelcontextprotocol.io/registry/about
