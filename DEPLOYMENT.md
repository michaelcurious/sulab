# Deployment Plan for sulabcu.com

Recommended production setup:

1. Put this folder in a GitHub repository, for example `sulabcu.com`.
2. Deploy the repository with Cloudflare Workers Static Assets or Cloudflare Pages.
3. Add `sulabcu.com` as a custom domain in Cloudflare.
4. In GoDaddy DNS, replace the parked `A` record with the records Cloudflare gives you.
5. Protect `/su-edit-portal` with Cloudflare Access or Decap/GitHub authentication.

## Cloudflare Workers Static Assets

The repo includes `wrangler.toml`, so Cloudflare's Workers Git flow can deploy it
with:

```text
npx wrangler deploy
```

The static assets directory is the repository root. `.assetsignore` prevents
development and deployment metadata from being uploaded as public files.

## Admin security

The code gate in `su-edit-portal/index.html` is only a prototype preview. It
should not be treated as real security because static site files are visible to
visitors.

For production, use one of these:

- Cloudflare Access: require an email one-time PIN or allowed Google/GitHub account before `/su-edit-portal` loads.
- Decap CMS with GitHub OAuth: invited editors log in and changes are committed to GitHub.
- Both together: Cloudflare Access protects `/admin`, Decap/GitHub controls who can publish changes.

## GoDaddy DNS

Your current domain appears parked. When Cloudflare Pages gives DNS instructions,
you will usually create either:

- `CNAME` record for `www` pointing to the Cloudflare Pages hostname.
- `A`, `AAAA`, or flattened `CNAME`/alias for `@`, depending on the DNS provider instructions.

Use the exact target values Cloudflare Pages shows for the project.
