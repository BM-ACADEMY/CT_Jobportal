# Job pages and sitemap for Google and WhatsApp, when the website runs on our own server (nginx)

The files in `client/api/` (job page and sitemap) only run on Vercel. The live site is served from the Hostinger server, so
nothing was adding a job's own title, description and JobPosting data to the page: every job link showed the homepage's tags.
This adds the same logic to the Node server and sends two kinds of addresses to it.

## What was added
- `server/utils/seoPages.js`: builds the page (title, description, canonical keyword URL, Open Graph, JobPosting) and the sitemap.
- `server/routes/seoRoutes.js`, mounted at `/seo`: `GET /seo/job/<slug>` and `GET /seo/sitemap.xml`.
- Rules, same as `client/api/job.js`: an old `/job/<id>` link or a changed title answers 301 to the keyword link; a closed or expired job stays up with
  "position filled" and noindex; a missing job is noindex; the page falls back to the plain app if anything fails.
- Every answer carries `X-Velaivaaipu-SEO: job | redirect | closed | unavailable | shell-no-id | shell-error`.
- Tests: `server/tests/auth/seoPages.test.js` (9).

## Server env
- `SITE_URL=https://velaivaaipu.in` (default is the same).
- `API_PUBLIC_URL=https://api.velaivaaipu.in` (already used by mail; used for company logos).
- `CLIENT_INDEX_PATH=/full/path/to/the/built/client/dist/index.html` (recommended). If it is not set the server fetches `https://velaivaaipu.in/` once every 5 minutes instead.
Restart the server after setting them.

## nginx (on the site's server block for velaivaaipu.in)
Add these two blocks. Use the port the Node server runs on (`PORT`, default 5000). Keep the existing rule that sends other paths to `index.html`.

```nginx
# Job pages: the app with the job's own SEO tags
location ~ ^/job/([^/]+)$ {
    proxy_pass http://127.0.0.1:5000/seo/job/$1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Sitemap from the database (jobs and companies)
location = /sitemap.xml {
    proxy_pass http://127.0.0.1:5000/seo/sitemap.xml;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
If the Node server is not on the same machine as the website, use `proxy_pass https://api.velaivaaipu.in/seo/job/$1;` with `proxy_ssl_server_name on;` and `proxy_set_header Host api.velaivaaipu.in;`.
If a static `sitemap.xml` file exists in the site folder, remove it so the database one is used.
Test the config (`nginx -t`) and reload (`systemctl reload nginx`). Keep the old config to roll back.

## Check
1. `curl -sI https://velaivaaipu.in/job/<any job link> | grep -i x-velaivaaipu-seo` should say `job` (or `redirect` for an old link).
2. `curl -s https://velaivaaipu.in/job/<link> | grep -i -E "<title>|canonical|JobPosting"` shows the job's own title, the keyword URL and JobPosting.
3. `https://velaivaaipu.in/sitemap.xml` lists job links like `/job/telecaller-puducherry-<id>`.
4. Google Rich Results Test on one job link finds a JobPosting. Paste a job link in WhatsApp: the preview shows the job's title.
5. Search Console: submit `https://velaivaaipu.in/sitemap.xml`.

## Main public pages (added in branch seo-page-tags)
Without this, `/jobs/chennai`, `/for-colleges` and the other public pages send the homepage title and canonical in the raw HTML until JavaScript runs.
Add this block next to the two above (the regex lists exactly the pages the server knows; anything else keeps the plain app):

```nginx
location ~ ^/(jobs|internships|drives|companies|how-it-works|plans|contact|blog|for-colleges|for-companies|for-recruiters|free-assessment|job-post-templates|terms|privacy-policy|refund-policy|jobs/(pondicherry|chennai|villupuram|cuddalore))/?$ {
    proxy_pass http://127.0.0.1:5000/seo/page/$1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location = / {
    proxy_pass http://127.0.0.1:5000/seo/page;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```
Check: `curl -sI https://velaivaaipu.in/for-colleges | grep -i x-velaivaaipu-seo` says `page`; `curl -s https://velaivaaipu.in/for-colleges | grep -i canonical` shows `/for-colleges`, not the homepage.
City pages with fewer than 10 public jobs answer `page-thin` (noindex) and are left out of the sitemap. Change the number with `CITY_PAGE_MIN_JOBS` (0 turns the rule off). Roll back by removing the two blocks.

## Roll back
Remove the two nginx blocks and reload. The site goes back to serving the plain app for every address. Nothing else depends on this.
