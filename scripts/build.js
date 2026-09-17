// Build script: resizes/compresses source images and generates the static
// site into dist/. Run in CI (see .github/workflows/deploy-pages.yml) so the
// repo only ever stores original, full-resolution photos.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const FILM_SRC = path.join(ROOT, "Film");
const FILM_OUT = path.join(DIST, "Film");

const GALLERY_MAX_WIDTH = 1600;
const GALLERY_QUALITY = 78;

async function emptyDir(dir) {
  await fs.promises.rm(dir, { recursive: true, force: true });
  await fs.promises.mkdir(dir, { recursive: true });
}

function altFromCaption(caption) {
  // Captions are "<camera/film> / <location>"; use the location as alt text.
  return caption.split("/").pop().trim();
}

async function resizeToWebp(srcPath, destPath, maxWidth, quality) {
  await sharp(srcPath)
    .rotate() // auto-orient using EXIF, then strip it
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toFile(destPath);
}

async function buildGallery() {
  const manifest = JSON.parse(
    await fs.promises.readFile(path.join(ROOT, "photos.json"), "utf8")
  );

  await fs.promises.mkdir(FILM_OUT, { recursive: true });

  const items = [];
  for (const { file, caption } of manifest) {
    const srcPath = path.join(FILM_SRC, file);
    const outName = path.parse(file).name + ".webp";
    const outPath = path.join(FILM_OUT, outName);

    await resizeToWebp(srcPath, outPath, GALLERY_MAX_WIDTH, GALLERY_QUALITY);

    const alt = altFromCaption(caption);
    items.push(`        <li>
          <img src="Film/${outName}" alt="${alt}" loading="lazy" decoding="async" />
          <div class="overlay"><span>${caption}</span></div>
        </li>`);
  }

  return items.join("\n");
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
}

async function copyStaticFiles() {
  await fs.promises.copyFile(
    path.join(ROOT, "Resume-Saha-Aritra.pdf"),
    path.join(DIST, "Resume-Saha-Aritra.pdf")
  );
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

async function buildHtml(galleryHtml) {
  const template = await fs.promises.readFile(
    path.join(ROOT, "index.template.html"),
    "utf8"
  );
  const html = template.replace("<!-- GALLERY_ITEMS -->", galleryHtml);
  await fs.promises.writeFile(path.join(DIST, "index.html"), html);
}

async function main() {
  await emptyDir(DIST);
  const [galleryHtml] = await Promise.all([
    buildGallery(),
    buildStaticImages(),
    copyStaticFiles(),
    buildAssets(),
  ]);
  await buildHtml(galleryHtml);
  console.log(`Built site into ${path.relative(ROOT, DIST)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
