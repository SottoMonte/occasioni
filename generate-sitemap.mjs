import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const siteUrl = "https://occasioni.online";

async function readPublishedIds(filePath, collectionName) {
  const data = JSON.parse(await readFile(path.join(root, filePath), "utf8"));
  return (data[collectionName] || [])
    .filter((item) => item.published === true && item.id)
    .map((item) => item.id);
}

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function detailUrl(page, id) {
  const url = new URL(page, `${siteUrl}/`);
  url.searchParams.set("id", id);
  return url.href;
}

const [articleIds, programIds] = await Promise.all([
  readPublishedIds("data/articles.json", "articles"),
  readPublishedIds("data/programs.json", "programs"),
]);

const urls = [
  `${siteUrl}/`,
  `${siteUrl}/guide.html`,
  `${siteUrl}/opportunita.html`,
  ...articleIds.map((id) => detailUrl("articolo.html", id)),
  ...programIds.map((id) => detailUrl("programma.html", id)),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

await writeFile(path.join(root, "sitemap.xml"), sitemap);
console.log(`Sitemap generata: ${urls.length} URL.`);