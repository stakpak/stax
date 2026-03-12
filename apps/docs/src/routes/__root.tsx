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
      },
      {
        name: "color-scheme",
        content: "dark",
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
    <html
      lang="en"
      suppressHydrationWarning
      className="dark"
      style={{ backgroundColor: "#09090b", color: "#fafafa", colorScheme: "dark" }}
    >
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: "#09090b" }}>
        <RootProvider theme={{ defaultTheme: "dark" }}>
          <Outlet />
        </RootProvider>
        <Scripts />
      </body>
    </html>
  );
}
