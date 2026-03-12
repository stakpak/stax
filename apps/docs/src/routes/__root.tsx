import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import * as React from "react";

import appCss from "@/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "theme-color",
        content: "#09090b",
        media: "(prefers-color-scheme: dark)",
      },
      {
        name: "theme-color",
        content: "#fcfcfd",
        media: "(prefers-color-scheme: light)",
      },
    ],
    links: [
      {
        rel: "preload",
        href: appCss,
        as: "style",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider theme={{ defaultTheme: "system" }}>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
