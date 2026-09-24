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
// Plain HTML in the Klovers palette (ivory, charcoal, yellow), bilingual,
// like api/blog-not-found.js: a dead URL needs no client-side app.
export default function handler(req, res) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Page Not Found | Klovers</title>
<meta name="robots" content="noindex, nofollow" />
</head>
<body style="margin:0;background:#FFF9EC;color:#2E2E2E;font-family:Inter,Cairo,system-ui,sans-serif;">
<main style="max-width:32rem;margin:4rem auto;padding:0 1.5rem;text-align:center;">
<h1 style="font-family:Poppins,Cairo,system-ui,sans-serif;">Page not found</h1>
<p>This page doesn't exist or has moved.</p>
<p lang="ar" dir="rtl">الصفحة غير موجودة أو تم نقلها.</p>
<p><a href="/" style="display:inline-block;background:#FFFF00;color:#2E2E2E;border:2px solid #2E2E2E;border-radius:0.75rem;padding:0.6rem 1.2rem;font-weight:700;text-decoration:none;">Go home &middot; الرئيسية</a></p>
<p><a href="/courses" style="color:#2E2E2E;">Courses</a> &middot; <a href="/free-trial" style="color:#2E2E2E;">Free trial</a> &middot; <a href="/blog" style="color:#2E2E2E;">Blog</a></p>
</main>
</body>
</html>
`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(404).send(html);
}
