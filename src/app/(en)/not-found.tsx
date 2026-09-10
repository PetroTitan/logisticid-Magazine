import Link from "next/link";

import { sections } from "@/content/sections";
import { mainSiteUrl } from "@/lib/site";

/**
 * The Magazine's own 404.
 *
 * It must return a real HTTP 404 rather than a 200 with apologetic text: a
 * soft 404 keeps a dead URL in the index and tells a crawler the page exists.
 * Next.js sets the status for this file automatically; `tests/routing` asserts
 * the behaviour so a future refactor cannot quietly turn it into a 200.
 */
export default function NotFound() {
  return (
    <div className="shell page">
      <p className="page__eyebrow">404</p>
      <h1 className="page__title">This page does not exist</h1>
      <p className="page__standfirst">
        The address may be mistyped, or the article may never have been published. Nothing has been
        removed to hide it — corrections and withdrawals are recorded on the{" "}
        <Link href="/corrections">corrections page</Link>.
      </p>

      <section aria-labelledby="notfound-sections" className="article__aside">
        <h2 id="notfound-sections">Try one of these</h2>
        <ul className="linked-list">
          <li>
            <Link href="/">LogisticID Magazine home</Link>
          </li>
          {sections.map((section) => (
            <li key={section.slug}>
              <Link href={`/${section.slug}`}>{section.name}</Link>
            </li>
          ))}
          <li>
            <Link href="/search">Search the Magazine</Link>
          </li>
          <li>
            <a href={mainSiteUrl("/").href}>The main LogisticID website</a>
          </li>
        </ul>
      </section>
    </div>
  );
}
