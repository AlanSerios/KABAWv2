import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import 'leaflet-velocity';

const WindVelocityLayer = () => {
  const map = useMap();

  useEffect(() => {
    let velocityLayer = null;

    fetch('https://onaci.github.io/leaflet-velocity/wind-global.json')
      .then(response => response.json())
      .then(data => {
        velocityLayer = L.velocityLayer({
          displayValues: false,
          displayOptions: {
            velocityType: 'Global Wind',
            displayPosition: 'bottomleft',
            displayEmptyString: 'No wind data'
          },
          data: data,
          maxVelocity: 15,
          velocityScale: 0.008, // Balanced speed
          particleMultiplier: 1 / 250, // Balanced density
          lineWidth: 1.2, // Balanced thickness
          colorScale: [
            "#00ffff", // Cyan for slow
            "#00ff00", // Green for med
            "#ffff00", // Yellow for fast
            "#ff9900", // Orange for very fast
            "#ff0000"  // Red for extreme
          ]
        });

        // Add to map only if component hasn't unmounted while fetching
        if (map) {
          velocityLayer.addTo(map);
        }
      })
      .catch(error => console.error("Error loading wind data:", error));

    return () => {
      if (velocityLayer && map) {
        map.removeLayer(velocityLayer);
      }
    };
  }, [map]);

  return null;
};

export default WindVelocityLayer;
