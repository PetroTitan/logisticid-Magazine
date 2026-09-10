import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { localeDetails } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { getSiteOrigin } from "@/lib/env";
import { site } from "@/lib/site";
import "@/styles/globals.css";

/**
 * The German root layout.
 *
 * The Magazine's app tree is split into `(en)` and `(de)` route groups for the
 * same reason the main site's is: `<html lang="de">` can only be written by a
 * root layout, and a layout cannot read the pathname without becoming dynamic.
 * A route group contributes no URL segment, so every English Magazine URL is
 * exactly where it was.
 *
 * No `alternates.canonical` here. The English root layout sets one because it
 * predates per-page metadata; setting a second default would give every German
 * page a canonical pointing at the German index until its own metadata
 * overrode it, and a wrong default is worse than none.
 */
const ui = strings("de");

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: { default: `${site.name} — Deutsch`, template: `%s | ${site.name}` },
  description: ui.standfirst,
  applicationName: site.name,
};

export default function GermanRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={localeDetails.de.hreflang}>
      <body>
        <a className="skip-link" href="#main">
          {ui.skipToContent}
        </a>
        <SiteHeader locale="de" />
        <main id="main">{children}</main>
        <SiteFooter locale="de" />
      </body>
    </html>
  );
}
