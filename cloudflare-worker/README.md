# CMS OAuth worker

A small Cloudflare Worker that lets Decap CMS (`/admin/` on the live site)
authenticate against GitHub. This is the one non-static piece of the site —
everything else is served straight from GitHub Pages.

It does nothing but the OAuth code exchange: redirect to GitHub, exchange
the returned code for an access token using the OAuth App's client secret
(which must stay server-side), and hand that token back to the CMS popup.
It never touches your repo directly — Decap uses the token to call the
GitHub API itself, so **only accounts with push access to this repo can
actually save anything**, regardless of who opens `/admin/`.

## One-time setup

You'll need a free [Cloudflare](https://dash.cloudflare.com/sign-up) account
and the `wrangler` CLI (`npm install -g wrangler`, or `npx wrangler`).

**1. Deploy the worker once to get its URL** (secrets aren't set yet — that's fine, `/auth` and `/callback` just won't work until step 3):

```
cd cloudflare-worker
wrangler login
wrangler deploy
```

This prints a URL like `https://arisaha13-cms-oauth.<your-subdomain>.workers.dev`. Copy it.

**2. Create a GitHub OAuth App** at
[github.com/settings/developers](https://github.com/settings/developers) →
OAuth Apps → New OAuth App:

- **Homepage URL**: `https://arisaha13.github.io/`
- **Authorization callback URL**: `<worker URL from step 1>/callback`

Register it, then generate a client secret. Copy both the **Client ID** and
the **Client Secret**.

**3. Set the worker's secrets**:

```
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

(paste each value when prompted — secrets don't need a redeploy to take effect)

**4. Point the CMS at the worker**: edit `admin/config.yml` in the repo root,
set `backend.base_url` to the worker URL from step 1, commit, and push.

## Using it

Visit `https://arisaha13.github.io/admin/`, click in, authorize with
GitHub, and you'll get Decap's editor UI for the `photos.json` collection —
drag an image in, fill in camera/film/location/country, publish. That
commits straight to `main`, which triggers the existing
`deploy-pages.yml` workflow (resize/optimize via `scripts/build.js`, same
as any other photo).

## Local testing

`wrangler dev` runs the worker locally, but the OAuth App's callback URL is
fixed to the deployed worker's origin, so testing the full flow requires
the real deployed worker — there's no way to exercise the live GitHub
redirect against `localhost`.
