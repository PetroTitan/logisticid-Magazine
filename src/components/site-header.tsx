import Link from "next/link";

import { Brand } from "@/components/brand";
import { sections } from "@/content/sections";
import { mainSiteUrl } from "@/lib/site";

/**
 * The Magazine header.
 *
 * The last item is deliberately a route back out to the main LogisticID site.
 * A reader who arrives on an article from a search result has no other way
 * back to the company, and an editorial section that cannot be left is a
 * dead end rather than part of one website.
 *
 * That link is an absolute URL to the main host, not a relative path: a
 * relative "/" would resolve to `/magazine/` under the base path and simply
 * return the reader to where they already are.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Brand />
        <nav aria-label="LogisticID Magazine" className="site-nav">
          {sections.map((section) => (
            <Link className="site-nav__link" href={`/${section.slug}`} key={section.slug}>
              {section.name}
            </Link>
          ))}
          <Link className="site-nav__link" href="/search">
            Search
          </Link>
          <a className="site-nav__link site-nav__exit" href={mainSiteUrl("/").href}>
            LogisticID.com
          </a>
        </nav>
      </div>
    </header>
  );
}
