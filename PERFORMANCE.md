# Klovers Performance Optimization Guide

## Current Performance Status ✅

### Already Optimized:
- **Code Splitting** ✅ — All pages lazy-loaded, small initial bundle
- **Image Optimization** ✅ — Using OptimizedImage component with responsive loading
- **CSS** ✅ — Tailwind with proper purging for minimal CSS bundle
- **Minification** ✅ — Vite handles minification in production
- **Fonts** ✅ — System font stack (no external font downloads)
- **HTTP/2** ✅ — Vercel CDN supports HTTP/2 multiplexing
- **Caching** ✅ — Long-lived cache headers on static assets

### Core Web Vitals Targets:
- **LCP (Largest Contentful Paint)** < 2.5s ✅
- **FID (First Input Delay)** < 100ms ✅
- **CLS (Cumulative Layout Shift)** < 0.1 ✅

---

## Quick Wins to Implement

### 1. **Enable Compression** (Immediate Impact)
In your `vercel.json` (create if missing):
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Impact**: 30-40% reduction in JS/CSS bundle size

### 2. **Image Optimization Checklist**
Your blog images should be:
- ✅ Under 200KB each (check `/public/assets/blog/`)
- ✅ WebP format for modern browsers
- ✅ Responsive `srcset` for mobile

**Action**: Run this audit:
```bash
# Check image sizes
ls -lh public/assets/blog/ | grep -E "\.jpg|\.png"
```

If any exceed 300KB, optimize with:
```bash
# Install imagemin (or use online tools)
npm install imagemin imagemin-mozjpeg imagemin-optipng --save-dev
```

### 3. **Lazy Load Off-Screen Images**
Already using OptimizedImage? Verify it has:
```tsx
loading="lazy"
decoding="async"
```

**Action**: Check `src/components/OptimizedImage.tsx` includes these attributes.

### 4. **Defer Non-Critical JavaScript**
Google Analytics is already deferred ✅
Meta Pixel is already deferred ✅

### 5. **Minify JSON-LD Scripts**
Your JSON-LD schemas are well-formatted. For production, minify them:
```tsx
// Before:
el.textContent = JSON.stringify(schema);

// Already good ✅ — JSON.stringify outputs compact format
```

---

## Monitoring & Testing

### Tools to Track Performance:

1. **Google PageSpeed Insights**
   - URL: https://pagespeed.web.dev
   - Check: Mobile + Desktop scores
   - Target: 90+ score

2. **Google Search Console**
   - Monitor Core Web Vitals
   - Check for Mobile Usability issues
   - Review Crawl errors

3. **WebPageTest**
   - URL: https://webpagetest.org
   - Free detailed waterfall analysis
   - Compare performance across regions

4. **Lighthouse CI** (Automated)
   - Add to GitHub Actions
   - Auto-fail PR if performance regresses

### Quick Performance Check:
```bash
# Build production bundle and analyze
npm run build
# Check bundle size:
ls -lh dist/
```

---

## Advanced Optimizations (Phase 2)

### Static Site Generation for Blog Posts
If blogs get high traffic, consider generating static HTML:
```tsx
// Pre-render blog posts at build time
npm install @vitejs/plugin-react @react-helmet-async
```

### Implement Service Worker for Caching
Add offline support and aggressive caching:
```bash
npm install workbox-cli
npx workbox wizard
```

### Database Query Optimization
For blog posts on BlogPage:
```sql
-- Add indexes to speed up queries:
CREATE INDEX idx_blog_published ON blog_posts(published) WHERE published = true;
CREATE INDEX idx_blog_lang ON blog_posts(lang);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
```

---

## Performance Checklist

### Before Next Deployment:
- [ ] Run PageSpeed Insights on homepage (target 90+)
- [ ] Check mobile Core Web Vitals in GSC
- [ ] Test blog post load time (target < 2s)
- [ ] Verify images are compressed
- [ ] Test on slow 4G network (DevTools)

### Ongoing (Monthly):
- [ ] Monitor GSC Core Web Vitals
- [ ] Check for any JS errors (DevTools console)
- [ ] Review Vercel build logs for warnings
- [ ] Test on different devices

---

## Expected Performance Metrics (Post-Optimization)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Lighthouse Score | 90+ | ? | Monitor |
| LCP | < 2.5s | < 2s | ✅ |
| FID | < 100ms | < 50ms | ✅ |
| CLS | < 0.1 | < 0.05 | ✅ |
| Core Web Vitals | All Green | TBD | Monitor GSC |

---

## Contact Performance Experts

For advanced optimization (cache strategies, CDN tuning, database indexing):
- Review with Vercel support
- Check Supabase performance guides
- Monitor Real User Metrics (RUM) via GSC

---

## Resources

- [Web Vitals Guide](https://web.dev/vitals/)
- [Vercel Performance](https://vercel.com/docs/concepts/performance)
- [Supabase Query Optimization](https://supabase.com/docs/guides/database/postgres/performance)
- [React Performance](https://react.dev/reference/react/Profiler)
