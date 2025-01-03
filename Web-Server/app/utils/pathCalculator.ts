import type { Coordinate, PriorityLevel } from '../types/coordinates';

const ACCESS_TOKEN = 'your_galli_access_token';

export const getDistance = async (p1: Coordinate, p2: Coordinate): Promise<number> => {
  try {
    const response = await fetch(
      `https://route-init.gallimap.com/api/v1/routing/distance?` +
      `mode=driving&` +
      `srcLat=${p1.latitude}&` +
      `srcLng=${p1.longitude}&` +
      `dstLat=${p2.latitude}&` +
      `dstLng=${p2.longitude}&` +
      `accessToken=${ACCESS_TOKEN}`
    );

    const data = await response.json();
    if (data.success && data.data.success) {
      return data.data.data[0].distance;
    }
    throw new Error('Failed to get distance');
  } catch (error) {
    console.error('Distance calculation failed:', error);
    // Fallback to simple distance calculation if API fails
    const R = 6371;
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
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
  // Group coordinates by priority
  const grouped = coordinates.reduce((acc, coord) => {
    const priority = coord.priority;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(coord);
    return acc;
  }, {} as Record<PriorityLevel, Coordinate[]>);

  // For each priority group, find nearest neighbor path
  const result: Coordinate[] = [];
  const startPoint: Coordinate = {
    latitude: currentLocation[0],
    longitude: currentLocation[1],
    priority: 'normal' as PriorityLevel // Type assertion for starting point
  };
  let lastPoint = startPoint;

  (['severe', 'intermediate', 'normal'] as PriorityLevel[]).forEach(priority => {
    if (!grouped[priority]) return;

    let remaining = [...grouped[priority]];
    while (remaining.length > 0) {
      // Find nearest point to last point
      const nearest = remaining.reduce((nearest, current) => {
        const dNearest = getDistance(lastPoint, nearest);
        const dCurrent = getDistance(lastPoint, current);
        return dCurrent < dNearest ? current : nearest;
      });

      result.push(nearest);
      lastPoint = nearest;
      remaining = remaining.filter(p => p !== nearest);
    }
  });

  return result;
};
