import { getImageProps } from "next/image";
import baseImage from "@/public/character/base.jpg";
import mobileImage from "@/public/character/base-mobile.jpg";
import { characterImageSizes } from "@/lib/character-box";
import { imageSet } from "@/lib/image-manifest";
import { CROP_MEDIA, cropImageSizes, cropPosterCss } from "@/lib/character/mobile-crop";
import { LiveCharacter } from "./LiveCharacter";
import s from "./character.module.css";

/**
 * The character in the character box: server-rendered poster (LCP, alt text,
 * fallback) with the living WebGL canvas on top. Both share the geometry
 * from lib/character-box.ts (CSS custom properties --cb-*). Portrait phones
 * get the full-resolution crop (MOBILE_CROP) placed at its spot in the box,
 * the same crop the canvas uses, so nothing moves when the canvas fades in;
 * as AVIF (pnpm images, same quality) with next/image's WebP as the fallback.
 */
export function Character({ alt }: { alt: string }) {
  return (
    <>
      <CharacterPoster alt={alt} />
      <LiveCharacter className={s.canvas} />
    </>
  );
}

/** The poster alone (the 404 page): the same picture, crop and place, no WebGL. */
export function CharacterPoster({ alt }: { alt: string }) {
  const common = { alt, quality: 90, loading: "eager", fetchPriority: "high", draggable: false } as const;
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: mobileImage, sizes: cropImageSizes() });
  const { props } = getImageProps({ ...common, src: baseImage, sizes: characterImageSizes() });
  const mobileAvif = imageSet("/character/base-mobile.jpg", cropImageSizes());

  return (
    <>
      <style>{cropPosterCss(`.${s.poster}`)}</style>
      <picture>
        {mobileAvif && <source media={CROP_MEDIA} type="image/avif" srcSet={mobileAvif.avif} sizes={mobileAvif.sizes} />}
        <source media={CROP_MEDIA} srcSet={mobileSrcSet} sizes={cropImageSizes()} />
        <img {...props} alt={alt} className={s.poster} data-character-poster="" />
      </picture>
    </>
  );
}
