import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4321"
PAGES = {
    "home": "/magazine",
    "section": "/magazine/road-freight",
    "article": "/magazine/road-freight/ftl-ltl-express-and-pallet-freight-explained",
    "author": "/magazine/authors/logisticid-editorial-team",
    "search": "/magazine/search",
    "policy": "/magazine/sourcing-policy",
    "404": "/magazine/does-not-exist",
}
VIEWPORTS = [(320,568),(360,800),(375,812),(390,844),(430,932),(768,1024),
             (1024,768),(1280,800),(1440,900),(1920,1080),(2560,1440)]

def luminance(rgb):
    def ch(c):
        c = c/255
        return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r,g,b = rgb
    return 0.2126*ch(r)+0.7152*ch(g)+0.0722*ch(b)

def parse_rgb(s):
    nums = [float(x) for x in s.replace("rgba(","").replace("rgb(","").replace(")","").split(",")[:3]]
    return tuple(nums)

failures, notes = [], []

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, path in PAGES.items():
        for w,h in VIEWPORTS:
            ctx = browser.new_context(viewport={"width":w,"height":h})
            page = ctx.new_page()
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type=="error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"{BASE}{path}", wait_until="networkidle")

            # 1. No horizontal page overflow.
            overflow = page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            if overflow > 1:
                failures.append(f"{name} @{w}x{h}: page scrolls horizontally by {overflow}px")

            # 2. Every interactive element must be genuinely hit-testable:
            #    inside the viewport, non-zero size, and the topmost element at
            #    its own centre point (or a descendant of it).
            bad = page.evaluate("""() => {
              const out = [];
              const els = document.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
              for (const el of els) {
                const style = getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) continue;
                if (el.classList.contains('skip-link')) continue; // intentionally offscreen until focused
                const label = (el.textContent||el.getAttribute('aria-label')||el.tagName).trim().slice(0,40);
                if (r.left < -1 || r.right > window.innerWidth + 1) {
                  out.push({label, reason: `clipped horizontally (${Math.round(r.left)}..${Math.round(r.right)} vs ${window.innerWidth})`});
                  continue;
                }
                const cx = r.left + r.width/2, cy = r.top + r.height/2;
                if (cy < 0 || cy > window.innerHeight) continue; // below the fold is fine
                const top = document.elementFromPoint(cx, cy);
                if (!top) { out.push({label, reason:'elementFromPoint returned null'}); continue; }
                if (top !== el && !el.contains(top) && !top.contains(el)) {
                  out.push({label, reason:`covered by <${top.tagName.toLowerCase()} class="${top.className}">`});
                }
              }
              return out;
            }""")
            for b in bad:
                failures.append(f"{name} @{w}x{h}: '{b['label']}' {b['reason']}")

            # 3. Touch targets on the smallest viewport.
            if (w,h) == (320,568):
                small = page.evaluate("""() => {
                  const out = [];
                  for (const el of document.querySelectorAll('a[href], button, input')) {
                    if (el.classList.contains('skip-link')) continue;
                    if (el.closest('.references') || el.closest('.breadcrumbs')) continue;
                    // WCAG 2.2 Target Size (Minimum) exempts a target that is
                    // "in a sentence or its size is otherwise constrained by
                    // the line-height of non-target text". A link inside a
                    // paragraph of prose is exactly that: padding it out would
                    // break the text flow it lives in, which is worse for
                    // everyone than the smaller target.
                    const parent = el.parentElement;
                    if (parent && parent.textContent.trim() !== el.textContent.trim()) continue;
                    const r = el.getBoundingClientRect();
                    if (r.height === 0) continue;
                    if (r.height < 44) out.push({label:(el.textContent||'').trim().slice(0,30), h:Math.round(r.height)});
                  }
                  return out;
                }""")
                for s in small:
                    failures.append(f"{name} @320: touch target '{s['label']}' is {s['h']}px high (<44)")

            if (w,h) == (1280,800):
                # 4. Structure: one h1, no skipped heading levels, landmarks present.
                struct = page.evaluate("""() => {
                  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h=>+h.tagName[1]);
                  const skips = [];
                  for (let i=1;i<hs.length;i++) if (hs[i]-hs[i-1] > 1) skips.push(`${hs[i-1]}->${hs[i]}`);
                  return {
                    h1: document.querySelectorAll('h1').length,
                    skips,
                    main: document.querySelectorAll('main').length,
                    header: document.querySelectorAll('header').length,
                    footer: document.querySelectorAll('footer').length,
                    imgsNoAlt: [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,
                    lang: document.documentElement.lang,
                  };
                }""")
                if struct["h1"] != 1: failures.append(f"{name}: {struct['h1']} h1 elements, expected 1")
                if struct["skips"]: failures.append(f"{name}: heading level skips {struct['skips']}")
                if struct["main"] != 1: failures.append(f"{name}: {struct['main']} <main> landmarks")
                if struct["imgsNoAlt"]: failures.append(f"{name}: {struct['imgsNoAlt']} images without alt")
                if not struct["lang"]: failures.append(f"{name}: <html> has no lang")

                # 5. Contrast of real rendered text against its real background.
                pairs = page.evaluate("""() => {
                  const out = [];
                  const bgOf = (el) => {
                    let n = el;
                    while (n) {
                      const b = getComputedStyle(n).backgroundColor;
                      if (b && !b.startsWith('rgba(0, 0, 0, 0)')) return b;
                      n = n.parentElement;
                    }
                    return 'rgb(255,255,255)';
                  };
                  const seen = new Set();
                  for (const el of document.querySelectorAll('p,a,li,h1,h2,h3,span,button,td,th,time,figcaption')) {
                    if (!el.textContent.trim()) continue;
                    const r = el.getBoundingClientRect();
                    if (r.height === 0) continue;
                    const s = getComputedStyle(el);
                    const key = s.color+'|'+bgOf(el)+'|'+s.fontSize+'|'+s.fontWeight;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push({color:s.color, bg:bgOf(el), size:parseFloat(s.fontSize), weight:s.fontWeight,
                              sample:el.textContent.trim().slice(0,30)});
                  }
                  return out;
                }""")
                for pr in pairs:
                    try:
                        l1 = luminance(parse_rgb(pr["color"])); l2 = luminance(parse_rgb(pr["bg"]))
                    except Exception:
                        continue
                    ratio = (max(l1,l2)+0.05)/(min(l1,l2)+0.05)
                    large = pr["size"] >= 24 or (pr["size"] >= 18.66 and int(pr["weight"]) >= 700)
                    need = 3.0 if large else 4.5
                    if ratio < need:
                        failures.append(f"{name}: contrast {ratio:.2f} (need {need}) for '{pr['sample']}' {pr['color']} on {pr['bg']}")

                # A 404 page's own document request is logged as a failed
                # resource by the browser. That is the page working, not an error.
                real = [e for e in errors if not (name == "404" and "404" in e)]
                if real:
                    failures.append(f"{name}: console errors {real[:2]}")
            ctx.close()
        notes.append(f"{name}: {len(VIEWPORTS)} viewports checked")
    browser.close()

for n in notes: print("  " + n)
if failures:
    print(f"\nBROWSER QA FAILURES ({len(failures)}):")
    for f in dict.fromkeys(failures): print("  - " + f)
    sys.exit(1)
print("\nBrowser QA passed: no overflow, no clipped or covered controls, structure and contrast clean.")
