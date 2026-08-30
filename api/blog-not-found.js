// Vercel Serverless Function — a real HTTP 404 for /blog/:slug requests that
// don't match a prerendered article.
//
// Vercel serves a matching static file before it ever evaluates `rewrites`
// (scripts/prerender-meta.mjs writes one dist/blog/<slug>/index.html per live
// article), so any /blog/:slug request that reaches this function already has
// no such file — by construction, an invalid, typo'd, or no-longer-published
// slug, never a legitimate route. Retired Arabic duplicates never reach this
// function either: their 301s in vercel.json's `redirects` are evaluated
// before `rewrites`. This is why the fix is scoped to exactly /blog/:slug —
// every other client-only route (/textbook/:id, /pay/:id, /dashboard, ...) is
// never prerendered for ANY value, so reaching the SPA fallback there is
// normal, not an error, and stays on the generic catch-all untouched.
//
// A plain HTML response rather than the SPA shell: a dead blog URL needs no
// client-side interactivity, and this avoids bundling dist/app.html into a
// Lambda just to render the same "not found" message.
export default function handler(req, res) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Article Not Found | Klovers</title>
<meta name="robots" content="noindex, nofollow" />
</head>
<body>
<main style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 4rem auto; padding: 0 1.5rem; text-align: center;">
<h1>Article not found</h1>
<p>This blog post doesn't exist or has moved.</p>
<p><a href="/blog">Browse all articles</a> &middot; <a href="/">Go home</a></p>
</main>
</body>
</html>
`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.status(404).send(html);
}
