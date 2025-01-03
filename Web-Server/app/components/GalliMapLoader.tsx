'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GalliMapLoaderProps {
  apiKey: string;
  onLoad?: () => void;
}

export default function GalliMapLoader({ apiKey, onLoad }: GalliMapLoaderProps) {
  useEffect(() => {
    return () => {
      // Cleanup if needed
      if (window.Galli) {
        window.Galli = undefined;
      }
    };
  }, []);

  return (
    <Script
      src={`https://api.gallimap.com/maps/v1/galli.js?key=${apiKey}`}
      strategy="beforeInteractive"
      onLoad={() => {
        console.log('Galli Maps loaded');
        onLoad?.();
      }}
      onError={(e) => {
        console.error('Error loading Galli Maps:', e);
      }}
    />
  );
}
