import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { LanguageSwitcher } from "@/components/language-switcher";
import { defaultLocale, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  indexPath,
  magazineStaticRoutes,
  staticPath,
  type MagazineStaticRoute,
} from "@/lib/localized-routes";
import { mainSiteTarget } from "@/lib/main-site-links";
import { magazineUrl, mainSiteUrl } from "@/lib/site";

/**
 * Shared shell for the editorial policy pages.
 *
 * These pages are the basis on which a reader is asked to trust everything
 * else, so they get the same breadcrumb, structured data and prose treatment
 * as an article rather than being tucked into a smaller template.
 *
 * The `route` identifies the page in the static route table, which is what
 * lets one component produce the canonical, the breadcrumb trail and the
 * language switcher for both languages without any page repeating its own
 * address in three places.
 */
export function PolicyPage({
  route,
  title,
  standfirst,
  locale = defaultLocale,
  children,
}: {
  route: MagazineStaticRoute;
  title: string;
  standfirst: string;
  locale?: Locale;
  children: ReactNode;
}) {
  const ui = strings(locale);
  const path = staticPath(route, locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl(mainSiteTarget("/", locale).path).href },
          /*
           * The SAME string the visible breadcrumb shows. Structured data that
           * names a step differently from the trail on the page describes a
           * hierarchy the reader cannot see, and the guidance for
           * `BreadcrumbList` is explicit that the name should be the visible
           * one. It was `site.name` — "LogisticID Magazine" — under a visible
           * crumb reading "Magazine", and under a German one reading "Magazin".
           */
          { name: ui.magazineCrumb, url: magazineUrl(indexPath(locale)).href },
          { name: title, url: magazineUrl(path).href },
        ])}
      />
      <div className="shell page">
        <Breadcrumbs
          locale={locale}
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl(mainSiteTarget("/", locale).path).href },
            { label: ui.magazineCrumb, href: indexPath(locale) },
            { label: title },
          ]}
        />
        <p className="page__eyebrow">{ui.editorialStandards}</p>
        <h1 className="page__title">{title}</h1>
        <p className="page__standfirst">{standfirst}</p>
        <LanguageSwitcher cluster={magazineStaticRoutes[route]} locale={locale} />
        <div className="prose">{children}</div>
      </div>
    </>
  );
}
