import type { Coordinate } from '../types/coordinates';
import { calculateHaversineDistance } from './pathCalculator';

const CLUSTER_RADIUS = 100; // meters
const MIN_CLUSTER_SIZE = 10;

interface Cluster {
  center: { latitude: number; longitude: number };
  count: number;
  points: Coordinate[];
  priority: string;
}

export const detectClusters = (coordinates: Coordinate[]): Cluster[] => {
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  coordinates.forEach((point, index) => {
    if (processed.has(`${point.latitude}-${point.longitude}`)) return;

    const nearbyPoints = coordinates.filter((other, otherIndex) => {
      if (index === otherIndex) return false;
      if (processed.has(`${other.latitude}-${other.longitude}`)) return false;

      const distance = calculateHaversineDistance(
        [point.latitude, point.longitude],
        [other.latitude, other.longitude]
      );

      return distance <= CLUSTER_RADIUS;
    });

    if (nearbyPoints.length + 1 >= MIN_CLUSTER_SIZE) {
      const allPoints = [point, ...nearbyPoints];
      
      // Calculate cluster center
      const center = {
        latitude: allPoints.reduce((sum, p) => sum + p.latitude, 0) / allPoints.length,
        longitude: allPoints.reduce((sum, p) => sum + p.longitude, 0) / allPoints.length
      };

      // Determine cluster priority based on most severe point
      const priority = allPoints.reduce((maxPriority, p) => {
        const priorities = { severe: 3, intermediate: 2, normal: 1 };
        return priorities[p.priority as keyof typeof priorities] > 
               priorities[maxPriority as keyof typeof priorities] ? p.priority : maxPriority;
      }, 'normal');

      clusters.push({
        center,
        count: allPoints.length,
        points: allPoints,
        priority
      });

      // Mark all points in cluster as processed
      allPoints.forEach(p => 
        processed.add(`${p.latitude}-${p.longitude}`)
      );
    }
  });

  return clusters;
};

// Add named export for backward compatibility
export const detectSevereClusters = detectClusters;
