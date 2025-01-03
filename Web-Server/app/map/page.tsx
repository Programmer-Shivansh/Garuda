'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Map as LeafletMap, LatLngBounds, Circle, Polyline, Marker, LatLng, LatLngExpression } from 'leaflet';
import type { Coordinate } from '../types/coordinates';
import { createMarkerIcon, createCurrentLocationIcon } from '../utils/markerIcons';
import { calculatePath } from '../utils/pathCalculator';
import { detectSevereClusters } from '../utils/clusterDetector';

type MapInstance = LeafletMap;
type CircleInstance = Circle;
type PolylineInstance = Polyline;
type MarkerInstance = Marker;

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'green';
      case 'severe': return 'red';
      case 'intermediate': return 'yellow';
      default: return 'white';
    }
  };

  const createCustomMarker = useCallback((coordinate: Coordinate): MarkerInstance | null => {
    if (!window.L) return null;
    
    const color = getPriorityColor(coordinate.priority);
    
    return new window.L.Marker([coordinate.latitude, coordinate.longitude], {
      icon: window.L.divIcon({
        className: 'custom-marker',
        html: createMarkerIcon(color),
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      })
    }) as MarkerInstance;
  }, []);

  const clearExistingMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current.clear();
  };

  const drawPath = useCallback((coords: Coordinate[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance || coords.length === 0) return;

    // Remove existing path
    if (pathRef.current) {
      pathRef.current.remove();
    }

    // Calculate optimal path
    const orderedCoords = calculatePath(coords, currentLocationRef.current);

    // Create path coordinates including current location
    const pathCoords = [
      currentLocationRef.current,
      ...orderedCoords.map(coord => [coord.latitude, coord.longitude] as [number, number])
    ];

    // Draw new path with thicker black line
    pathRef.current = window.L.polyline(pathCoords, {
      color: '#000000',
      weight: 4,
      opacity: 0.8,
      dashArray: '15, 10',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapInstance) as PolylineInstance;
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

  const addMarkersToMap = useCallback((coords: Coordinate[]) => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) return;
    
    clearExistingMarkers();
    
    // Create bounds object with initial coordinates
    const initialLatLng: LatLngExpression = [0, 0];
    const bounds = new window.L.LatLngBounds(initialLatLng, initialLatLng);
    
    // Detect severe clusters
    const clusters = detectSevereClusters(coords);
    
    // Notify about each cluster
    clusters.forEach(cluster => {
      console.log('Severe cluster detected:', cluster);
      notifyCluster(cluster);
      
      // Add cluster visualization (optional)
      const clusterCircle = window.L.circle([cluster.center.latitude, cluster.center.longitude], {
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
          const latLng = new window.L.LatLng(coord.latitude, coord.longitude);
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

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current || !window.MapmyIndia || !window.L) {
        console.error('Missing required dependencies'); // Debug log
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
        
        // Store current location
        currentLocationRef.current = [currentLat, currentLng];

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new window.MapmyIndia.Map(mapRef.current, {
            center: [currentLat, currentLng],
            zoomControl: true,
            zoom: 19,        // Set very high initial zoom
            minZoom: 15,     // Prevent zooming out too far
            maxZoom: 20,     // Allow maximum zoom in
            hybrid: false
          }) as MapInstance;

          // Force zoom level after initialization
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setZoom(19);
            }
          }, 500);

          // Add zoom change handler
          mapInstanceRef.current.on('zoomend', () => {
            const currentZoom = mapInstanceRef.current?.getZoom();
            if (currentZoom && currentZoom < 17) {
              mapInstanceRef.current?.setZoom(19);
            }
          });

          console.log('Map initialized'); // Debug log

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

          // Fetch initial coordinates immediately
          const initialCoords = await fetchCoordinates();
          if (mounted && initialCoords.length > 0) {
            addMarkersToMap(initialCoords);
          }
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
  }, [searchParams, addMarkersToMap, fetchCoordinates]); // Remove isLoading dependency

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
