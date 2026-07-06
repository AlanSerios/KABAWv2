import React, { useState, useEffect } from 'react';
import { WMSTileLayer } from 'react-leaflet';

const AnimatedNASAOverlay = ({ layer, opacity, dates }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % dates.length);
    }, 1500); // Change frame every 1.5 seconds

    return () => clearInterval(interval);
  }, [dates.length]);

  return (
    <>
      {dates.map((date, index) => {
        // Pre-load all layers but only make the active one visible
        const isVisible = index === activeIndex;
        return (
          <WMSTileLayer
            key={`${layer}-${date}`}
            url="https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi"
            layers={layer}
            format="image/png"
            transparent={true}
            opacity={isVisible ? opacity : 0}
            time={date}
            attribution="&copy; NASA GIBS"
            keepBuffer={16}
            updateWhenZooming={false}
          />
        );
      })}
      
      {/* Date Indicator Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.9)',
        color: '#1e293b',
        padding: '8px 16px',
        borderRadius: '20px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#ef4444',
          animation: 'pulse 2s infinite'
        }} />
        Historical Data: {dates[activeIndex]}
      </div>
    </>
  );
};

export default AnimatedNASAOverlay;
