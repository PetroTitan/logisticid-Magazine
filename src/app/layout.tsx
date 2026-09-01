import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteOrigin } from "@/lib/env";
import { magazineUrl, site } from "@/lib/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: {
    default: site.name,
    // Every page title ends with the publication name, so a search result or a
    // browser tab identifies the source without the reader opening it.
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  alternates: {
    canonical: magazineUrl("/").href,
    types: {
      "application/rss+xml": magazineUrl("/rss.xml").href,
      "application/atom+xml": magazineUrl("/atom.xml").href,
      "application/feed+json": magazineUrl("/feed.json").href,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale}>
      <body>
        {/* The first focusable element on the page, so a keyboard user can get
            past the header without tabbing through every navigation link. */}
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
