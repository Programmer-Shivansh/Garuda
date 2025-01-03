declare global {
  interface Window {
    MapmyIndia: {
      Map: new (element: HTMLElement | string, options: {
        center: [number, number];
        zoomControl: boolean;
        zoom: number;
        hybrid: boolean;
        search?: boolean;
      }) => any;
    };
    L: {
      Marker: new (latLng: [number, number], options?: any) => {
        addTo: (map: any) => any;
        bindPopup: (content: string) => any;
        openPopup: () => void;
      };
      marker: (latLng: [number, number]) => any;
      polyline: (latlngs: [number, number][], options: any) => any;
      latLng: (lat: number, lng: number) => any;
      divIcon: (options: {
        className?: string;
        html: string;
        iconSize?: [number, number];
        iconAnchor?: [number, number];
      }) => any;
      LatLngBounds: new (bounds?: Array<[number, number]>) => {
        extend: (latLng: [number, number]) => void;
      };
      latLngBounds: (bounds?: Array<[number, number]>) => any;
      fitBounds: (bounds: any, options?: {
        padding?: [number, number];
        maxZoom?: number;
      }) => void;
      polyline: (latlngs: [number, number][], options: {
        color?: string;
        weight?: number;
        opacity?: number;
        dashArray?: string;
        lineCap?: 'round' | 'butt' | 'square';
        lineJoin?: 'round' | 'bevel' | 'miter';
      }) => {
        addTo: (map: any) => any;
        remove: () => void;
      };
      circle: (
        latlng: [number, number],
        options: {
          color: string;
          fillColor: string;
          fillOpacity: number;
          radius: number;
        }
      ) => {
        addTo: (map: any) => any;
        bindPopup: (content: string) => any;
      };
    };
  }
}

export {};
