import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import browserCollections from "collections/browser";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { BookOpen, FileText, Package, Terminal } from "lucide-react";
import { Suspense } from "react";

import { useMDXComponents } from "@/components/mdx";
import { baseOptions, gitConfig } from "@/lib/layout.shared";
import { source } from "@/lib/source";

const tabConfig: Record<string, { icon: React.ReactNode; description: string; color: string }> = {
  Overview: {
    icon: <BookOpen className="size-full" />,
    description: "What stax is & why",
    color: "text-fd-primary",
  },
  Specification: {
    icon: <FileText className="size-full" />,
    description: "The normative standard",
    color: "text-fd-primary",
  },
  CLI: {
    icon: <Terminal className="size-full" />,
    description: "Commands & config",
    color: "text-fd-primary",
  },
  Packages: {
    icon: <Package className="size-full" />,
    description: "Author & distribute",
    color: "text-fd-primary",
  },
};

const sectionThemes = {
  overview: {
    label: "Overview",
    eyebrow: "Conceptual primer",
    pathLabel: "docs/overview",
    chip: "start here",
  },
  spec: {
    label: "Specification",
    eyebrow: "Normative reference",
    pathLabel: "docs/spec",
    chip: "canonical",
  },
  cli: {
    label: "CLI",
    eyebrow: "Command surface",
    pathLabel: "docs/cli",
    chip: "reference",
  },
  packages: {
    label: "Packages",
    eyebrow: "Composition layer",
    pathLabel: "docs/packages",
    chip: "authoring",
  },
} as const;

const defaultTheme = {
  label: "Documentation",
  eyebrow: "Deep dive",
  pathLabel: "docs",
  chip: "reference",
};

function getSectionTheme(path: string) {
  const section = path.split("/")[0] as keyof typeof sectionThemes;
  return sectionThemes[section] ?? defaultTheme;
}

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await serverLoader({ data: slugs });
    await clientLoader.preload(data.path);
    return data;
  },
});

const serverLoader = createServerFn({
  method: "GET",
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      slugs: page.slugs,
      path: page.path,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

const clientLoader = browserCollections.docs.createClientLoader({
  component(
    { toc, frontmatter, default: MDX },
    {
      markdownUrl,
      path,
    }: {
      markdownUrl: string;
      path: string;
    },
  ) {
    const theme = getSectionTheme(path);
    const pagePath = path.replace(/\.mdx$/, "");

    return (
      <DocsPage toc={toc} className="stax-docs-page">
        <div className="stax-doc-hero">
          <div className="stax-doc-kicker">
            <span className="stax-doc-kicker__dot" />
            {theme.label}
          </div>
          <div className="stax-doc-overline">{theme.eyebrow}</div>
          <DocsTitle className="stax-doc-title">{frontmatter.title}</DocsTitle>
          <DocsDescription className="stax-doc-description">
            {frontmatter.description}
          </DocsDescription>
          <div className="stax-doc-meta">
            <span className="stax-doc-chip">{theme.chip}</span>
            <span className="stax-doc-chip stax-doc-chip--ghost">/{pagePath}</span>
            <span className="stax-doc-chip stax-doc-chip--ghost">{theme.pathLabel}</span>
          </div>
        </div>

        <div className="stax-doc-toolbar">
          <div className="stax-doc-toolbar__label">
            <span className="stax-doc-toolbar__signal" />
            page tools
          </div>
          <div className="stax-doc-toolbar__actions">
            <MarkdownCopyButton markdownUrl={markdownUrl} />
            <ViewOptionsPopover
              markdownUrl={markdownUrl}
              githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${path}`}
            />
          </div>
        </div>

        <DocsBody className="stax-prose">
          <MDX components={useMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  },
});

function Page() {
  const { path, pageTree, slugs } = useFumadocsLoader(Route.useLoaderData());
  const markdownUrl = `/llms.mdx/docs/${slugs.join("/")}`;

  return (
    <DocsLayout
      {...baseOptions()}
      tree={pageTree}
      sidebar={{
        tabs: {
          transform(option, node) {
            const title = typeof option.title === "string" ? option.title : String(node.name);
            const cfg = tabConfig[title];
            if (!cfg) return option;
            return {
              ...option,
              icon: <span className={cfg.color}>{cfg.icon}</span>,
              description: cfg.description,
            };
          },
        },
      }}
    >
      <Suspense>{clientLoader.useContent(path, { markdownUrl, path })}</Suspense>
    </DocsLayout>
  );
}
