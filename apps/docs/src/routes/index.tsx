import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-fd-background text-fd-foreground">
      {/* Grid bg */}
      <div className="stax-grid-bg" />
      {/* Glow orb */}
      <div className="stax-glow-orb" />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-xl bg-fd-background/85 border-b border-fd-border">
        <div className="font-[var(--font-display)] font-extrabold text-xl tracking-tight text-fd-foreground">
          stax
        </div>
        <div className="flex items-center gap-8">
          <Link
            to="/docs/$"
            params={{ _splat: "overview" }}
            className="font-[var(--font-mono)] text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors tracking-wider"
          >
            DOCS
          </Link>
          <a
            href="https://github.com/stakpak/stax"
            target="_blank"
            rel="noopener"
            className="font-[var(--font-mono)] text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors tracking-wider"
          >
            GITHUB
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-[1] flex flex-col items-center pt-40 pb-24 px-6 text-center">
        <div className="stax-badge">spec v1.0.0</div>
        <h1 className="font-[var(--font-display)] text-[clamp(3.5rem,8vw,7rem)] font-extrabold leading-[0.95] tracking-tighter text-fd-foreground mb-6 animate-[fade-up_0.8s_ease_0.1s_both]">
          The distribution
          <br />
          standard for <span className="stax-gradient-text">agents</span>
        </h1>
        <p className="font-[var(--font-body)] text-[clamp(1rem,2vw,1.25rem)] text-fd-muted-foreground max-w-lg leading-relaxed mb-12 animate-[fade-up_0.8s_ease_0.2s_both]">
          Describe, package, version, verify, and distribute AI agent artifacts. One canonical
          format for every runtime.
        </p>
        <div className="flex gap-4 flex-wrap justify-center animate-[fade-up_0.8s_ease_0.3s_both]">
          <Link
            to="/docs/$"
            params={{ _splat: "overview" }}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-fd-primary text-fd-primary-foreground font-bold text-sm no-underline transition-all hover:brightness-110 hover:-translate-y-px hover:shadow-[0_0_30px_rgba(0,232,123,0.2)]"
          >
            Read the Docs <span className="text-[1.1em]">&rarr;</span>
          </Link>
          <a
            href="https://github.com/stakpak/stax"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-[var(--font-mono)] font-medium text-sm text-fd-foreground border border-fd-border no-underline transition-all hover:border-fd-muted-foreground hover:bg-fd-accent"
          >
            $ npm i -g stax
          </a>
        </div>
      </section>

      {/* Terminal */}
      <section className="relative z-[1] max-w-2xl mx-auto mb-32 animate-[fade-up_0.8s_ease_0.4s_both]">
        <div className="stax-terminal-window">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06] bg-[#0f0f17]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="flex-1 text-center font-[var(--font-mono)] text-[0.7rem] text-[#888899] tracking-wider">
              terminal
            </div>
          </div>
          <div className="p-6 font-[var(--font-mono)] text-[0.8rem] leading-[1.8] text-[#888899]">
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00e87b] select-none shrink-0">$</span>
              <span className="text-[#e8e8ed]">stax build</span>
            </div>
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00e87b] pl-6">
                &#10003; artifact built &mdash; sha256:a3f8c1...e7d2
              </span>
            </div>
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00e87b] select-none shrink-0">$</span>
              <span className="text-[#e8e8ed]">stax push ghcr.io/acme/backend-engineer:3.1.0</span>
            </div>
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00d4ff] pl-6">&#x2191; pushing 7 layers (12.4 KB)</span>
            </div>
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00e87b] select-none shrink-0">$</span>
              <span className="text-[#e8e8ed]">
                stax materialize ghcr.io/acme/backend-engineer:3.1.0
              </span>
            </div>
            <div className="stax-terminal-line flex gap-3">
              <span className="text-[#00e87b] pl-6">
                &#10003; materialized for claude-code &mdash; 9 files written
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* What stax is */}
      <section className="relative z-[1] max-w-5xl mx-auto mb-32 px-6">
        <div className="font-[var(--font-mono)] text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-fd-primary mb-4">
          What stax is
        </div>
        <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fd-foreground tracking-tight mb-4 leading-tight">
          The packaging layer
          <br />
          agents never had
        </h2>
        <p className="text-fd-muted-foreground text-base max-w-lg leading-relaxed mb-12">
          Containers became standard once there was a portable image format. Agents need the same
          thing. stax is that format.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-px bg-fd-border rounded-xl overflow-hidden border border-fd-border">
          <AnalogyCard
            tag="OCI"
            title="Agent Artifacts"
            desc="Immutable, content-addressed OCI artifacts containing an agent's full canonical brain."
          />
          <AnalogyCard
            tag="NPM"
            title="Reusable Packages"
            desc="Shared skill packs, MCP bundles, compliance rules, and knowledge packs with dependency resolution."
          />
          <AnalogyCard
            tag="HELM"
            title="Runtime Adapters"
            desc="One artifact materializes into Claude Code, Codex, OpenClaw, Cursor, Copilot, Windsurf, and more."
          />
          <AnalogyCard
            tag="SIGSTORE"
            title="Trust & Policy"
            desc="Signatures, attestations, approvals, and provenance attached to every artifact via OCI referrers."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-[1] max-w-5xl mx-auto mb-32 px-6">
        <div className="font-[var(--font-mono)] text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-fd-primary mb-4">
          How it works
        </div>
        <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fd-foreground tracking-tight mb-4 leading-tight">
          From source to runtime
        </h2>
        <p className="text-fd-muted-foreground text-base max-w-lg leading-relaxed mb-12">
          Define your agent in TypeScript, build a deterministic artifact, push it to any OCI
          registry, and materialize it into any supported runtime.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
          <FlowStep
            n="01"
            name="Define"
            detail="TypeScript SDK with defineAgent(), definePackage(), and definePersona()"
          />
          <FlowStep
            n="02"
            name="Build"
            detail="Deterministic OCI layers with typed media types and locked dependencies"
          />
          <FlowStep
            n="03"
            name="Push"
            detail="Publish to any OCI-compatible registry. Sign and attest with referrers."
          />
          <FlowStep
            n="04"
            name="Materialize"
            detail="Translate canonical layers into runtime-native files for any adapter."
            arrow={false}
          />
        </div>
      </section>

      {/* Boundary */}
      <section className="relative z-[1] max-w-5xl mx-auto mb-32 px-6">
        <div className="font-[var(--font-mono)] text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-fd-primary mb-4">
          Boundary principle
        </div>
        <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fd-foreground tracking-tight mb-4 leading-tight">
          Carries what an agent <em className="italic text-fd-primary">is</em>, not how it runs
        </h2>
        <p className="text-fd-muted-foreground text-base max-w-lg leading-relaxed mb-12">
          stax is intentionally not a runtime, orchestrator, or hosting platform. It is the
          distribution substrate those products build on.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="bg-fd-card border border-fd-border rounded-xl p-8">
            <h3 className="font-[var(--font-display)] text-lg font-bold text-fd-primary mb-5">
              stax carries
            </h3>
            <ul className="space-y-2.5">
              {[
                "What an agent is and what bytes define it",
                "What dependencies and packages it needs",
                "What source context it expects",
                "What secrets it declares",
                "What runtime outputs it can materialize into",
                "What trust and policy metadata is attached",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-fd-muted-foreground">
                  <span className="font-[var(--font-mono)] font-bold text-xs text-fd-primary shrink-0 mt-0.5">
                    &gt;
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-fd-card border border-fd-border rounded-xl p-8">
            <h3 className="font-[var(--font-display)] text-lg font-bold text-fd-muted-foreground mb-5">
              Consumers own
            </h3>
            <ul className="space-y-2.5">
              {[
                "Where the agent is scheduled",
                "How many replicas it runs",
                "What event starts it",
                "How long it executes",
                "What service mesh transports it",
                "What cloud account hosts it",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-fd-muted-foreground">
                  <span className="font-[var(--font-mono)] font-bold text-xs opacity-30 shrink-0 mt-0.5">
                    ~
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Documentation sections */}
      <section className="relative z-[1] max-w-5xl mx-auto mb-32 px-6">
        <div className="font-[var(--font-mono)] text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-fd-primary mb-4">
          Documentation
        </div>
        <h2 className="font-[var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fd-foreground tracking-tight mb-4 leading-tight">
          Explore the standard
        </h2>
        <p className="text-fd-muted-foreground text-base max-w-lg leading-relaxed mb-12">
          Everything you need to understand, adopt, and build with stax.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          <DocCard
            icon="&#9670;"
            title="Overview"
            desc="What stax is, the philosophy behind it, core architecture, and the roadmap ahead."
            link="overview"
            accentClass="text-emerald-500 dark:text-[#00e87b]"
            bgClass="bg-emerald-500/10"
          />
          <DocCard
            icon="&#9636;"
            title="Specification"
            desc="The full normative spec: manifests, layers, adapters, packages, and more."
            link="spec"
            accentClass="text-cyan-500 dark:text-[#00d4ff]"
            bgClass="bg-cyan-500/10"
          />
          <DocCard
            icon="&#9648;"
            title="CLI Reference"
            desc="Every command: init, build, push, pull, materialize, inspect, diff, and verify."
            link="cli"
            accentClass="text-amber-500 dark:text-[#ffb347]"
            bgClass="bg-amber-500/10"
          />
          <DocCard
            icon="&#9641;"
            title="Packages"
            desc="Define agents, packages, and personas. Dependency resolution and merge rules."
            link="packages"
            accentClass="text-purple-500 dark:text-purple-400"
            bgClass="bg-purple-500/10"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-[1] border-t border-fd-border py-12 px-6 text-center">
        <p className="font-[var(--font-mono)] text-[0.7rem] text-fd-muted-foreground tracking-wider">
          stax &mdash; the distribution standard for AI agents &mdash; by{" "}
          <a
            href="https://stakpak.dev"
            target="_blank"
            rel="noopener"
            className="text-fd-primary no-underline hover:underline"
          >
            stakpak
          </a>
        </p>
      </footer>
    </div>
  );
}

function AnalogyCard({ tag, title, desc }: { tag: string; title: string; desc: string }) {
  return (
    <div className="bg-fd-card p-8 transition-colors hover:bg-fd-accent/50">
      <div className="font-[var(--font-mono)] text-[0.7rem] font-semibold text-fd-primary tracking-wider uppercase mb-3 flex items-center gap-2">
        <span className="w-2 h-0.5 bg-current inline-block" />
        {tag}
      </div>
      <div className="font-[var(--font-display)] text-lg font-bold text-fd-foreground mb-2">
        {title}
      </div>
      <div className="text-fd-muted-foreground text-sm leading-relaxed">{desc}</div>
    </div>
  );
}

function FlowStep({
  n,
  name,
  detail,
  arrow = true,
}: {
  n: string;
  name: string;
  detail: string;
  arrow?: boolean;
}) {
  return (
    <div className="relative text-center py-8 px-4">
      <div className="font-[var(--font-display)] text-5xl font-extrabold text-fd-border leading-none mb-4">
        {n}
      </div>
      <div className="font-[var(--font-mono)] text-sm font-semibold text-fd-primary mb-2 tracking-wide">
        {name}
      </div>
      <div className="text-fd-muted-foreground text-[0.8rem] leading-snug">{detail}</div>
      {arrow && (
        <div className="hidden md:block absolute -right-4 top-1/2 text-fd-muted-foreground/30 text-xl">
          &rarr;
        </div>
      )}
    </div>
  );
}

function DocCard({
  icon,
  title,
  desc,
  link,
  accentClass,
  bgClass,
}: {
  icon: string;
  title: string;
  desc: string;
  link: string;
  accentClass: string;
  bgClass: string;
}) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: link }}
      className="group block bg-fd-card border border-fd-border rounded-xl p-8 no-underline transition-all relative overflow-hidden hover:border-fd-muted-foreground hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 text-xl ${bgClass} ${accentClass}`}
      >
        {icon}
      </div>
      <div className="font-[var(--font-display)] text-lg font-bold text-fd-foreground mb-2">
        {title}
      </div>
      <div className="text-fd-muted-foreground text-[0.8rem] leading-relaxed mb-4">{desc}</div>
      <div
        className={`font-[var(--font-mono)] text-[0.7rem] font-semibold tracking-wider uppercase ${accentClass}`}
      >
        Explore &rarr;
      </div>
    </Link>
  );
}
