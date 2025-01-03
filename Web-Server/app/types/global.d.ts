declare global {
  interface Window {
    MapmyIndia: {
      Map: new (element: HTMLElement | string, options: {
        center: [number, number];
        zoomControl: boolean;
        zoom: number;
        hybrid: boolean;
        search?: boolean;
        minZoom?: number;  // Add minZoom option
        maxZoom?: number;  // Add maxZoom option
      }) => any;
    };
    L: typeof import('leaflet');
  }
}

export {};
