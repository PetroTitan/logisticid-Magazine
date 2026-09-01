import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { magazineUrl, mainSiteUrl, site } from "@/lib/site";

/**
 * Shared shell for the editorial policy pages.
 *
 * These pages are the basis on which a reader is asked to trust everything
 * else, so they get the same breadcrumb, structured data and prose treatment
 * as an article rather than being tucked into a smaller template.
 */
export function PolicyPage({
  path,
  title,
  standfirst,
  children,
}: {
  path: string;
  title: string;
  standfirst: string;
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "LogisticID", url: mainSiteUrl("/").href },
          { name: site.name, url: magazineUrl("/").href },
          { name: title, url: magazineUrl(path).href },
        ])}
      />
      <div className="shell page">
        <Breadcrumbs
          crumbs={[
            { label: "LogisticID", href: mainSiteUrl("/").href },
            { label: "Magazine", href: "/" },
            { label: title },
          ]}
        />
        <p className="page__eyebrow">Editorial standards</p>
        <h1 className="page__title">{title}</h1>
        <p className="page__standfirst">{standfirst}</p>
        <div className="prose">{children}</div>
      </div>
    </>
  );
}
