import Image from "next/image";
import baseImage from "@/public/character/base.jpg";
import { characterImageSizes } from "@/lib/character-box";
import { LiveCharacter } from "./LiveCharacter";
import s from "./character.module.css";

/**
 * The character in the character box: server-rendered poster (LCP, alt text,
 * fallback) with the living WebGL canvas on top. Both share the geometry
 * from lib/character-box.ts (CSS custom properties --cb-*).
 */
export function Character({ alt }: { alt: string }) {
  return (
    <>
      <Image
        src={baseImage}
        alt={alt}
        className={s.poster}
        data-character-poster=""
        loading="eager"
        fetchPriority="high"
        sizes={characterImageSizes()}
        quality={90}
        draggable={false}
      />
      <LiveCharacter className={s.canvas} />
    </>
  );
}
