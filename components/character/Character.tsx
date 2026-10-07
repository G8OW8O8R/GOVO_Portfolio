import { getImageProps } from "next/image";
import baseImage from "@/public/character/base.jpg";
import mobileImage from "@/public/character/base-mobile.jpg";
import { characterImageSizes } from "@/lib/character-box";
import { CROP_MEDIA, cropImageSizes, cropPosterCss } from "@/lib/character/mobile-crop";
import { LiveCharacter } from "./LiveCharacter";
import s from "./character.module.css";

/**
 * The character in the character box: server-rendered poster (LCP, alt text,
 * fallback) with the living WebGL canvas on top. Both share the geometry
 * from lib/character-box.ts (CSS custom properties --cb-*). Portrait phones
 * get the full-resolution crop (MOBILE_CROP) placed at its spot in the box,
 * the same crop the canvas uses, so nothing moves when the canvas fades in.
 */
export function Character({ alt }: { alt: string }) {
  const common = { alt, quality: 90, loading: "eager", fetchPriority: "high", draggable: false } as const;
  const {
    props: { srcSet: mobileSrcSet },
  } = getImageProps({ ...common, src: mobileImage, sizes: cropImageSizes() });
  const { props } = getImageProps({ ...common, src: baseImage, sizes: characterImageSizes() });

  return (
    <>
      <style>{cropPosterCss(`.${s.poster}`)}</style>
      <picture>
        <source media={CROP_MEDIA} srcSet={mobileSrcSet} sizes={cropImageSizes()} />
        <img {...props} alt={alt} className={s.poster} data-character-poster="" />
      </picture>
      <LiveCharacter className={s.canvas} />
    </>
  );
}
