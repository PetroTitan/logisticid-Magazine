import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, latestFeed, lastChanged } from "@/lib/feeds";

export const dynamic = "force-static";

/**
 * The Russian counterpart of `/magazine/latest.json`.
 *
 * It exists so the main site's RUSSIAN pages can show recent Russian Magazine
 * articles without filtering an English document and without either
 * application importing the other. The English document is unchanged and
 * still English-only: a consumer that asks for one language must not be handed
 * two.
 */
export function GET() {
  const articles = publicArticles("ru");
  const generatedAt = articles.map(lastChanged).sort().at(-1) ?? "1970-01-01";

  return Response.json(latestFeed(articles, generatedAt), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
