export interface GalliMapOptions {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  accessToken: string;
}

export interface GalliMarkerOptions {
  coordinates: [number, number];
  element: string;
}

export interface GalliPolylineOptions {
  coordinates: [number, number][];
  color: string;
  width: number;
  opacity: number;
  dashArray: number[];
}

export interface GalliCircleOptions {
  center: [number, number];
  color: string;
  fillColor: string;
  fillOpacity: number;
  radius: number;
}
