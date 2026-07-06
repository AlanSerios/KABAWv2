import React, { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PlusCircle, List } from '@phosphor-icons/react';
import WindVelocityLayer from './WindVelocityLayer';

// Disable default icons completely since we use custom ones
delete L.Icon.Default.prototype._getIconUrl;

// Custom animated marker generator
const createCustomMarker = (isActive) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container ${isActive ? 'marker-active' : 'marker-inactive'}">
        <div class="marker-core"></div>
        <div class="marker-pulse"></div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const MapResizer = ({ sidebarOpen }) => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timeout);
  }, [sidebarOpen, map]);
  return null;
};

const LiveMapView = () => {
  const { zones, setZones, activeZoneId, setActiveZoneId, sidebarOpen, setSidebarOpen } = useOutletContext();
  const [addingNode, setAddingNode] = useState(false);
  const [pendingNodeCoords, setPendingNodeCoords] = useState(null);
  const [newZoneName, setNewZoneName] = useState("");
  const [showWind, setShowWind] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Sentinel-2 Mock State
  const [isScanning, setIsScanning] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 1000
    });

    tl.add({
      targets: mapContainerRef.current,
      opacity: [0, 1],
      scale: [0.98, 1],
      duration: 1200
    });
  }, []);

  const MapEventsHandler = () => {
    const map = useMapEvents({
      click(e) {
        if (!addingNode) return;
        setPendingNodeCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setAddingNode(false);
      },
      zoomend() {
        if (map.getZoom() > 8) {
          setShowWind(false);
        } else {
          setShowWind(true);
        }
      }
    });
    return null;
  };

  const handleDeploySensor = () => {
    if (newZoneName.trim() && pendingNodeCoords) {
      const newZone = {
        id: 'zone-' + Date.now(),
        name: newZoneName,
        lat: pendingNodeCoords.lat,
        lng: pendingNodeCoords.lng
      };
      setZones([...zones, newZone]);
      setActiveZoneId(newZone.id);
      
      setNotification("Plot successfully mapped. You can now run a Sentinel-2 Analysis.");
      setTimeout(() => setNotification(null), 5000);
    }
    setPendingNodeCoords(null);
    setNewZoneName("");
  };

  const handleRunAnalysis = async (zone) => {
    setIsScanning(true);
    
    let isWater = false;
    let isUrban = false;
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${zone.lat}&lon=${zone.lng}&zoom=18`);
      const data = await res.json();
      const type = data.type || "";
      const classType = data.class || "";
      
      if (classType === 'water' || type === 'water' || type === 'sea' || type === 'ocean') isWater = true;
      if (classType === 'building' || classType === 'highway' || type === 'city' || type === 'town') isUrban = true;
      if (!data.address) isWater = true; // Often open ocean has no address
    } catch (e) {
      console.error(e);
    }
    
    setTimeout(() => {
      setIsScanning(false);
      setActiveReport({
        ...zone,
        type: isWater ? 'water' : isUrban ? 'urban' : 'crop'
      });
    }, 2000);
  };

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ flex: 1, position: 'relative', opacity: 0, height: '100%', width: '100%' }} ref={mapContainerRef}>
        <MapContainer center={[14.5995, 120.9842]} zoom={6} style={{ width: '100%', height: '100%', zIndex: 0 }}>
          {/* Google Maps Hybrid (Satellite + Labels) */}
          <TileLayer
            url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            attribution="&copy; Google Maps"
            maxZoom={20}
            keepBuffer={16}
            updateWhenZooming={false}
          />

          {showWind && <WindVelocityLayer />}
          <MapResizer sidebarOpen={sidebarOpen} />
          <MapEventsHandler />
          
          {zones.map((zone) => (
            <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={createCustomMarker(zone.id === activeZoneId)}>
              <Popup>
                <div className="custom-popup-content">
                  <strong>{zone.name}</strong>
                  <br />
                  <span style={{ color: zone.id === activeZoneId ? '#10b981' : '#94a3b8', fontWeight: 'bold' }}>
                    {zone.id === activeZoneId ? 'Active Dashboard Zone' : 'Inactive'}
                  </span>
                  
                  <div className="mock-stats">
                    <span>Battery: 98%</span>
                    <span>Signal: Strong</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <button 
                      onClick={() => setActiveZoneId(zone.id)}
                      style={{ 
                        padding: '8px 16px', background: '#f1f5f9', 
                        color: '#0f172a', border: 'none', borderRadius: '6px', 
                        cursor: 'pointer', width: '100%', fontWeight: '600',
                        transition: 'background 0.2s'
                      }}
                    >
                      Select Zone
                    </button>
                    
                    <button 
                      onClick={() => handleRunAnalysis(zone)}
                      style={{ 
                        padding: '8px 16px', background: '#10b981', 
                        color: 'white', border: 'none', borderRadius: '6px', 
                        cursor: 'pointer', width: '100%', fontWeight: '600',
                        transition: 'background 0.2s'
                      }}
                    >
                      Run Sentinel-2 Scan
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          {activeZoneId && zones.find(z => z.id === activeZoneId) && (
            <Rectangle 
              bounds={[
                [zones.find(z => z.id === activeZoneId).lat - (25 / 111320), zones.find(z => z.id === activeZoneId).lng - (25 / (111320 * Math.cos((zones.find(z => z.id === activeZoneId).lat * Math.PI) / 180)))],
                [zones.find(z => z.id === activeZoneId).lat + (25 / 111320), zones.find(z => z.id === activeZoneId).lng + (25 / (111320 * Math.cos((zones.find(z => z.id === activeZoneId).lat * Math.PI) / 180)))]
              ]} 
              pathOptions={{ color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.2 }} 
            />
          )}
        </MapContainer>

        {/* Floating Top Controls */}
        {notification && (
          <div style={{
            position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)',
            background: '#ffffff', color: '#0f172a', padding: '12px 24px',
            borderRadius: '8px', zIndex: 1100, fontWeight: '600', boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.3s forwards', border: '1px solid #e2e8f0'
          }}>
            {notification}
          </div>
        )}

        <div style={{
          position: 'absolute', top: '24px', left: '24px', right: '24px', 
          display: 'flex', justifyContent: 'space-between', zIndex: 1000, pointerEvents: 'none'
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            {!sidebarOpen && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)', padding: '12px', borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }} onClick={() => setSidebarOpen(true)}>
                <List size={28} color="#0f172a" />
              </div>
            )}
          </div>
          <div style={{ pointerEvents: 'auto' }}>
            <button 
              style={{ 
                width: 'auto', padding: '12px 28px', 
                background: addingNode ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none', borderRadius: '999px',
                boxShadow: addingNode ? '0 8px 20px rgba(234, 88, 12, 0.3)' : '0 8px 20px rgba(16, 185, 129, 0.3)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: addingNode ? 'scale(0.98)' : 'scale(1)'
              }}
              onClick={() => setAddingNode(!addingNode)}
            >
              <PlusCircle size={22} weight={addingNode ? "fill" : "bold"} /> 
              {addingNode ? "Click on map to drop pin..." : "Plot New Sensor Node"}
            </button>
          </div>
        </div>

        {/* Simple Custom Wind Legend */}
        <div style={{
          position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.9)', padding: '16px', borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'Inter, sans-serif'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0f172a' }}>Wind Speed (m/s)</h4>
          <div style={{ height: '8px', width: '200px', borderRadius: '4px', background: 'linear-gradient(to right, #00ffff, #00ff00, #ffff00, #ff9900, #ff0000)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
            <span>Calm</span>
            <span>Breeze</span>
            <span>Gale</span>
            <span>Storm</span>
          </div>
        </div>

        {/* Custom Node Creation Modal Overlay */}
        {pendingNodeCoords && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Deploy New Sensor Node</h3>
              <input 
                type="text" 
                placeholder="Sensor Name (e.g., North Field Moisture)" 
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => { setPendingNodeCoords(null); setNewZoneName(""); }}>Cancel</button>
                <button className="btn-primary" onClick={handleDeploySensor}>Deploy Sensor</button>
              </div>
            </div>
          </div>
        )}

        {/* Sentinel-2 Scanning Effect Overlay */}
        {isScanning && (
          <div className="sentinel-scan-overlay">
            <div className="sentinel-scan-line"></div>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              color: 'white', fontSize: '1.5rem', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              Initializing Sentinel-2 Orbital Scan...
            </div>
          </div>
        )}

        {/* Sentinel-2 Report Modal */}
        {activeReport && (
          <div className="modal-overlay">
            <div className="sentinel-report-card" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: '#0f172a' }}>Sentinel-2 Analysis</h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                  {activeReport.name} ({activeReport.type === 'crop' ? 'Agriculture' : activeReport.type})
                </span>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>NDVI Score (Vegetation Health)</span>
                  <span style={{ fontWeight: 'bold', color: activeReport.type === 'crop' ? '#10b981' : '#f43f5e' }}>
                    {activeReport.type === 'crop' ? '0.82' : activeReport.type === 'water' ? '-0.15' : '0.12'}
                  </span>
                </div>
                <div className="index-bar-container">
                  <div className="index-bar-fill" style={{ width: activeReport.type === 'crop' ? '82%' : activeReport.type === 'water' ? '0%' : '12%', background: activeReport.type === 'crop' ? 'linear-gradient(90deg, #fcd34d, #10b981)' : '#cbd5e1' }}></div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                  {activeReport.type === 'crop' ? 'High vegetation vigor detected. Crops appear healthy.' : activeReport.type === 'water' ? 'No vegetation detected (Water Body).' : 'Low vegetation (Urban/Barren area).'}
                </p>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#334155' }}>NDWI Score (Water Stress)</span>
                  <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                    {activeReport.type === 'water' ? '0.95' : activeReport.type === 'crop' ? '0.45' : '0.05'}
                  </span>
                </div>
                <div className="index-bar-container">
                  <div className="index-bar-fill" style={{ width: activeReport.type === 'water' ? '95%' : activeReport.type === 'crop' ? '45%' : '5%', background: 'linear-gradient(90deg, #93c5fd, #3b82f6)' }}></div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                  {activeReport.type === 'water' ? 'Deep water body detected.' : activeReport.type === 'crop' ? 'Adequate crop moisture levels.' : 'Dry area detected.'}
                </p>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setActiveReport(null)}>Close Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMapView;
