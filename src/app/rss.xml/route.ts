import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, rssFeed } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return new Response(rssFeed(publicArticles()), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
