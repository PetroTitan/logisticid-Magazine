import Link from "next/link";

import { indexPath } from "@/lib/localized-routes";

export const metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false, follow: true },
};

/** The German 404, so a missing German URL answers in German. */
export default function GermanNotFound() {
  return (
    <div className="shell page">
      <h1 className="page__title">Seite nicht gefunden</h1>
      <p className="page__standfirst">
        Diese Seite gibt es nicht, oder sie ist umgezogen.
      </p>
      <p>
        <Link href={indexPath("de")}>Zur deutschsprachigen Übersicht</Link>
      </p>
    </div>
  );
}
