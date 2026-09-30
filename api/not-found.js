// Vercel Serverless Function — a real HTTP 404 for any URL that is neither a
// file in dist/ nor a route the SPA knows (audit 23 Sep 2026, SEO1: "unknown
// URLs return HTTP 200 (soft 404)").
//
// vercel.json sends the SPA's own routes to /app.html by an explicit
// allowlist, and everything else that reaches the rewrites lands here.
// Static files (prerendered pages, images, sw.js, ...) are served before
// rewrites are evaluated, so they never reach this function. The allowlist
// is kept in step with src/App.tsx by scripts/spa-routes-404.test.mjs -
// add a new <Route> and that test tells you to add it to vercel.json too.
//
// Story mode (Re, 25 Sep 2026): the approved hanok-alley scene (Cluby and a
// learner) with a short Cluby note - "a wrong turn in the alleys". Palette
// only (ivory, charcoal, yellow), bilingual, no client-side app. Keep the
// markup in step with api/blog-not-found.js.
// A link pasted into a sentence often carries the punctuation after it
// ("kloversegy.com/shop،" in an Arabic message, "…/terms." in English), and
// that used to land here as a 404 (Re, 1 Oct 2026). Such a URL is sent to the
// same address without the trailing marks instead.
const TRAILING_MARKS = /(?:%D8%8C|%D8%9B|%D8%9F|%C2%BB|%E2%80%9D|%E2%80%99|%22|%27|%29|%5D|[،؛؟».,;:!?'")\]])+$/i;
export function cleanTrailingPunctuation(req, res) {
  const url = req.url || "/";
  const q = url.indexOf("?");
  const path = q < 0 ? url : url.slice(0, q);
  const clean = path.replace(TRAILING_MARKS, "");
  if (clean === path) return false;
  res.setHeader("Location", (clean || "/") + (q < 0 ? "" : url.slice(q)));
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(301).send("");
  return true;
}

export default function handler(req, res) {
  if (cleanTrailingPunctuation(req, res)) return;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Page Not Found | Klovers</title>
<meta name="robots" content="noindex, nofollow" />
<link rel="icon" href="/favicon.ico" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;600&family=Cairo:wght@400;700&family=Kalam:wght@400&display=swap" />
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#FFF9EC;color:#2E2E2E;font-family:Inter,Cairo,system-ui,sans-serif;}
  .wrap{max-width:64rem;margin:0 auto;padding:3rem 1.25rem 4rem;display:grid;gap:2.5rem;align-items:center;}
  @media(min-width:768px){.wrap{grid-template-columns:1fr 1fr;padding-top:5rem;}}
  .brand{display:inline-block;font-family:Poppins,Cairo,sans-serif;font-weight:800;color:#2E2E2E;text-decoration:none;font-size:1.25rem;margin-bottom:1.5rem;}
  .code{display:inline-block;background:#FFFF00;color:#2E2E2E;border:2px solid #2E2E2E;border-radius:999px;padding:.25rem .9rem;font-weight:700;font-size:.8rem;letter-spacing:.12em;margin-bottom:1rem;}
  h1{font-family:Poppins,Cairo,sans-serif;font-weight:800;font-size:2.25rem;line-height:1.15;margin:0 0 .5rem;}
  h1 .ar,p.ar{font-family:Cairo,sans-serif;}
  p{font-size:1.05rem;line-height:1.6;margin:.25rem 0;}
  .note{font-family:"Segoe Script",Kalam,cursive;font-size:1.15rem;}
  .cta{display:inline-block;margin-top:1.5rem;background:#FFFF00;color:#2E2E2E;border:2px solid #2E2E2E;border-radius:.9rem;padding:.75rem 1.4rem;font-weight:700;text-decoration:none;box-shadow:4px 4px 0 #2E2E2E;}
  .links{margin-top:1.25rem;font-size:.95rem;}
  .links a{color:#2E2E2E;display:inline-block;padding:.35rem 0;}
  figure{margin:0;position:relative;justify-self:center;max-width:24rem;width:100%;}
  figure img{width:100%;height:auto;display:block;border-radius:1.5rem;border:4px solid #2E2E2E;}
  figcaption{position:absolute;bottom:-1.1rem;inset-inline-start:1rem;background:#FFF9EC;border:2px solid #2E2E2E;border-radius:1rem;padding:.4rem .9rem;}
</style>
</head>
<body>
<main class="wrap">
<div>
<a class="brand" href="/">Klovers</a><br />
<span class="code">404</span>
<h1>Looks like we took a wrong turn.<br /><span class="ar" lang="ar" dir="rtl">يبدو إننا خدنا طريق غلط.</span></h1>
<p>Even Cluby gets lost in these alleys sometimes. This page doesn't exist or has moved.</p>
<p class="ar" lang="ar" dir="rtl">حتى كلوبي ساعات بيتوه في الحواري دي. الصفحة دي مش موجودة أو اتنقلت.</p>
<a class="cta" href="/">Back home &middot; <span lang="ar">الرئيسية</span></a>
<p class="links"><a href="/courses">Courses &middot; <span lang="ar">الكورسات</span></a> &middot; <a href="/free-trial">Free trial &middot; <span lang="ar">حصة مجانية</span></a> &middot; <a href="/blog">Blog &middot; <span lang="ar">المدونة</span></a></p>
</div>
<figure>
<img src="/assets/cluby/scene-hanok.webp" width="1080" height="1350" alt="Cluby and a Klovers learner walking through a hanok alley" />
<figcaption class="note">Let's find the way back!</figcaption>
</figure>
</main>
</body>
</html>
`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(404).send(html);
}
