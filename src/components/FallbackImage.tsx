"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface FallbackImageProps extends ImageProps {
  fallbackSrc?: string;
}

export default function FallbackImage({ src, fallbackSrc, alt, ...props }: FallbackImageProps) {
  const defaultFallback = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";
  
  // If src is a string, use it. If not, use fallback (handles missing image gracefully).
  // Some next/image src properties might be objects if statically imported, but our URLs are strings.
  const initialSrc = typeof src === 'string' && src ? src : (fallbackSrc || defaultFallback);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  // When the src prop changes (e.g. navigation), reset the image source
  useEffect(() => {
    setImgSrc(typeof src === 'string' && src ? src : (fallbackSrc || defaultFallback));
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Image"}
      onError={() => {
        setImgSrc(fallbackSrc || defaultFallback);
      }}
    />
  );
}
