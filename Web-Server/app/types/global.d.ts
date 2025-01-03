import type { GalliMapOptions, GalliMarkerOptions, GalliPolylineOptions, GalliCircleOptions } from './map';

declare global {
  interface Window {
    Galli?: {
      Map: new (options: GalliMapOptions) => any;
      Marker: new (options: GalliMarkerOptions) => any;
      Icon: any;
      Polyline: new (options: GalliPolylineOptions) => any;
      Circle: new (options: GalliCircleOptions) => any;
      LatLng: new (lat: number, lng: number) => any;
      LatLngBounds: new (corner1: [number, number], corner2: [number, number]) => any;
    };
  }
}

export {};
