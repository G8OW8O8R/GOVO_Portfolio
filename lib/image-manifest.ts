import type { ImageManifest, ImageRef } from "./image-groups";
import { imageRefFrom, imageSetFrom, type ImageSet } from "./images";
import generated from "./images.generated.json";

/**
 * The generated pictures (scripts/build-images.ts). Server side only: the
 * placeholders of every picture would otherwise end up in the client bundle.
 */
const manifest = generated as ImageManifest;

/** Picture of a public path, or null when it isn't generated (callers show a neutral placeholder). */
export const imageSet = (path: string, sizes?: string): ImageSet | null => imageSetFrom(manifest, path, sizes);

/** Picture that must exist (project media named in the content). */
export function requireImage(path: string, sizes?: string): ImageSet {
  const set = imageSet(path, sizes);
  if (!set) throw new Error(`${path} has no generated variants – run pnpm images`);
  return set;
}

/** Preload references of the pictures that exist. */
export const imageRefs = (paths: string[]): ImageRef[] => paths.flatMap((p) => imageRefFrom(manifest, p) ?? []);
