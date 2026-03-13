import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  BookOpen,
  FileText,
  Package,
  Terminal,
  ArrowRight,
  ArrowUpRight,
  Layers,
  Shield,
  Box,
  Workflow,
  Menu,
  X,
  Check,
  Copy,
  MessageSquare,
  Wrench,
  ScrollText,
  Sparkles,
  FolderOpen,
  KeyRound,
  Database,
  GitBranch,
  User,
} from "lucide-react";

import { createMetadata } from "@/lib/metadata";

export const Route = createFileRoute("/")({
  head: () =>
    createMetadata({
      path: "/",
      title: "stax — Distribution Standard for AI Agents",
      description:
        "Describe, package, version, verify, and distribute AI agent artifacts as OCI artifacts. One canonical format for every runtime.",
    }),
  component: Home,
});

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="stax-home">
      <a href="#main-content" className="stax-skip-link">
        Skip to content
      </a>
      <div className="stax-grid-bg" aria-hidden="true" />
      <div className="stax-glow-orb" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className="stax-nav">
        <div className="stax-nav__inner">
          <Link to="/" className="stax-wordmark no-underline" aria-label="stax">
            <span className="stax-wordmark__dot" />
            <span className="stax-wordmark__label">stax</span>
          </Link>
          <button
            className="stax-nav__toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className={`stax-nav__links ${menuOpen ? "stax-nav__links--open" : ""}`}>
            <Link
              to="/docs/$"
              params={{ _splat: "overview" }}
              className="stax-nav__link no-underline"
              onClick={closeMenu}
            >
              Docs
            </Link>
            <Link
              to="/docs/$"
              params={{ _splat: "spec" }}
              className="stax-nav__link no-underline"
              onClick={closeMenu}
            >
              Spec
            </Link>
            <Link
              to="/docs/$"
              params={{ _splat: "cli" }}
              className="stax-nav__link no-underline"
              onClick={closeMenu}
            >
              CLI
            </Link>
            <a
              href="https://github.com/stakpak/stax"
              target="_blank"
              rel="noopener noreferrer"
              className="stax-nav__link stax-nav__link--github no-underline"
            >
              GitHub <ArrowUpRight className="size-3 opacity-50" />
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* ── Hero ── */}
        <section className="stax-hero">
          <div className="stax-hero__badge animate-[fade-up_0.5s_ease_both]">
            <span className="stax-hero__badge-dot" />
            spec v1.0.0
          </div>

          <h1 className="stax-hero__title animate-[fade-up_0.5s_ease_0.06s_both]">
            <span className="stax-hero__title-line">The distribution</span>
            <span className="stax-hero__title-line">
              standard for <span className="stax-gradient-text">agents</span>
            </span>
          </h1>

          <p className="stax-hero__subtitle animate-[fade-up_0.5s_ease_0.12s_both]">
            Describe, package, version, verify, and distribute AI agent artifacts
            <br className="hidden sm:block" />
            as OCI artifacts. One canonical format for every runtime.
          </p>

          <div className="stax-hero__actions animate-[fade-up_0.5s_ease_0.18s_both]">
            <Link
              to="/docs/$"
              params={{ _splat: "overview" }}
              className="stax-btn-primary no-underline"
            >
              Read the docs
              <ArrowRight className="size-3.5" />
            </Link>
            <CopyInstall />
          </div>

          {/* Terminal */}
          <div className="stax-hero__terminal animate-[fade-up_0.5s_ease_0.24s_both]">
            <div className="stax-terminal">
              <div className="stax-terminal__chrome">
                <div className="stax-terminal__dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="stax-terminal__title">terminal</span>
                <div aria-hidden="true" />
              </div>
              <div className="stax-terminal__body">
                <TermLine delay={0.8} prompt>
                  stax build
                </TermLine>
                <TermLine delay={1.3} color="green">
                  {"  "}Built artifact: sha256:a3f8c1…e7d2
                </TermLine>
                <TermLine delay={1.8} prompt>
                  stax push ghcr.io/acme/backend-engineer:3.1.0
                </TermLine>
                <TermLine delay={2.3} color="cyan">
                  {"  "}Pushed ghcr.io/acme/backend-engineer:3.1.0
                </TermLine>
                <TermLine delay={2.8} prompt>
                  stax materialize ghcr.io/acme/backend-engineer:3.1.0
                </TermLine>
                <TermLine delay={3.3} color="green">
                  {"  "}Materialized backend-engineer@3.1.0
                </TermLine>
              </div>
            </div>
          </div>
        </section>

        {/* ── Anatomy ── */}
        <section className="stax-section">
          <div className="stax-section__header">
            <span className="stax-label">What's inside</span>
            <h2 className="stax-section__title">
              Everything an agent needs,
              <br />
              in one artifact
            </h2>
            <p className="stax-section__desc">
              A stax artifact is a complete, portable snapshot of an agent's
              <br className="hidden sm:block" />
              identity, skills, tools, knowledge, and workspace context.
            </p>
          </div>

          <div className="stax-anatomy">
            <div className="stax-anatomy__artifact">
              <div className="stax-anatomy__header">
                <Package className="size-4" />
                <span>ghcr.io/acme/backend-engineer:3.1.0</span>
              </div>
              <div className="stax-anatomy__layers">
                <AnatomyLayer
                  icon={<User className="size-3.5" />}
                  name="Persona"
                  desc="Identity, role, expertise, communication style"
                  accent="emerald"
                />
                <AnatomyLayer
                  icon={<MessageSquare className="size-3.5" />}
                  name="System Prompt"
                  desc="Core instructions and behavioral guidelines"
                  accent="emerald"
                />
                <AnatomyLayer
                  icon={<ScrollText className="size-3.5" />}
                  name="Rules"
                  desc="Code style, security policies, review checklists"
                  accent="cyan"
                />
                <AnatomyLayer
                  icon={<Sparkles className="size-3.5" />}
                  name="Skills"
                  desc="Reusable capabilities — deploy, test, review, debug"
                  accent="cyan"
                />
                <AnatomyLayer
                  icon={<Wrench className="size-3.5" />}
                  name="MCP Servers"
                  desc="Tool connections — databases, APIs, search, CI"
                  accent="amber"
                />
                <AnatomyLayer
                  icon={<FolderOpen className="size-3.5" />}
                  name="Knowledge"
                  desc="API docs, architecture notes, runbooks"
                  accent="amber"
                />
                <AnatomyLayer
                  icon={<GitBranch className="size-3.5" />}
                  name="Workspace Source"
                  desc="Repository snapshot — the codebase it works on"
                  accent="violet"
                />
                <AnatomyLayer
                  icon={<Database className="size-3.5" />}
                  name="Memory Seeds"
                  desc="Learned context, decisions, preferences"
                  accent="violet"
                />
                <AnatomyLayer
                  icon={<KeyRound className="size-3.5" />}
                  name="Secret Declarations"
                  desc="What credentials it needs (values never stored)"
                  accent="violet"
                />
              </div>
            </div>

            <div className="stax-anatomy__runtimes">
              <div className="stax-anatomy__runtimes-label">materializes into</div>
              <div className="stax-anatomy__runtime-list">
                <span>Claude Code</span>
                <span>Codex</span>
                <span>Cursor</span>
                <span>Copilot</span>
                <span>Windsurf</span>
                <span>OpenCode</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Analogies ── */}
        <section className="stax-section">
          <div className="stax-section__header">
            <span className="stax-label">Think of it as</span>
            <h2 className="stax-section__title">
              The packaging layer
              <br />
              agents never had
            </h2>
            <p className="stax-section__desc">
              Containers became standard once there was a portable image format.
              <br className="hidden sm:block" />
              Agents need the same thing. stax is that format.
            </p>
          </div>

          <div className="stax-analogies">
            <ConceptCard
              icon={<Layers className="size-4" />}
              tag="OCI"
              title="Agent Artifacts"
              description="Immutable, content-addressed OCI artifacts containing an agent's full canonical brain."
            />
            <ConceptCard
              icon={<Box className="size-4" />}
              tag="NPM"
              title="Reusable Packages"
              description="Shared skill packs, MCP bundles, compliance rules, and knowledge packs."
            />
            <ConceptCard
              icon={<Workflow className="size-4" />}
              tag="HELM"
              title="Runtime Adapters"
              description="One artifact materializes into Claude Code, Codex, Cursor, Copilot, and more."
            />
            <ConceptCard
              icon={<Shield className="size-4" />}
              tag="SIGSTORE"
              title="Trust & Policy"
              description="Signatures, attestations, approvals, and provenance via OCI referrers."
            />
          </div>
        </section>

        {/* ── Flow ── */}
        <section className="stax-section">
          <div className="stax-section__header">
            <span className="stax-label">How it works</span>
            <h2 className="stax-section__title">From source to runtime</h2>
            <p className="stax-section__desc">
              Define your agent in TypeScript, build a deterministic artifact,
              <br className="hidden sm:block" />
              push to any OCI registry, materialize into any runtime.
            </p>
          </div>

          <div className="stax-flow">
            <FlowStep
              n="01"
              name="Define"
              detail="TypeScript SDK — defineAgent(), definePackage(), definePersona()"
            />
            <FlowStep
              n="02"
              name="Build"
              detail="Deterministic OCI layers with typed media types and locked deps"
            />
            <FlowStep
              n="03"
              name="Push"
              detail="Publish to any OCI registry. Sign and attest with referrers."
            />
            <FlowStep
              n="04"
              name="Materialize"
              detail="Translate to runtime-native files for any supported adapter."
            />
          </div>
        </section>

        {/* ── Boundary ── */}
        <section className="stax-section">
          <div className="stax-section__header">
            <span className="stax-label">Boundary principle</span>
            <h2 className="stax-section__title">
              Carries what an agent <em className="stax-section__em">is</em>,
              <br />
              not how it runs
            </h2>
            <p className="stax-section__desc">
              stax is intentionally not a runtime, orchestrator, or hosting platform.
              <br className="hidden sm:block" />
              It is the distribution substrate those products build on.
            </p>
          </div>

          <div className="stax-boundary">
            <BoundaryCard
              title="stax carries"
              accent
              items={[
                "What an agent is and what bytes define it",
                "What dependencies and packages it needs",
                "What source context it expects",
                "What secrets it declares",
                "What runtime outputs it can materialize into",
                "What trust and policy metadata is attached",
              ]}
            />
            <BoundaryCard
              title="Consumers own"
              items={[
                "Where the agent is scheduled",
                "How many replicas it runs",
                "What event starts it",
                "How long it executes",
                "What service mesh transports it",
                "What cloud account hosts it",
              ]}
            />
          </div>
        </section>

        {/* ── Docs nav ── */}
        <section className="stax-section">
          <div className="stax-section__header">
            <span className="stax-label">Documentation</span>
            <h2 className="stax-section__title">Explore the standard</h2>
            <p className="stax-section__desc">
              Everything you need to understand, adopt, and build with stax.
            </p>
          </div>

          <div className="stax-docs-grid">
            <DocCard
              icon={<BookOpen className="size-[1.1rem]" />}
              title="Overview"
              description="What stax is, the philosophy behind it, architecture, and the roadmap."
              link="overview"
              accent="emerald"
            />
            <DocCard
              icon={<FileText className="size-[1.1rem]" />}
              title="Specification"
              description="The full normative spec: manifests, layers, adapters, packages, and more."
              link="spec"
              accent="cyan"
            />
            <DocCard
              icon={<Terminal className="size-[1.1rem]" />}
              title="CLI Reference"
              description="Every command: init, build, push, pull, materialize, inspect, diff, verify."
              link="cli"
              accent="amber"
            />
            <DocCard
              icon={<Package className="size-[1.1rem]" />}
              title="Packages"
              description="Define agents, packages, personas. Dependency resolution and merge rules."
              link="packages"
              accent="violet"
            />
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="stax-footer">
        <span>stax — the distribution standard for AI agents</span>
        <a href="https://stakpak.dev" target="_blank" rel="noopener noreferrer">
          by stakpak
        </a>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Components
   ═══════════════════════════════════════════ */

function AnatomyLayer({
  icon,
  name,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  name: string;
  desc: string;
  accent: "emerald" | "cyan" | "amber" | "violet";
}) {
  return (
    <div className={`stax-anatomy-layer stax-anatomy-layer--${accent}`}>
      <div className="stax-anatomy-layer__icon">{icon}</div>
      <div className="stax-anatomy-layer__text">
        <span className="stax-anatomy-layer__name">{name}</span>
        <span className="stax-anatomy-layer__desc">{desc}</span>
      </div>
    </div>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const command = "npm i -g stax";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <button
      type="button"
      className="stax-btn-install"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy install command"}
    >
      <span className="stax-btn-install__prompt">$</span>
      {command}
      <span className="stax-btn-install__copy" aria-hidden="true">
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </span>
    </button>
  );
}

function ConceptCard({
  icon,
  tag,
  title,
  description,
}: {
  icon: React.ReactNode;
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <div className="stax-concept-card">
      <div className="stax-concept-card__tag">
        {icon}
        <span>{tag}</span>
      </div>
      <h3 className="stax-concept-card__title">{title}</h3>
      <p className="stax-concept-card__desc">{description}</p>
    </div>
  );
}

function FlowStep({ n, name, detail }: { n: string; name: string; detail: string }) {
  return (
    <div className="stax-flow-step">
      <div className="stax-flow-step__number">{n}</div>
      <div className="stax-flow-step__name">{name}</div>
      <p className="stax-flow-step__detail">{detail}</p>
    </div>
  );
}

function BoundaryCard({
  title,
  items,
  accent = false,
}: {
  title: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div className={`stax-boundary-card ${accent ? "stax-boundary-card--accent" : ""}`}>
      <h3 className="stax-boundary-card__title">{title}</h3>
      <ul className="stax-boundary-card__list">
        {items.map((t) => (
          <li key={t}>
            <span className="stax-boundary-card__marker" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocCard({
  icon,
  title,
  description,
  link,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  accent: "emerald" | "cyan" | "amber" | "violet";
}) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: link }}
      className={`stax-doc-card stax-doc-card--${accent} no-underline`}
    >
      <div className="stax-doc-card__icon">{icon}</div>
      <h3 className="stax-doc-card__title">{title}</h3>
      <p className="stax-doc-card__desc">{description}</p>
      <span className="stax-doc-card__cta">
        Explore <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}

function TermLine({
  children,
  prompt = false,
  color,
  delay = 0,
}: {
  children: React.ReactNode;
  prompt?: boolean;
  color?: "green" | "cyan";
  delay?: number;
}) {
  const cls = color === "green" ? "stax-term--green" : color === "cyan" ? "stax-term--cyan" : "";

  return (
    <div className="stax-terminal-line" style={{ animationDelay: `${delay}s` }}>
      {prompt && <span className="stax-terminal-line__prompt">$</span>}
      <span className={prompt ? "stax-terminal-line__cmd" : cls}>{children}</span>
    </div>
  );
}
