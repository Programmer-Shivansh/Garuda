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
        Marker: new (latLng: [number, number]) => {
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
      };
    }
  }
  
  export {}
}