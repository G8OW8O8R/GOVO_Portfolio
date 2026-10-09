import { DESKTOP_MEDIA } from "./character-box";
import { IMAGE_FORMATS, IMAGE_GROUPS, variantPath, type ImageEntry, type ImageFormat, type ImageManifest, type ImageRef } from "./image-groups";

export type { ImageRef } from "./image-groups";

/** What a <picture> source needs: AVIF and WebP srcsets for the rendered `sizes` (empty for a format the group doesn't write). */
export type Srcsets = {
  avif: string;
  webp: string;
  /** WebP at the 1× width, for browsers without srcset (empty without WebP) */
  src: string;
  sizes: string;
};

/** Everything a <picture> needs: srcsets, intrinsic size, blurred placeholder. */
export type ImageSet = Srcsets & { width: number; height: number; placeholder: string };

/** "/skills/ux-ui.png" → "skills/ux-ui" */
export const imageKey = (path: string) => path.replace(/^\//, "").replace(/\.(png|jpe?g|webp|avif)$/i, "");

export const groupSizes = (sizes: string) => sizes.replaceAll("{desk}", DESKTOP_MEDIA);

export function srcset(key: string, hash: string, widths: readonly number[], format: ImageFormat): string {
  return widths.map((w) => `${variantPath(key, hash, w, format)} ${w}w`).join(", ");
}

/** Srcsets of a generated picture; `sizes` defaults to its group's (the size it is shown at). */
export function srcsets({ key, hash, group }: ImageRef, sizes?: string): Srcsets {
  const { widths, sizes: groupDefault, ...rest } = IMAGE_GROUPS[group];
  const formats: readonly ImageFormat[] = ("formats" in rest && rest.formats) || IMAGE_FORMATS;
  const has = (f: ImageFormat) => formats.includes(f);
  return {
    avif: has("avif") ? srcset(key, hash, widths, "avif") : "",
    webp: has("webp") ? srcset(key, hash, widths, "webp") : "",
    src: has("webp") ? variantPath(key, hash, widths[0], "webp") : "",
    sizes: sizes ?? groupSizes(groupDefault),
  };
}

/** The picture of a public path ("/skills/ux-ui.png") in a manifest, or null when it isn't generated. */
export function imageSetFrom(manifest: ImageManifest, path: string, sizes?: string): ImageSet | null {
  const key = imageKey(path);
  const entry: ImageEntry | undefined = manifest[key];
  if (!entry) return null;
  return { ...srcsets({ key, hash: entry.hash, group: entry.group }, sizes), width: entry.width, height: entry.height, placeholder: entry.placeholder };
}

/** Reference for a preload (no placeholder), or null when the picture isn't generated. */
export function imageRefFrom(manifest: ImageManifest, path: string): ImageRef | null {
  const key = imageKey(path);
  const entry = manifest[key];
  return entry ? { key, hash: entry.hash, group: entry.group } : null;
}

/**
 * Head script: a picture marked data-fade is revealed (data-ready) once it has
 * loaded or failed – a capturing listener on the document, so it works before
 * hydration and for pictures React adds later; CSS then fades it in over its
 * placeholder. A picture React inserts that is already there (loaded ahead,
 * in the memory cache) is marked before its first frame, so it shows at once
 * instead of fading; the observer starts after parsing, which it doesn't
 * need. Without JS nothing is hidden (@media (scripting: enabled)).
 */
export const IMAGE_FADE_SCRIPT =
  "(function(){var d=document,s='img[data-fade]',r=function(t){t.setAttribute('data-ready','')}," +
  "e=function(v){var t=v.target;t&&t.matches&&t.matches(s)&&r(t)};" +
  "d.addEventListener('load',e,!0);d.addEventListener('error',e,!0);" +
  "d.addEventListener('DOMContentLoaded',function(){" +
  "new MutationObserver(function(m){for(var i=0;i<m.length;i++)for(var a=m[i].addedNodes,j=0;j<a.length;j++){var n=a[j];if(n.nodeType!==1)continue;" +
  "var l=n.matches(s)?[n]:n.querySelectorAll(s);for(var k=0;k<l.length;k++)l[k].complete&&l[k].naturalWidth&&r(l[k])}})" +
  ".observe(d.documentElement,{childList:!0,subtree:!0})})})()";
