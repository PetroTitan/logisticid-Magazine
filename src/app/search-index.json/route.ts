import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, lastChanged } from "@/lib/feeds";
import { buildSearchIndex } from "@/lib/search";

export const dynamic = "force-static";

export function GET() {
  const articles = publicArticles();
  const generatedAt = articles.map(lastChanged).sort().at(-1) ?? "1970-01-01";

  return Response.json(buildSearchIndex(articles, generatedAt), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
