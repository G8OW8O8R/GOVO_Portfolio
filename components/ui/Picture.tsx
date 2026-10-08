import type { ImageSet } from "@/lib/images";

/**
 * A generated picture (lib/image-groups.ts): AVIF with a WebP fallback in the
 * widths it is shown at, straight from the static files (no image optimiser
 * on the way). `className` styles the frame (<picture>): size, radius,
 * shadow; the image fills it. With `fade` the frame shows the blurred
 * placeholder and the image fades in over it once loaded (globals.css,
 * the head script marks it ready).
 */
export function Picture({
  image,
  alt = "",
  sizes = image.sizes,
  className = "",
  loading = "lazy",
  fetchPriority,
  fade = true,
  draggable,
}: {
  image: ImageSet;
  alt?: string;
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  fade?: boolean;
  draggable?: boolean;
}) {
  return (
    <picture
      className={`block bg-cover bg-center ${className}`}
      style={fade ? { backgroundImage: `url("${image.placeholder}")` } : undefined}
    >
      <source type="image/avif" srcSet={image.avif} sizes={sizes} />
      <img
        src={image.src}
        srcSet={image.webp}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={alt}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        draggable={draggable}
        data-fade={fade ? "" : undefined}
        // data-ready comes from the head script, possibly before hydration
        suppressHydrationWarning
        className="block size-full object-cover"
      />
    </picture>
  );
}
