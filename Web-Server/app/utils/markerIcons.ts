export const createMarkerIcon = (color: string) => {
  return `
    <div class="relative">
      <!-- Marker Pin -->
      <div style="
        width: 30px;
        height: 30px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
        position: relative;
        z-index: 1;
      "></div>
      
      <!-- Pin Bottom -->
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid ${color};
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
        z-index: 0;
      "></div>
      
      <!-- Shadow -->
      <div style="
        position: absolute;
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 6px;
        background: rgba(0,0,0,0.2);
        border-radius: 50%;
        filter: blur(2px);
        z-index: -1;
      "></div>
    </div>
  `;
};

export const createCurrentLocationIcon = () => {
  return `
    <div class="relative">
      <!-- Outer Ring -->
      <div style="
        width: 36px;
        height: 36px;
        background-color: rgba(37, 99, 235, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Inner Circle -->
        <div style="
          width: 16px;
          height: 16px;
          background-color: rgb(37, 99, 235);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>
      </div>
      
      <!-- Pulse Animation -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 36px;
        height: 36px;
        background-color: rgb(37, 99, 235);
        border-radius: 50%;
        opacity: 0.4;
        animation: pulse 2s infinite;
      "></div>
    </div>
    
    <style>
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.4;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
    </style>
  `;
};
