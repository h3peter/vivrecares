import { useState, useEffect, useRef } from 'react';

/**
 * OptimizedImage - Responsive image with lazy loading, srcset support, and progressive loading
 * 
 * Props:
 *   src: Image source URL
 *   alt: Alt text
 *   loading: 'eager' (visible on page load), 'lazy' (below fold), 'priority' (above fold, preload)
 *   className: CSS classes
 *   style: Inline styles
 *   sizes: Responsive sizes for srcset (e.g., "(max-width: 768px) 100vw, 50vw")
 *   children: Optional fallback/placeholder content
 */
export default function OptimizedImage({
  src,
  alt,
  loading = 'lazy',
  className = '',
  style = {},
  sizes,
  srcSet,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  // Preload priority images
  useEffect(() => {
    if (loading === 'priority' && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (srcSet) {
        link.imagesrcset = srcSet;
        if (sizes) link.imagesizes = sizes;
      }
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [src, srcSet, sizes, loading]);

  // Map loading attribute based on priority
  const loadingAttr = loading === 'priority' ? 'eager' : loading === 'eager' ? 'eager' : 'lazy';

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loadingAttr}
        decoding="async"
        className={className}
        style={{
          opacity: isLoaded ? 1 : 0.8,
          transition: 'opacity 0.3s ease',
          ...style,
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
        {...props}
      />
      {!isLoaded && !isError && (
        <div
          className={className}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.05)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            ...style,
          }}
        />
      )}
    </>
  );
}
