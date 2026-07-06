import React from 'react';

const MapView = () => {
  return (
    <main className="main-content">
      {/* Top Search Bar Area */}
      <header className="top-header">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Go to Location" />
        </div>
      </header>

      {/* Map / Data Visualization Area */}
      <div className="map-area">
        {/* Placeholder for Mapbox/Leaflet */}
        <div className="placeholder-map" style={{ opacity: 0.2 }}>
          {/* We will leave this blank to match the minimalist white look,
              or later mount the actual Mapbox instance here */}
        </div>
        
        {/* Floating Agent Button (bottom left) */}
        <div className="floating-agent-btn">
          EarthKit Agent
        </div>

        {/* Coordinates Widget (bottom right) */}
        <div className="coordinates-widget">
          <p>Lat: 51.12200380</p>
          <p>Lon: -104.48700250</p>
        </div>
      </div>
    </main>
  );
};

export default MapView;
