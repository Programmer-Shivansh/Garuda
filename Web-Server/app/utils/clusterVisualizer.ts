import type { Cluster } from '../types/coordinates';

export const getClusterColor = (priority: string): string => {
  switch (priority.toLowerCase()) {
    case 'severe':
      return '#ff0000';
    case 'intermediate':
      return '#ffa500';
    case 'normal':
      return '#00ff00';
    default:
      return '#808080';
  }
};

export const getClusterOpacity = (count: number): number => {
  // Increase opacity based on cluster size
  const baseOpacity = 0.3;
  const maxOpacity = 0.7;
  const opacityIncrement = Math.min((count - 10) * 0.02, maxOpacity - baseOpacity);
  return baseOpacity + opacityIncrement;
};

export const createClusterCircle = (
  mapInstance: any,
  cluster: Cluster,
  onClick?: (cluster: Cluster) => void
) => {
  if (!mapInstance) return null;

  const color = getClusterColor(cluster.priority);
  const opacity = getClusterOpacity(cluster.points.length);

  return mapInstance.drawCircle({
    center: [cluster.centerLat, cluster.centerLng],
    radius: 100, // meters
    color,
    opacity,
    fillColor: color,
    fillOpacity: opacity * 0.5,
    weight: 2,
    clickable: true,
    onClick: onClick ? () => onClick(cluster) : undefined
  });
};
