import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, latestFeed, lastChanged } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  const articles = publicArticles();

  // `generatedAt` is the newest content change rather than the build clock, so
  // that a consumer polling this feed can tell whether anything editorial
  // actually happened. A build timestamp would change on every deployment and
  // tell them nothing.
  const generatedAt = articles.map(lastChanged).sort().at(-1) ?? "1970-01-01";

  return Response.json(latestFeed(articles, generatedAt), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
