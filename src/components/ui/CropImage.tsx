interface CropImageProps {
  src: string;
  /** Natural size of the source image. */
  srcWidth: number;
  srcHeight: number;
  /** Region to show, in source pixels. */
  crop: { x: number; y: number; w: number; h: number };
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
}

/**
 * Shows a rectangular region of a larger image with plain CSS: the wrapper takes
 * the crop's aspect ratio and the image is offset/scaled with percentages, so it
 * stays sharp and responsive with no JavaScript and no second asset. Used to
 * present different parts of one REAL screenshot; never to fabricate UI.
 */
export default function CropImage({ src, srcWidth, srcHeight, crop, alt, className = "", loading = "lazy", priority = false }: CropImageProps) {
  const fetchPriority = priority ? { fetchpriority: "high" } : {};
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${crop.w} / ${crop.h}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={srcWidth}
        height={srcHeight}
        loading={priority ? "eager" : loading}
        decoding="async"
        {...fetchPriority}
        draggable={false}
        style={{
          position: "absolute",
          maxWidth: "none",
          width: `${(srcWidth / crop.w) * 100}%`,
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
        }}
      />
    </div>
  );
}
