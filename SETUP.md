# Margin with Workers AI

Use cloudflare/worker.mjs in the Cloudflare dashboard. Keep it out of the GitHub Pages folder. github-pages/ contains the complete portfolio. You only need to replace margin.js, index.html, work.html and about.html if your existing site is current.

1. Sign in to the Cloudflare dashboard and stay on Workers Free.
2. In D1 SQL Database, create margin-rate. Open its Console and execute:

```sql
CREATE TABLE IF NOT EXISTS margin_rate (
  ip_key TEXT PRIMARY KEY,
  bucket INTEGER NOT NULL,
  hits INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS margin_rate_bucket ON margin_rate(bucket);
```

3. In Workers & Pages, create and deploy a Hello World Worker named margin-chat. In its Bindings tab, add Workers AI as AI and your D1 database as RATE_DB.
4. Open Edit Code. Paste the entire Worker file over the Hello World code. Set SITE_FACTS.email and fill in the other SITE_FACTS fields using your portfolio. Keep this block under about 1,500 words. Click Deploy.
5. Copy the Worker’s production workers.dev URL into WORKER_URL near the top of github-pages/margin.js. Set CONTACT_EMAIL to match SITE_FACTS.email. Upload the four changed front-end files, or the contents of github-pages/, to the GitHub Pages publishing folder.
6. Open https://spacyg.github.io/nafizkhan/ and ask Margin what Nafiz writes. The Worker accepts POST from that origin. If you open its address directly, an error is expected because the browser makes a GET request with no Origin header.

The Worker uses the Workers AI binding and does not require an external AI key. D1 stores rate counters, not conversations. Keep Workers Free selected to avoid overage charges. Chat calls can fail after daily limits are reached. The fallback email remains available.
