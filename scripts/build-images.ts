/**
 * Static picture variants (lib/image-groups.ts): for every source in the
 * groups, AVIF and WebP (or the group's formats) in its widths, cropped to its frame, plus
 * a ~16 px blurred placeholder. Files: public/img/<source path>.<hash>.<width>.<avif|webp>
 * (the hash covers the source and the settings, so a changed picture gets a
 * new name and the old one may be cached forever); list: lib/images.generated.json.
 * Files no longer listed are removed. Run after adding or changing a picture:
 *   pnpm images
 * sharp comes with Next.js (no own dependency).
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ImageEntry, ImageGroup, ImageGroupName, ImageManifest } from "../lib/image-groups";

/** The part of sharp used here (it is Next.js's dependency, so no types of its own here). */
type Pipeline = {
  metadata(): Promise<{ width?: number; height?: number }>;
  extract(region: { left: number; top: number; width: number; height: number }): Pipeline;
  resize(options: { width: number; kernel?: string }): Pipeline;
  blur(sigma: number): Pipeline;
  avif(options: { quality: number; effort: number }): Pipeline;
  webp(options: { quality: number; effort?: number }): Pipeline;
  toFile(file: string): Promise<unknown>;
  toBuffer(): Promise<Buffer>;
};
type Sharp = ((input: Buffer) => Pipeline) & { versions: { sharp: string } };
const sharp: Sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");

// the groups file has no imports, so Node loads it as it is
const groupsModule = await import(pathToFileURL(path.resolve("lib/image-groups.ts")).href);
const IMAGE_GROUPS: Record<ImageGroupName, ImageGroup> = groupsModule.IMAGE_GROUPS;
const variantPath: (key: string, hash: string, width: number, format: "avif" | "webp") => string = groupsModule.variantPath;

const PUBLIC = "public";
const OUT = path.join(PUBLIC, "img");
const MANIFEST = "lib/images.generated.json";
/** Encoder settings; changing them renames every file. */
const ENCODE = {
  avif: { quality: 55, effort: 7 },
  webp: { quality: 80, effort: 6 },
  placeholder: { width: 16, quality: 40 },
} as const;
const SOURCE = /\.(png|jpe?g)$/i;

function sources(group: ImageGroup): { key: string; file: string }[] {
  const dir = path.join(PUBLIC, group.dir);
  const files = fs.readdirSync(dir).filter((f) => SOURCE.test(f));
  const pick = group.names
    ? group.names.map((name) => {
        const file = files.find((f) => f.replace(SOURCE, "") === name);
        if (!file) throw new Error(`Missing source ${group.dir}/${name}.(png|jpg)`);
        return file;
      })
    : files.filter((f) => !group.exclude?.test(f));
  return pick.map((file) => ({ key: `${group.dir}/${file.replace(SOURCE, "")}`, file: path.join(dir, file) }));
}

/** Region of the source that fills the frame like object-fit: cover (object-position x %, centred vertically). */
function cropRegion(width: number, height: number, crop: ImageGroup["crop"]) {
  if (!crop) return { left: 0, top: 0, width, height };
  if (width / height > crop.aspect) {
    const w = Math.round(height * crop.aspect);
    return { left: Math.round(((width - w) * (crop.x ?? 50)) / 100), top: 0, width: w, height };
  }
  const h = Math.round(width / crop.aspect);
  return { left: 0, top: Math.round((height - h) / 2), width, height: h };
}

const manifest: ImageManifest = {};
const written = new Set<string>();
const rows: string[] = [];
let totalSource = 0;
let totalOut = 0;

for (const [name, group] of Object.entries(IMAGE_GROUPS) as [ImageGroupName, ImageGroup][]) {
  for (const { key, file } of sources(group)) {
    const input = fs.readFileSync(file);
    const meta = await sharp(input).metadata();
    const region = cropRegion(meta.width!, meta.height!, group.crop);
    const widths = group.widths;
    const formats = group.formats ?? (["avif", "webp"] as const);
    const avif = group.avif ?? ENCODE.avif;
    const largest = widths[widths.length - 1];
    if (largest > region.width) throw new Error(`${key}: ${largest} px is wider than the source (${region.width} px)`);
    const hash = createHash("sha1")
      .update(input)
      .update(
        JSON.stringify({ widths, crop: group.crop ?? null, ENCODE, ...(group.formats && { formats }), ...(group.avif && { avif }), sharp: sharp.versions.sharp }),
      )
      .digest("hex")
      .slice(0, 8);
    const cropped = () => sharp(input).extract(region);
    const sizes: Record<string, number[]> = {};
    for (const width of widths) {
      for (const format of formats) {
        const out = path.join(PUBLIC, variantPath(key, hash, width, format));
        written.add(path.normalize(out));
        if (!fs.existsSync(out)) {
          fs.mkdirSync(path.dirname(out), { recursive: true });
          const resized = cropped().resize({ width, kernel: "lanczos3" });
          await (format === "avif" ? resized.avif(avif) : resized.webp(ENCODE.webp)).toFile(out);
        }
        (sizes[format] ??= []).push(fs.statSync(out).size);
      }
    }
    const tiny = await cropped()
      .resize({ width: ENCODE.placeholder.width })
      .blur(0.6)
      .webp({ quality: ENCODE.placeholder.quality })
      .toBuffer();
    const entry: ImageEntry = {
      group: name,
      hash,
      width: largest,
      height: Math.round((largest * region.height) / region.width),
      placeholder: `data:image/webp;base64,${tiny.toString("base64")}`,
    };
    manifest[key] = entry;
    totalSource += input.length;
    totalOut += Object.values(sizes).flat().reduce((a, b) => a + b, 0);
    const kb = (n: number) => `${(n / 1024).toFixed(1)}`.padStart(6);
    const out = Object.entries(sizes).map(([format, list]) => `${format} ${list.map(kb).join(" /")}`);
    rows.push(`${key.padEnd(36)} ${kb(input.length)} KB → ${out.join("  ")}  (${widths.join("/")} px)`);
  }
}

// files of earlier versions
const walk = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]))
    : [];
let removed = 0;
for (const f of walk(OUT)) {
  if (!written.has(path.normalize(f))) {
    fs.rmSync(f);
    removed++;
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
const json = `${JSON.stringify(sorted, null, 2)}\n`;
if (!fs.existsSync(MANIFEST) || fs.readFileSync(MANIFEST, "utf8") !== json) fs.writeFileSync(MANIFEST, json);

console.log(rows.join("\n"));
console.log(
  `\n${Object.keys(manifest).length} pictures: sources ${(totalSource / 1024).toFixed(0)} KB, variants ${(totalOut / 1024).toFixed(0)} KB in ${OUT}` +
    (removed ? `, ${removed} old files removed` : ""),
);
