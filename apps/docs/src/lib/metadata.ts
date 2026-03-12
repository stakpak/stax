const DEFAULT_TITLE = "stax — Distribution Standard for AI Agents";
const DEFAULT_DESCRIPTION =
  "Describe, package, version, verify, and distribute AI agent artifacts as OCI artifacts. One canonical format for every runtime.";

const siteUrl =
  process.env.SITE_URL ?? process.env.PUBLIC_SITE_URL ?? process.env.VITE_SITE_URL ?? undefined;

type MetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export function createMetadata({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
  noindex = false,
}: MetadataInput = {}) {
  const absoluteUrl = siteUrl ? new URL(path, siteUrl).toString() : undefined;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:site_name", content: "stax" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      ...(absoluteUrl ? [{ property: "og:url", content: absoluteUrl }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
    links: absoluteUrl
      ? [
          {
            rel: "canonical",
            href: absoluteUrl,
          },
        ]
      : [],
  };
}

export { DEFAULT_DESCRIPTION, DEFAULT_TITLE };
