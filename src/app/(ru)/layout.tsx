import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { localeDetails } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { getSiteOrigin } from "@/lib/env";
import { site } from "@/lib/site";
import "@/styles/globals.css";

/**
 * The Russian root layout.
 *
 * The third root layout, for the reason the second exists: `<html lang="ru">`
 * can only be written by a root layout, and a layout cannot read the pathname
 * without becoming dynamic. A route group contributes no URL segment, so every
 * English and German Magazine URL is exactly where it was.
 *
 * No `alternates.canonical` here, for the same reason the German layout sets
 * none: a default canonical would point every Russian page at the Russian
 * index until its own metadata overrode it, and a wrong default is worse than
 * none.
 */
const ui = strings("ru");

export const metadata: Metadata = {
  metadataBase: getSiteOrigin(),
  title: { default: `${site.name} — на русском`, template: `%s | ${site.name}` },
  description: ui.standfirst,
  applicationName: site.name,
};

export default function RussianRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={localeDetails.ru.hreflang}>
      <body>
        <a className="skip-link" href="#main">
          {ui.skipToContent}
        </a>
        <SiteHeader locale="ru" />
        <main id="main">{children}</main>
        <SiteFooter locale="ru" />
      </body>
    </html>
  );
}
