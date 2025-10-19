// Lokasi: src/app/admin/kamar/ImageWithFallback.js
'use client';

import { useState } from 'react';

// eslint-disable-next-line @next/next/no-img-element
export default function ImageWithFallback({ src, alt, className }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);

  const handleError = () => {
    // Prevent infinite loop if fallback also fails
    if (!error) {
      setError(true);
      setImgSrc(null); // Or set a placeholder image URL: '/placeholder.png'
    }
  };

  if (error || !imgSrc) {
    // Render nothing or a placeholder if the image fails to load
    return <span className={`inline-block ${className} bg-gray-200 flex items-center justify-center text-gray-400 text-xs`}>Err</span>;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}