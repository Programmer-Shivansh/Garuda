'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Coordinate } from '../types/coordinates';
import { createMarkerIcon, createCurrentLocationIcon } from '../utils/markerIcons';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'green';
      case 'severe': return 'red';
      case 'intermediate': return 'yellow';
      default: return 'white';
    }
  };

  const createCustomMarker = (coordinate: Coordinate) => {
    if (!window.L) return null;
    
    const color = getPriorityColor(coordinate.priority);
    
    return new window.L.Marker([coordinate.latitude, coordinate.longitude], {
      icon: window.L.divIcon({
        className: 'custom-marker',
        html: createMarkerIcon(color),
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      })
    });
  };

  const fetchCoordinates = async () => {
    try {
      const response = await fetch('/api/coordinates');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid data format received');
      }
      return data.data;
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      setError('Failed to load coordinate data');
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current || !window.MapmyIndia || !window.L) {
        return false;
      }

      try {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        
        if (!lat || !lng) {
          throw new Error('Location coordinates not provided');
        }

        const currentLat = parseFloat(lat);
        const currentLng = parseFloat(lng);

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.MapmyIndia.Map(mapRef.current, {
            center: [currentLat, currentLng],
            zoomControl: true,
            zoom: 15,
            hybrid: false
          });

          // Add current location marker with custom icon
          const currentLocationMarker = new window.L.Marker([currentLat, currentLng], {
            icon: window.L.divIcon({
              className: 'current-location-marker',
              html: createCurrentLocationIcon(),
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          });
          
          currentLocationMarker.addTo(mapInstanceRef.current);
          currentLocationMarker.bindPopup('Your Location').openPopup();

          // Fetch and add priority markers
          const coordinates = await fetchCoordinates();
          coordinates.forEach((coord: Coordinate) => {
            const marker = createCustomMarker(coord);
            if (marker) {
              marker.addTo(mapInstanceRef.current)
                .bindPopup(`Priority: ${coord.priority}`);
            }
          });
        }

        if (mounted) {
          setIsLoading(false);
        }
        return true;
      } catch (err) {
        console.error('Map initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load map');
          setIsLoading(false);
        }
        return false;
      }
    };

    // Try to initialize immediately
    const initialize = async () => {
      const result = await initMap();
      if (!result) {
        const timer = setInterval(async () => {
          const success = await initMap();
          if (success) {
            clearInterval(timer);
          }
        }, 500);

        // Cleanup timer after 10 seconds if map doesn't initialize
        setTimeout(() => {
          clearInterval(timer);
          if (mounted && isLoading) {
            setError('Failed to load map resources');
            setIsLoading(false);
          }
        }, 10000);
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [searchParams]);

  return (
    <div className="relative w-full h-screen">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-lg">Loading map...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full h-full"
        id="map"
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      />
    </div>
  );
}
