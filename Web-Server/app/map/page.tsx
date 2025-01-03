'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Coordinate } from '../types/coordinates';
import { createMarkerIcon, createCurrentLocationIcon } from '../utils/markerIcons';
import { calculatePath } from '../utils/pathCalculator';
import { detectSevereClusters } from '../utils/clusterDetector';

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const pathRef = useRef<any>(null);
  const currentLocationRef = useRef<[number, number]>([0, 0]);

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

  const clearExistingMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current.clear();
  };

  const drawPath = useCallback((coords: Coordinate[]) => {
    if (!mapInstanceRef.current || coords.length === 0) return;

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
      color: '#000000', // Black color
      weight: 4,        // Thicker line
      opacity: 0.8,     // Slightly transparent
      dashArray: '15, 10', // Larger dash pattern
      lineCap: 'round', // Rounded line ends
      lineJoin: 'round' // Rounded line joins
    }).addTo(mapInstanceRef.current);
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
    if (!mapInstanceRef.current) {
      console.error('Map instance not initialized');
      return;
    }
    
    clearExistingMarkers();
    
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
      }).addTo(mapInstanceRef.current);
      
      clusterCircle.bindPopup(`Severe Cluster: ${cluster.count} cases`);
    });

    // Create bounds object using latLngBounds function instead of constructor
    const bounds = window.L.latLngBounds();
    
    coords.forEach((coord) => {
      try {
        const marker = createCustomMarker(coord);
        if (marker) {
          marker.addTo(mapInstanceRef.current)
            .bindPopup(`Priority: ${coord.priority}`);
          const key = `${coord.latitude}-${coord.longitude}`;
          markersRef.current.set(key, marker);
          
          // Extend bounds to include this marker
          bounds.extend([coord.latitude, coord.longitude]);
        }
      } catch (err) {
        console.error('Error adding marker:', err);
      }
    });

    // Fit bounds if we have markers
    if (coords.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }

    // Draw path after adding markers
    drawPath(coords);
  }, [drawPath]);

  const fetchCoordinates = async () => {
    try {
      console.log('Fetching coordinates...'); // Debug log
      const response = await fetch('/api/coordinates');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received data:', data); // Debug log
      
      if (!data || !data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid data format received');
      }
      
      setCoordinates(data.data);
      addMarkersToMap(data.data);
      return data.data;
    } catch (error) {
      console.error('Failed to fetch coordinates:', error);
      setError('Failed to load coordinate data');
      return [];
    }
  };

  // Polling mechanism for updates
  useEffect(() => {
    let mounted = true;
    const pollInterval = 5000; // 5 seconds

    const pollForUpdates = async () => {
      if (!mounted) return;
      
      try {
        const response = await fetch('/api/coordinates');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Check if we have new coordinates
          if (JSON.stringify(data.data) !== JSON.stringify(coordinates)) {
            console.log('New coordinates detected, updating map...');
            setCoordinates(data.data);
            addMarkersToMap(data.data);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(pollForUpdates, pollInterval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [coordinates, addMarkersToMap]);

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
            zoom: 12, // Start with a wider view
            hybrid: false
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
  }, [searchParams, addMarkersToMap]);

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
