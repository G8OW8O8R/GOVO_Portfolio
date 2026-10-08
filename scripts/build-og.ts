/**
 * Share image of the site (Open Graph / Twitter, 1200×630): the character as
 * on the desktop (public/character/base.jpg) on the desktop's light ground,
 * the logo (public/brand/logo.svg) and one line in both languages' words.
 * Static file public/og.jpg; projects have their own (public/projects/<slug>/og.jpg).
 * Run after changing the character or the logo, then commit the file:
 *   node scripts/build-og.ts
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const OUT = "public/og.jpg";
const root = pathToFileURL(`${process.cwd()}/`).href;
// the one site address (content/profile/contact.ts), without the protocol and "www." (as on the CV)
const site = /SITE_URL = "https?:\/\/(?:www\.)?([^"]+)"/.exec(fs.readFileSync("content/profile/contact.ts", "utf8"))![1];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Schibsted";src:url("${root}public/fonts/cv/SchibstedGrotesk-Medium.ttf")}
@font-face{font-family:"JetBrains";src:url("${root}public/fonts/cv/JetBrainsMono-Regular.ttf")}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{position:relative;color:#111;
  background:radial-gradient(120% 90% at 66% 28%,#e6e5e6 0%,#dedddf 55%,#d6d5d7 100%)}
/* the character: same picture as the desktop, head and pendant in frame, right of centre */
.character{position:absolute;width:1400px;left:120px;top:-36px;
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18%);mask-image:linear-gradient(90deg,transparent 0,#000 18%)}
.copy{position:absolute;left:72px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:28px}
.logo{width:330px;display:block}
.line{font:500 30px/1.25 "Schibsted";letter-spacing:-0.02em;max-width:12em;margin:0}
.mono{font:400 18px/1 "JetBrains";color:#62615e;letter-spacing:-0.01em;margin:0}
</style></head><body>
<img class="character" src="${root}public/character/base.jpg" alt="">
<div class="copy">
  <img class="logo" src="${root}public/brand/logo.svg" alt="">
  <p class="line">Piotr Goworek<br>Frontend developer</p>
  <p class="mono">${site}</p>
</div>
</body></html>`;

fs.mkdirSync(".tmp", { recursive: true });
const page = path.resolve(".tmp/og.html");
fs.writeFileSync(page, html);
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.goto(pathToFileURL(page).href);
await tab.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode()));
});
await tab.screenshot({ path: OUT, type: "jpeg", quality: 88 });
await browser.close();
console.log(`og: ${OUT} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
