'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import GalliMapLoader from '../components/GalliMapLoader';
// Remove Leaflet imports
import type { Coordinate } from '../types/coordinates';
import { createMarkerIcon, createCurrentLocationIcon } from '../utils/markerIcons';
import { calculatePath } from '../utils/pathCalculator';
import { detectSevereClusters } from '../utils/clusterDetector';
import type { GalliMapOptions, GalliMarkerOptions, GalliPolylineOptions, GalliCircleOptions } from '../types/map';

const ACCESS_TOKEN = 'your_galli_access_token';

// Update type definitions for Galli
type MapInstance = any;
type MarkerInstance = any;
type PolylineInstance = any;

// Add type guard function
const isGalliAvailable = (): boolean => {
  return typeof window !== 'undefined' && window.Galli !== undefined;
};

const getGalli = () => {
  if (!window.Galli) {
    throw new Error('Galli Maps not loaded');
  }
  return window.Galli;
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<Map<string, MarkerInstance>>(new Map());
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const pathRef = useRef<PolylineInstance | null>(null);
  const currentLocationRef = useRef<[number, number]>([0, 0]);
  const mounted = useRef(true);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'green';
      case 'severe': return 'red';
      case 'intermediate': return 'yellow';
      default: return 'white';
    }
  };

  // Update marker creation with type guard
  const createCustomMarker = useCallback((coordinate: Coordinate) => {
    if (!isGalliAvailable()) return null;
    
    const color = getPriorityColor(coordinate.priority);
    
    return window.Galli?.Marker && new window.Galli.Marker({
      coordinates: [coordinate.longitude, coordinate.latitude],
      element: createMarkerIcon(color)
    });
  }, []);

  const clearExistingMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current.clear();
  };

  const getRoutePath = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
    try {
      // Using Galli's routing API
      const response = await fetch(
        `https://routing.gallimap.com/route/v1/driving/` +
        `${start[1]},${start[0]};${end[1]},${end[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
        // Convert coordinates from [longitude, latitude] to [latitude, longitude]
        return data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => [coord[1], coord[0]]
        );
      }
      
      // If no valid route found, fall back to direct line
      return [start, end];
    } catch (error) {
      console.error('Route calculation failed:', error);
      // Fallback to direct line if API fails
      return [start, end];
    }
  };

  // Update other Galli usage with type guard
  const drawPath = useCallback(async (coords: Coordinate[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || coords.length === 0 || !isGalliAvailable()) return;

    try {
      const Galli = getGalli();
      if (pathRef.current) {
        pathRef.current.remove();
      }

      const orderedCoords = calculatePath(coords, currentLocationRef.current);
      const pathCoords = orderedCoords.map(coord => [coord.longitude, coord.latitude]);

      pathRef.current = new Galli.Polyline({
        coordinates: pathCoords,
        color: '#000000',
        width: 4,
        opacity: 0.8,
        dashArray: [15, 10]
      } as GalliPolylineOptions).addTo(mapInstance);
    } catch (error) {
      console.error('Failed to draw path:', error);
    }
  }, []);

  const notifyCluster = async (cluster: any) => {
    try {
      const response = await fetch('YOUR_ALERT_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          center: cluster.center,
          count: cluster.count,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to notify about cluster');
      }
      
      console.log('Cluster notification sent:', cluster);
    } catch (error) {
      console.error('Failed to send cluster notification:', error);
    }
  };

  // Update addMarkersToMap with type guard
  const addMarkersToMap = useCallback((coords: Coordinate[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || !isGalliAvailable()) return;
    
    try {
      const Galli = getGalli();
      clearExistingMarkers();
      
      // Create bounds object with initial coordinates
      const initialLatLng: [number, number] = [0, 0];
      const bounds = new Galli.LatLngBounds(initialLatLng, initialLatLng);
      
      // Detect severe clusters
      const clusters = detectSevereClusters(coords);
      
      // Notify about each cluster
      clusters.forEach(cluster => {
        console.log('Severe cluster detected:', cluster);
        notifyCluster(cluster);
        
        // Add cluster visualization (optional)
        const clusterCircle = new Galli.Circle({
          center: [cluster.center.longitude, cluster.center.latitude],
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.3,
          radius: 50 // meters
        }).addTo(mapInstance);
        
        clusterCircle.bindPopup(`Severe Cluster: ${cluster.count} cases`);
      });

      coords.forEach((coord) => {
        try {
          const marker = createCustomMarker(coord);
          if (marker) {
            marker.addTo(mapInstance)
              .bindPopup(`Priority: ${coord.priority}`);
            const key = `${coord.latitude}-${coord.longitude}`;
            markersRef.current.set(key, marker);
            
            // Create LatLng object for bounds
            const latLng = new Galli.LatLng(coord.latitude, coord.longitude);
            bounds.extend(latLng);
          }
        } catch (err) {
          console.error('Error adding marker:', err);
        }
      });

      // Modified bounds fitting with much tighter zoom
      if (coords.length > 0) {
        mapInstance.fitBounds(bounds, {
          padding: [20, 20], // Reduced padding
          maxZoom: 18,      // Increased max zoom
          animate: true     // Smooth animation
        });
        
        // Force zoom level after bounds fit
        setTimeout(() => {
          if (mapInstance) {
            mapInstance.setZoom(19);
          }
        }, 1000);
      }

      drawPath(coords);
    } catch (error) {
      console.error('Failed to add markers:', error);
    }
  }, [drawPath, createCustomMarker]);

  // Memoize the coordinates comparison function
  const areCoordinatesEqual = useCallback((prev: Coordinate[], next: Coordinate[]) => {
    if (prev.length !== next.length) return false;
    return prev.every((coord, index) => (
      coord.latitude === next[index].latitude &&
      coord.longitude === next[index].longitude &&
      coord.priority === next[index].priority
    ));
  }, []);

  // Memoize fetch coordinates to prevent recreating on every render
  const fetchCoordinates = useCallback(async () => {
    try {
      const response = await fetch('/api/coordinates');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid data format received');
      }
      
      // Only update if coordinates have changed
      if (!areCoordinatesEqual(coordinates, data.data)) {
        setCoordinates(data.data);
        addMarkersToMap(data.data);
      }
      return data.data;
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      setError('Failed to load coordinate data');
      return [];
    }
  }, [coordinates, addMarkersToMap, areCoordinatesEqual]);

  // Polling mechanism with optimized updates
  useEffect(() => {
    let mounted = true;
    const pollInterval = 5000;

    const pollForUpdates = async () => {
      if (!mounted) return;
      await fetchCoordinates();
    };

    // Initial fetch
    pollForUpdates();

    const intervalId = setInterval(pollForUpdates, pollInterval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [fetchCoordinates]); // Only depend on fetchCoordinates

  // Move initialize to the top of component scope
  const initMap = useCallback(async () => {
    if (!mapRef.current || !isGalliAvailable()) {
      console.error('Missing required dependencies');
      return false;
    }

    try {
      const Galli = getGalli(); // Use getGalli utility to safely access Galli
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      
      if (!lat || !lng) {
        throw new Error('Location coordinates not provided');
      }

      const currentLat = parseFloat(lat);
      const currentLng = parseFloat(lng);
      
      // Store current location
      currentLocationRef.current = [currentLat, currentLng];

      if (!mapInstanceRef.current) {
        // Initialize Galli map
        mapInstanceRef.current = new Galli.Map({
          container: mapRef.current,
          center: [currentLng, currentLat], // Note: Galli uses [lng, lat] order
          zoom: 19,
          minZoom: 15,
          maxZoom: 20,
          accessToken: ACCESS_TOKEN
        });

        // Add current location marker
        const currentLocationMarker = new Galli.Marker({
          coordinates: [currentLng, currentLat],
          element: createCurrentLocationIcon()
        });
        
        currentLocationMarker.addTo(mapInstanceRef.current);

        // Fetch initial coordinates immediately
        const initialCoords = await fetchCoordinates();
        if (mounted && initialCoords.length > 0) {
          addMarkersToMap(initialCoords);
        }
      }

      if (mounted.current) {
        setIsLoading(false);
      }
      return true;
    } catch (err) {
      console.error('Map initialization error:', err);
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
      return false;
    }
  }, [searchParams, fetchCoordinates, addMarkersToMap]);

  const initialize = useCallback(async () => {
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
        if (isLoading) {
          setError('Failed to load map resources');
          setIsLoading(false);
        }
      }, 10000);
    }
  }, [initMap, isLoading]);

  useEffect(() => {
    // Set mounted.current to true at start
    mounted.current = true;

    initialize();

    return () => {
      // Set mounted.current to false on cleanup
      mounted.current = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialize]);

  // Update return JSX
  return (
    <div className="relative w-full h-screen">
      <GalliMapLoader 
        apiKey={ACCESS_TOKEN} 
        onLoad={initialize}
      />
      
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
