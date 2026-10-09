/**
 * Favicon from the logo's own owl eyes (#govo-eye-L/R in public/brand/logo.svg),
 * white on the brand's black, moved closer together so they read at 16–32 px.
 * Writes app/icon.svg, app/icon1.png (32 px), app/apple-icon.png (180 px,
 * opaque full bleed – iOS rounds it itself) and public/icon-192.png,
 * icon-512.png for the web app manifest (app/manifest.ts; full bleed, the eyes
 * inside the maskable safe zone, the middle 80 %). Run after changing the logo:
 *   pnpm favicon
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
const logo = fs.readFileSync("public/brand/logo.svg", "utf8");
const d = (id: string): string => new RegExp(`id="${id}"[^>]* d="([^"]+)"`).exec(logo)![1];
const eyes = [
  { d: d("govo-eye-L"), cx: 386 + 106 / 2 },
  { d: d("govo-eye-R"), cx: 833 + 107 / 2 },
];
const CY = 121 + 120 / 2;
function icon({ size = 64, radius = 14, eye = 23, gap = 4 } = {}): string {
  const s = eye / 107;
  const r = (v: number) => Math.round(v * 1000) / 1000;
  const g = eyes
    .map((e, i) => {
      const x = size / 2 + (i === 0 ? -1 : 1) * (eye / 2 + gap / 2);
      return `<path transform="translate(${r(x - e.cx * s)} ${r(size / 2 - CY * s)}) scale(${r(s)})" d="${e.d}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}"${radius ? ` rx="${radius}"` : ""} fill="#111"/><g fill="#fff" fill-rule="evenodd">${g}</g></svg>\n`;
}
const fav = icon();
fs.writeFileSync("app/icon.svg", fav);
const b = await chromium.launch();
const p = await b.newPage();
async function png(svg: string, px: number, out: string) {
  await p.setViewportSize({ width: px, height: px });
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${px}px;height:${px}px}</style>${svg}`);
  await p.screenshot({ path: out, omitBackground: true });
}
await png(fav, 32, "app/icon1.png");
await png(icon({ radius: 0, eye: 25, gap: 4 }), 180, "app/apple-icon.png");
const maskable = icon({ radius: 0, eye: 21, gap: 4 });
await png(maskable, 192, "public/icon-192.png");
await png(maskable, 512, "public/icon-512.png");
// preview at real sizes on light and dark tab strips
await p.setViewportSize({ width: 420, height: 120 });
const img = (px: number) => `<img src="data:image/svg+xml;base64,${Buffer.from(fav).toString("base64")}" width="${px}" height="${px}">`;
await p.setContent(`<body style="margin:0;display:grid;grid-template-columns:1fr 1fr;height:120px">${["#dee1e6", "#202124"].map((bg) => `<div style="background:${bg};display:flex;gap:14px;align-items:center;justify-content:center">${img(16)}${img(32)}<img src="data:image/png;base64,${fs.readFileSync("app/icon1.png").toString("base64")}" width="32"><img src="data:image/png;base64,${fs.readFileSync("app/apple-icon.png").toString("base64")}" width="60"></div>`).join("")}</body>`);
fs.mkdirSync(".tmp", { recursive: true });
await p.screenshot({ path: ".tmp/favicon-preview.png" });
await b.close();
console.log(`favicon: app/icon.svg (${fav.length} B), app/icon1.png, app/apple-icon.png, public/icon-192.png, icon-512.png; preview .tmp/favicon-preview.png`);
