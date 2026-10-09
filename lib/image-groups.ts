/**
 * Pictures of the windows and desktop icons as static files: AVIF and WebP in
 * the widths they are shown at (1× and 2×), cropped to the frame they fill,
 * named with a content hash (cached for a year, immutable). The originals in
 * public/ are only the source; scripts/build-images.ts writes the variants to
 * public/img and their list to lib/images.generated.json.
 *
 * No imports here: the generator loads this file directly with Node.
 */

export type ImageGroup = {
  /** Sources: public/<dir>/<name>.<ext> */
  dir: string;
  /** Names without extension; omitted = every png/jpg in the folder (minus `exclude`). */
  names?: readonly string[];
  exclude?: RegExp;
  /** Output widths in px, ascending: 1× and 2× of the largest size shown (at most the source width). */
  widths: readonly number[];
  /** Formats written (default: AVIF and WebP). */
  formats?: readonly ImageFormat[];
  /** AVIF encoder settings instead of the shared ones (a different quality renames the files). */
  avif?: { quality: number; effort: number };
  /** Crop to this aspect (width / height) like object-fit: cover; `x` = object-position x in %. */
  crop?: { aspect: number; x?: number };
  /** Rendered width as in the `sizes` attribute; {desk} = the desktop media query. */
  sizes: string;
};

export const IMAGE_GROUPS = {
  /** Desktop file icons: --file-icon is 60 px on phones, up to 96 px on the desktop. */
  icons: { dir: "icons", names: ["o-mnie", "oferta", "cv"], widths: [96, 192], sizes: "{desk} 96px, 60px" },
  projectIcons: { dir: "projects/obok", names: ["icon"], widths: [96, 192], sizes: "{desk} 96px, 60px" },
  /** Skill rows: 72 px square on the desktop, 56 px on phones. */
  skills: { dir: "skills", exclude: /^workflow-/, widths: [72, 144], sizes: "{desk} 72px, 56px" },
  /** "My workflow": three 16:10 frames side by side, one column on phones (sources are 512 px). */
  workflow: { dir: "skills", names: ["workflow-1", "workflow-2", "workflow-3"], widths: [320, 512], crop: { aspect: 16 / 10 }, sizes: "{desk} 260px, 90vw" },
  /** Services: 96 px square on the desktop, 80 px on phones. */
  services: { dir: "services", widths: [96, 192], sizes: "{desk} 96px, 80px" },
  /** Case study solutions: 16:10 stills, half of the window. */
  shots: { dir: "projects/obok/shots", widths: [480, 960], crop: { aspect: 16 / 10 }, sizes: "{desk} 420px, 92vw" },
  /** Scene gallery: 4:5 crops of landscape posters (the lighthouse sits at 64 %). */
  scenes: { dir: "projects/obok/scenes", widths: [192, 384], crop: { aspect: 4 / 5, x: 64 }, sizes: "{desk} 170px, 38vw" },
  /** Showreel poster: the full window width. */
  showreel: { dir: "projects/obok", names: ["showreel-poster"], widths: [960, 1920], sizes: "{desk} 860px, 92vw" },
  /** Project cover: Pricing, service pages and the quick look. */
  cover: { dir: "projects/obok", names: ["cover"], widths: [480, 960], sizes: "{desk} 360px, 90vw" },
  /**
   * The character's poster on phones (the crop, base-mobile.jpg): AVIF only, the
   * WebP fallback is next/image's q90. Widths follow the crop's rendered width ×
   * DPR 1.75–3; AVIF q80 matches WebP q90 (SSIM of the whole frame, the eyes and
   * the pendant) at ~15 % less. The page passes the crop's own `sizes`.
   */
  characterMobile: {
    dir: "character",
    names: ["base-mobile"],
    widths: [640, 828, 1080, 1280, 1520],
    formats: ["avif"],
    avif: { quality: 80, effort: 9 },
    sizes: "100vw",
  },
} as const satisfies Record<string, ImageGroup>;

export type ImageGroupName = keyof typeof IMAGE_GROUPS;

/** One generated picture, keyed by its source path without extension ("skills/ux-ui"). */
export type ImageEntry = {
  group: ImageGroupName;
  hash: string;
  /** Output size of the 2× variant (after the crop), for width/height attributes. */
  width: number;
  height: number;
  /** ~16 px blurred preview as a data URI. */
  placeholder: string;
};

export type ImageManifest = Record<string, ImageEntry>;

/** A generated picture without its placeholder: enough to build its srcsets (preloads on the client). */
export type ImageRef = { key: string; hash: string; group: ImageGroupName };

export const IMAGE_FORMATS = ["avif", "webp"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

/** Public path of one variant: /img/skills/ux-ui.1a2b3c4d.72.avif */
export function variantPath(key: string, hash: string, width: number, format: ImageFormat): string {
  return `/img/${key}.${hash}.${width}.${format}`;
}
