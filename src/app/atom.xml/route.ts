import { publicArticles } from "@/lib/corpus";
import { atomFeed, FEED_CACHE_CONTROL, lastChanged, rfc3339 } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  const articles = publicArticles();

  // The feed's `updated` is the most recent article change, not the build
  // time. A build-time value would make every deployment look like new
  // editorial activity to a subscriber, including a deployment that changed
  // only a stylesheet.
  const newest = articles
    .map(lastChanged)
    .sort()
    .at(-1);

  return new Response(atomFeed(articles, rfc3339(newest ?? "1970-01-01")), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
