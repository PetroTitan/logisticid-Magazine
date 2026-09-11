import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, rssFeed } from "@/lib/feeds";

export const dynamic = "force-static";

/** The German RSS feed: German articles, German channel, German URLs. */
export function GET() {
  return new Response(rssFeed(publicArticles("de"), "de"), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
