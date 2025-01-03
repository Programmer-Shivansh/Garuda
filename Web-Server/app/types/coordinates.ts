export type PriorityLevel = 'normal' | 'severe' | 'intermediate' | 'unknown';
export interface Coordinate {
  latitude: number;
  longitude: number;
  priority: PriorityLevel;
}
export interface CoordinatesPayload {
  coordinates: Coordinate[];
}