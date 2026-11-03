# mirastacklabs-ai.github.io (retired)

The MIRASTACK LABS website moved to **https://www.mirastacklabs.ai** (Cloudflare Pages; source in the endlesstokens repo, `mirastacklabs/website/`).

This repo only keeps the bare domain `mirastacklabs.ai` pointing at the new site until DNS moves to Cloudflare:
`site/index.html` and `site/404.html` forward every old address to its new home (old docs and products to their successors,
old blog posts to `/blog/`, everything else to the same path). The old Jekyll site is in the git history.

After the DNS move (runbook: `docs/marketing/mirastacklabs-website/dns-cutover-runbook.md` in the endlesstokens repo),
remove the custom domain in Settings > Pages and archive this repo.
