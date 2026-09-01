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
export function Breadcrumbs({ crumbs }: { crumbs: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
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
