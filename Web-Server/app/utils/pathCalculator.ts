import type { Coordinate, PriorityLevel } from '../types/coordinates';

// Types for API response
interface GalliDistanceResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    data: Array<{
      distance: number;
      duration: number;
    }>;
  };
}

const ACCESS_TOKEN = '06071418-cacd-4752-910e-338c51cf1bc9';

const getDistance = async (
  start: [number, number],
  end: [number, number],
  accessToken: string
): Promise<number> => {
  try {
    const [startLat, startLng] = start;
    const [endLat, endLng] = end;

    const url = new URL('https://route-init.gallimap.com/api/v1/routing/distance');
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('srcLat', startLat.toString());
    url.searchParams.append('srcLng', startLng.toString());
    url.searchParams.append('dstLat', endLat.toString());
    url.searchParams.append('dstLng', endLng.toString());
    url.searchParams.append('accessToken', accessToken);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as GalliDistanceResponse;
    
    if (data.success && data.data.success && data.data.data[0]) {
      return data.data.data[0].distance;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Distance calculation failed:', error);
    // Fallback to simple distance calculation
    return calculateHaversineDistance(start, end);
  }
};

// Haversine formula for fallback distance calculation
const calculateHaversineDistance = (
  [lat1, lon1]: [number, number], 
  [lat2, lon2]: [number, number]
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon1 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const getRoutePath = async (start: [number, number], end: [number, number]): Promise<[number, number][]> => {
  try {
    const response = await fetch(
      `https://routing.gallimap.com/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}`,
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
    return data.routes[0].geometry.coordinates;
  } catch (error) {
    console.error('Route calculation failed:', error);
    return [start, end];
  }
};

// Sort coordinates by priority and calculate path
export const calculatePath = (coordinates: Coordinate[], currentLocation: [number, number]): Coordinate[] => {
  // Always start with current location
  const startPoint: Coordinate = {
    latitude: currentLocation[0],
    longitude: currentLocation[1],
    priority: 'normal'
  };

  // Group coordinates by priority
  const grouped = coordinates.reduce((acc, coord) => {
    if (coord.latitude === startPoint.latitude && coord.longitude === startPoint.longitude) {
      return acc; // Skip if it's the same as current location
    }
    const priority = coord.priority;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(coord);
    return acc;
  }, {} as Record<PriorityLevel, Coordinate[]>);

  // Initialize result with current location
  const result: Coordinate[] = [startPoint];
  let lastPoint = startPoint;

  // Process each priority level
  (['severe', 'intermediate', 'normal'] as PriorityLevel[]).forEach(priority => {
    if (!grouped[priority]) return;

    let remaining = [...grouped[priority]];
    while (remaining.length > 0) {
      // Find nearest point to last point
      const nearest = remaining.reduce((nearest, current) => {
        const dNearest = calculateHaversineDistance(
          [lastPoint.latitude, lastPoint.longitude],
          [nearest.latitude, nearest.longitude]
        );
        const dCurrent = calculateHaversineDistance(
          [lastPoint.latitude, lastPoint.longitude],
          [current.latitude, current.longitude]
        );
        return dCurrent < dNearest ? current : nearest;
      }, remaining[0]);

      result.push(nearest);
      lastPoint = nearest;
      remaining = remaining.filter(p => p !== nearest);
    }
  });

  return result;
};

export { getDistance, calculateHaversineDistance };
