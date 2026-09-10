import { defaultLocale, type Locale } from "@/config/locales";
import { strings } from "@/config/ui-strings";
import Link from "next/link";

export type Crumb = {
  label: string;
  /** Magazine-relative path. Omitted on the current page. */
  href?: string;
};

/**
 * The breadcrumb trail.
 *
 * The first crumb is the main LogisticID site, so the trail shows the
 * Magazine's actual place in one website rather than presenting itself as a
 * root. Its href is absolute for the same reason the header's exit link is.
 */
export function Breadcrumbs({
  crumbs,
  locale = defaultLocale,
}: {
  crumbs: readonly Crumb[];
  /**
   * The page's language. It names the landmark — the only text this component
   * contributes of its own. A German page announcing a "Breadcrumb" landmark is
   * a small thing to a sighted reader and the whole announcement to a
   * screen-reader user.
   */
  locale?: Locale;
}) {
  return (
    <nav aria-label={strings(locale).breadcrumbLabel} className="breadcrumbs">
      <ol>
        {crumbs.map((crumb, index) => (
          <li key={index}>
            {crumb.href === undefined ? (
              <span aria-current="page">{crumb.label}</span>
            ) : crumb.href.startsWith("http") ? (
              <a href={crumb.href}>{crumb.label}</a>
            ) : (
              <Link href={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
