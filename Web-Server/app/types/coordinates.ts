export type PriorityLevel = 'severe' | 'intermediate' | 'normal' | 'unknown';

export interface Coordinate {
  id?: string;
  latitude: number;
  longitude: number;
  priority: PriorityLevel;
  createdAt?: Date;
  clusterId?: string | null;
}

export interface Cluster {
  id: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  priority: PriorityLevel;
  points: Coordinate[];
}

export interface CoordinatesPayload {
  coordinates: Coordinate[];
}
