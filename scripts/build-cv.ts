/**
 * Generates public/cv/CV-PL.pdf and CV-EN.pdf from /pl/cv?print and
 * /en/cv?print (Chromium via Playwright). Runs before `next build` (prebuild).
 *
 * - On Vercel/CI it does nothing: Chromium isn't there, the committed PDFs are used.
 *   After a change of the CV content: build locally and commit public/cv/CV-*.pdf.
 * - Server: CV_BASE_URL if set; otherwise its own `next dev` on a free port, or
 *   the dev server of this project that is already running (Next allows one).
 * - Fails when a CV doesn't fit on exactly one A4 page or a font isn't embedded.
 * - Metadata (title, author, subject, language) from the page, written with pdf-lib.
 *   A PDF whose content didn't change is not rewritten (no git churn).
 *
 * Run: node scripts/build-cv.ts   (Node ≥ 22.18 runs TypeScript directly)
 */
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { chromium } from "@playwright/test";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";

const ROOT = resolve(import.meta.dirname, "..");
const LANGS = ["pl", "en"] as const;
/** Every CV must be set in the site fonts, embedded. */
const FONTS = ["SchibstedGrotesk", "JetBrainsMono"];

const log = (msg: string) => console.log(`[cv] ${msg}`);

async function main() {
  if (process.env.VERCEL || process.env.CI) {
    log("CI/Vercel: skipped, the committed public/cv/CV-*.pdf are used.");
    return;
  }
  const server = process.env.CV_BASE_URL ? { url: process.env.CV_BASE_URL, stop: () => {} } : await startDev();
  const browser = await chromium.launch().catch((error: Error) => {
    server.stop();
    throw new Error(`Chromium for Playwright is missing – run: pnpm exec playwright install chromium\n${error.message}`);
  });
  try {
    for (const lang of LANGS) await printCv(browser, server.url, lang);
  } finally {
    await browser.close();
    server.stop();
  }
}

async function printCv(browser: Awaited<ReturnType<typeof chromium.launch>>, base: string, lang: (typeof LANGS)[number]) {
  const page = await browser.newPage();
  await page.emulateMedia({ media: "print", reducedMotion: "reduce" });
  const url = `${base}/${lang}/cv?print`;
  const response = await page.goto(url, { waitUntil: "load", timeout: 180_000 });
  if (!response?.ok()) throw new Error(`${url} → HTTP ${response?.status()}`);

  // the e-mail is assembled after hydration; fonts and the photo must be in
  await page.waitForSelector("[data-cv-sheet] a[href^='mailto:']", { timeout: 60_000 });
  const info = await page.evaluate(async () => {
    await document.fonts.ready;
    const sheet = document.querySelector<HTMLElement>("[data-cv-sheet]")!;
    await Promise.all([...sheet.querySelectorAll("img")].map((img) => img.decode().catch(() => {})));
    const meta = (name: string) => document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? "";
    return {
      title: document.title,
      author: meta("author"),
      subject: meta("description"),
      overflowPx: sheet.scrollHeight - sheet.clientHeight,
    };
  });
  if (info.overflowPx > 1) {
    throw new Error(`CV ${lang.toUpperCase()} is ${(info.overflowPx / 3.7795).toFixed(1)} mm too long for one A4 page.`);
  }

  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, tagged: true });
  await page.close();

  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  if (doc.getPageCount() !== 1) throw new Error(`CV ${lang.toUpperCase()} has ${doc.getPageCount()} pages, expected 1.`);
  checkFonts(doc, lang);

  const file = join(ROOT, "public", "cv", `CV-${lang.toUpperCase()}.pdf`);
  const stamp = async (date: Date) => {
    doc.setTitle(info.title, { showInWindowTitleBar: true });
    doc.setAuthor(info.author);
    doc.setSubject(info.subject);
    doc.setLanguage(lang);
    doc.setCreator("GOVO DIGITAL · scripts/build-cv.ts");
    doc.setProducer("Chromium + pdf-lib");
    doc.setCreationDate(date);
    doc.setModificationDate(date);
    return Buffer.from(await doc.save());
  };

  // same content as the committed file → keep it (its date included)
  if (existsSync(file)) {
    const old = readFileSync(file);
    const date = (await PDFDocument.load(old, { updateMetadata: false })).getCreationDate();
    if (date && (await stamp(date)).equals(old)) {
      log(`${file} unchanged`);
      return;
    }
  }
  writeFileSync(file, await stamp(new Date()));
  log(`${file} written`);
}

/**
 * Every font is embedded and the CV uses the site fonts. Chromium writes
 * variable fonts as Type3 (glyphs as vector procedures inside the PDF, no
 * FontFile); other fonts must carry a FontFile* in their descriptor.
 */
function checkFonts(doc: PDFDocument, lang: string) {
  const name = (key: string) => PDFName.of(key);
  const names: string[] = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFDict) || obj.get(name("Type")) !== name("Font")) continue;
    const subtype = obj.get(name("Subtype"));
    if (subtype === name("Type0")) continue; // checked through its descendant CIDFont
    const descriptor = obj.lookupMaybe(name("FontDescriptor"), PDFDict);
    const label = String(obj.get(name("BaseFont")) ?? descriptor?.get(name("FontName")) ?? obj.get(name("Name")) ?? "?");
    names.push(label);
    if (subtype === name("Type3")) {
      if (!obj.has(name("CharProcs"))) throw new Error(`CV ${lang.toUpperCase()}: Type3 font ${label} has no glyphs.`);
      continue;
    }
    const embedded = ["FontFile", "FontFile2", "FontFile3"].some((key) => descriptor?.has(name(key)));
    if (!embedded) throw new Error(`CV ${lang.toUpperCase()}: font ${label} is not embedded.`);
  }
  const missing = FONTS.filter((font) => !names.some((n) => n.replace(/[-\s]/g, "").includes(font)));
  if (missing.length) throw new Error(`CV ${lang.toUpperCase()}: ${missing.join(", ")} not used (fonts: ${names.join(", ")}).`);
}

/** `next dev` on a free port, or the dev server of this project that is already running. */
async function startDev(): Promise<{ url: string; stop: () => void }> {
  const port = await freePort();
  const child: ChildProcess = spawn(process.execPath, [join(ROOT, "node_modules/next/dist/bin/next"), "dev", "--port", String(port)], {
    cwd: ROOT,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stop = () => {
    if (child.exitCode === null) child.kill();
  };
  process.once("exit", stop);

  let output = "";
  // colours stripped: under Playwright's webServer Next may print ANSI codes
  const collect = (chunk: Buffer) => (output += chunk.toString().replace(/\x1b\[[0-9;]*m/g, ""));
  child.stdout!.on("data", collect);
  child.stderr!.on("data", collect);
  // "close" comes after the last output of an exited process (exitCode alone can be early)
  let closed = false;
  child.once("close", () => (closed = true));
  const own = `http://localhost:${port}`;
  const deadline = Date.now() + 120_000;
  let url: string | null = null;
  while (!url) {
    // Next prints "Ready" before it notices another dev server: trust the answer, not the log
    const running = /already running[\s\S]*?Local:\s+(http\S+)/.exec(output);
    if (running) {
      log(`using the running dev server ${running[1]}`);
      url = running[1];
    } else if (await fetch(`${own}/pl`).then((r) => r.ok, () => false)) {
      url = own;
    } else if (closed || Date.now() > deadline) {
      throw new Error(`next dev did not start:\n${output}`);
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return { url, stop };
}

function freePort(): Promise<number> {
  return new Promise((done, fail) => {
    const server = createServer();
    server.once("error", fail);
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      server.close(() => done(port));
    });
  });
}

main().catch((error: Error) => {
  console.error(`[cv] ${error.message}`);
  process.exit(1);
});
