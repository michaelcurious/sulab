# Su Lab Website Prototype

This is a static, CMS-ready prototype for `sulabcu.com`.

## Preview locally

```powershell
node server.mjs
```

Then open `http://localhost:4173`.

## Editing model

- Public pages are static files.
- Publications live in `content/publications.txt`; one citation per paragraph.
- Any PMID in the citation becomes a PubMed link automatically.
- Images for future editors should go in `content/uploads`.
- `su-edit-portal/config.yml` is a Decap CMS starter config. Before publishing, change
  `your-github-username/sulabcu.com` to the real GitHub repository.

## Hosting recommendation

Use GitHub plus Cloudflare Pages. Give the future editor access through GitHub
or Decap CMS authentication, and keep the site free of VPS maintenance.
