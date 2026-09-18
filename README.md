# arisaha13.github.io

Personal site, served via GitHub Pages. Source is a template (`index.template.html`) plus raw assets; a GitHub Actions workflow builds and deploys the static site on every push to `main`.

## How it's built

`scripts/build.js` runs on CI (`.github/workflows/deploy-pages.yml`) and:

- resizes/compresses photos from `Film/` and the header/about images into WebP via [sharp](https://sharp.pixelplumbing.com/), generating a `favicon.png` from `potato-favicon-src.webp`
- generates the photo gallery markup from `photos.json` and injects it into `index.template.html`
- minifies `styles.css` and `script.js` via [esbuild](https://esbuild.github.io/)
- outputs everything to `dist/`, which is what actually gets deployed to Pages

Nothing in `dist/` is committed — it's a build artifact, regenerated on every deploy.

## Adding a photo

**Via the CMS (recommended):** visit `/admin/` on the live site, log in with
GitHub, and drag a photo in through the editor. See
`cloudflare-worker/README.md` for one-time setup (a GitHub OAuth App + a
small Cloudflare Worker — everything else about the site stays static).

**Manually:**

1. Drop the file into `Film/`
2. Add one entry to `photos.json`:
   ```json
   {
     "file": "Film/IMG_1234.JPG",
     "camera": "Minolta X-7A",
     "film": "Fujifilm Superia X-Tra 400",
     "location": "Toronto",
     "country": "Canada"
   }
   ```
   (`film` can be omitted/`null` for fixed-film cameras like a disposable.)
3. Push — the build picks it up automatically, including the Country/Camera/Film gallery filters.

## Local development

```
npm install
npm run build   # writes the built site to dist/
```

Open `dist/index.html` directly in a browser (no server needed — everything's relative).

## Deployment

GitHub Pages is configured to deploy from **GitHub Actions** (Settings → Pages), not from a branch. Every push to `main` triggers `.github/workflows/deploy-pages.yml`, which builds and publishes `dist/`.
