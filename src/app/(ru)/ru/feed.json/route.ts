import { publicArticles } from "@/lib/corpus";
import { FEED_CACHE_CONTROL, jsonFeed } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return Response.json(jsonFeed(publicArticles("ru"), "ru"), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": FEED_CACHE_CONTROL,
    },
  });
}
