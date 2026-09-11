import { publicArticles } from "@/lib/corpus";
import { atomFeed, FEED_CACHE_CONTROL, lastChanged, rfc3339 } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  const articles = publicArticles("ru");

  // The feed's `updated` is the most recent RUSSIAN article change. Taking it
  // from the whole corpus would make an English publication look like new
  // Russian editorial activity to a Russian subscriber.
  const newest = articles.map(lastChanged).sort().at(-1);

  return new Response(atomFeed(articles, rfc3339(newest ?? "1970-01-01"), "ru"), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
