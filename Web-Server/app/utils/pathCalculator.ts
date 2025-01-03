import type { Coordinate, PriorityLevel } from '../types/coordinates';

// Calculate distance between two points using Haversine formula
const getDistance = (p1: Coordinate, p2: Coordinate): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
  const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
