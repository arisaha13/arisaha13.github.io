// Build script: resizes/compresses source images and generates the static
// site into dist/. Run in CI (see .github/workflows/deploy-pages.yml) so the
// repo only ever stores original, full-resolution photos.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FILM_OUT = path.join(DIST, "Film");

const GALLERY_MAX_WIDTH = 1600;
const GALLERY_QUALITY = 78;

async function emptyDir(dir) {
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function captionFor({ camera, film, location, country }) {
  const parts = film ? [camera, film] : [camera];
  return `${parts.join(" / ")} / ${location}, ${country}`;
}

async function resizeToWebp(srcPath, destPath, maxWidth, quality) {
  await sharp(srcPath)
    .rotate() // auto-orient using EXIF, then strip it
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(destPath);
}

function buildFilterOptions(manifest, key) {
  const values = [...new Set(manifest.map((p) => p[key]).filter(Boolean))].sort();
  return values
    .map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`)
    .join("\n            ");
}

function buildFilterBar(manifest) {
  const facets = [
    ["country", "Country"],
    ["camera", "Camera"],
    ["film", "Film"],
  ];
  return facets
    .map(
      ([key, label]) => `      <div class="filter">
        <label for="filter-${key}">${label}</label>
        <select id="filter-${key}" data-filter-key="${key}">
          <option value="">All</option>
          ${buildFilterOptions(manifest, key)}
        </select>
      </div>`
    )
    .join("\n");
}

async function buildGallery() {
  const manifest = JSON.parse(
    await fs.promises.readFile(path.join(ROOT, "photos.json"), "utf8")
  );

  await fs.promises.mkdir(FILM_OUT, { recursive: true });

  const items = [];
  for (const photo of manifest) {
    const { file, camera, film, location, country } = photo;
    const srcPath = path.join(ROOT, file);
    const outName = path.parse(file).name + ".webp";
    const outPath = path.join(FILM_OUT, outName);

    await resizeToWebp(srcPath, outPath, GALLERY_MAX_WIDTH, GALLERY_QUALITY);

    const caption = captionFor(photo);
    const alt = `${location}, ${country}`;
    items.push(`        <li data-country="${escapeHtml(country)}" data-camera="${escapeHtml(camera)}" data-film="${escapeHtml(film || "")}">
          <button type="button" class="gallery-item" aria-label="View photo: ${escapeHtml(caption)}">
            <img src="Film/${outName}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">
          </button>
          <div class="overlay"><span>${escapeHtml(caption)}</span></div>
        </li>`);
  }

  return { galleryHtml: items.join("\n"), filterBarHtml: buildFilterBar(manifest) };
}

async function buildStaticImages() {
  await sharp(path.join(ROOT, "IMG_1741_edited.JPG"))
    .rotate()
    .resize({ width: 200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(path.join(DIST, "avatar.webp"));

  await sharp(path.join(ROOT, "251E95A0-0679-40AE-B32F-CD9900DF96BE.jpg"))
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(DIST, "about.webp"));

  await sharp(path.join(ROOT, "potato-favicon-src.webp"))
    .resize(192, 192, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(DIST, "favicon.png"));
}

async function copyStaticFiles() {
  await fs.promises.copyFile(
    path.join(ROOT, "Resume-Saha-Aritra.pdf"),
    path.join(DIST, "Resume-Saha-Aritra.pdf")
  );
  await fs.promises.cp(path.join(ROOT, "admin"), path.join(DIST, "admin"), {
    recursive: true,
  });
}

async function buildAssets() {
  await esbuild.build({
    entryPoints: [path.join(ROOT, "styles.css")],
    outfile: path.join(DIST, "styles.css"),
    minify: true,
  });
  await esbuild.build({
    entryPoints: [path.join(ROOT, "script.js")],
    outfile: path.join(DIST, "script.js"),
    minify: true,
  });
}

async function buildHtml(galleryHtml, filterBarHtml) {
  const template = await fs.promises.readFile(
    path.join(ROOT, "index.template.html"),
    "utf8"
  );
  const html = template
    .replace("<!-- FILTER_BAR -->", filterBarHtml)
    .replace("<!-- GALLERY_ITEMS -->", galleryHtml);
  await fs.promises.writeFile(path.join(DIST, "index.html"), html);
}

async function main() {
  await emptyDir(DIST);
  const [gallery] = await Promise.all([
    buildGallery(),
    buildStaticImages(),
    copyStaticFiles(),
    buildAssets(),
  ]);
  await buildHtml(gallery.galleryHtml, gallery.filterBarHtml);
  console.log(`Built site into ${path.relative(ROOT, DIST)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
