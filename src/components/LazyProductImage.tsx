import React, { useState } from "react";
import { Smartphone, Image as ImageIcon } from "lucide-react";

interface LazyProductImageProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}

export function LazyProductImage({
  src,
  alt,
  category,
  className = "w-full h-full object-cover"
}: LazyProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fallback UI when image fails to load or no image URL provided
  if (!src || hasError) {
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-800/80 flex flex-col items-center justify-center p-2 text-slate-400 select-none">
        <Smartphone className="h-5 w-5 mb-0.5 opacity-60 text-slate-500" />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-full">
          {category || "Smartphone"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      {/* Animated Skeleton Loader while image is fetching */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700 flex items-center justify-center z-10">
          <ImageIcon className="h-4 w-4 text-slate-400 animate-bounce opacity-50" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default LazyProductImage;
