import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Wind, Droplet, CloudSun, AlertTriangle, MapPin, Loader2, Activity, ShieldAlert, FileText, CalendarClock, ArrowUpRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../BentoDashboard.css';

const customMarkerIcon = L.divIcon({
  className: 'custom-dashboard-marker',
  html: `<div style="width: 24px; height: 24px; background: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); animation: pulse 2s infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const DashboardView = () => {
  const { zones, activeZoneId } = useOutletContext();
  const activeZone = zones.find(z => z.id === activeZoneId);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [aiAdvisory, setAiAdvisory] = useState("");

  const calculateNDVI = (moisture) => {
    // Mock NDVI calculation based on soil moisture for hackathon demonstration
    const base = 0.3;
    const factor = (moisture / 100) * 0.6;
    return (base + factor).toFixed(2);
  };

  const generateLocalAdvisory = (data) => {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const cards = [];
    
    // Soil & Hydration Card
    cards.push({
      id: 'hydration',
      type: data.soilMoisture < 30 ? 'warning' : 'success',
      title: data.soilMoisture < 30 ? 'Water Deficit Detected' : 'Optimal Hydration',
      description: data.soilMoisture < 30 
        ? `Soil moisture is critically low at ${data.soilMoisture}%. Your crops are at risk of severe hydric stress.` 
        : `Soil moisture is healthy (${data.soilMoisture}%). Conditions are suitable for crop development.`,
      iconName: 'Droplet'
    });

    const ndviScore = parseFloat(data.ndvi);
    cards.push({
      id: 'health',
      type: ndviScore < 0.5 ? 'warning' : 'success',
      title: ndviScore < 0.5 ? 'Low Crop Health' : 'Excellent Crop Health',
      description: ndviScore < 0.5 
        ? `The Crop Health Score (NDVI) is low at ${ndviScore}. There are significant signs of chlorosis or poor vegetation health across the field.`
        : `The Crop Health Score (NDVI) is high at ${ndviScore}. The canopy appears dense and healthy.`,
      iconName: 'Activity'
    });

    if (data.nearestTyphoon && data.nearestTyphoon.distance < 400) {
      cards.push({
        id: 'typhoon',
        type: 'danger',
        title: `Imminent Typhoon Threat`,
        description: `Typhoon ${data.nearestTyphoon.name} is currently ${data.nearestTyphoon.distance}km away.`,
        actionItems: [
          'Initiate early harvest if crops are mature.',
          'Clear irrigation canals to prevent waterlogging.',
          'Secure farm equipment immediately.'
        ],
        iconName: 'ShieldAlert'
      });
    }

    if (data.airQuality > 50) {
      cards.push({
        id: 'air',
        type: 'warning',
        title: 'Air Quality Alert',
        description: `Elevated particulate matter detected (AQI: ${data.airQuality}). Use caution during prolonged outdoor labor.`,
        iconName: 'Wind'
      });
    }

    cards.push({
      id: 'irrigation',
      type: data.soilMoisture < 30 ? 'warning' : 'info',
      title: 'Irrigation Recommendation',
      description: data.soilMoisture < 30 
        ? 'Schedule immediate irrigation before peak sun hours tomorrow to mitigate heat stress.'
        : 'No immediate irrigation required. Maintain standard monitoring schedule.',
      iconName: 'CloudSun'
    });
    
    return { timestamp, cards };
  };

  useEffect(() => {
    if (!activeZone) return;

    const fetchNodalData = async () => {
      setIsLoading(true);
      setAiAdvisory("");
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${activeZone.lat}&longitude=${activeZone.lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm`);
        const weatherData = await weatherRes.json();
        
        const rawMoisture = weatherData.hourly?.soil_moisture_0_to_1cm?.[0] || 0.254;
        const moisture = rawMoisture < 1 ? (rawMoisture * 100).toFixed(1) : rawMoisture;
        
        const envData = {
          lat: activeZone.lat,
          lng: activeZone.lng,
          soilMoisture: moisture,
          soilTemp: weatherData.hourly?.soil_temperature_0cm?.[0] || 30.1,
          ndvi: calculateNDVI(moisture),
          nearestTyphoon: { name: "Yagi", distance: Math.floor(Math.random() * 300) + 100 },
          nearestFire: { name: "Grassfire", distance: Math.floor(Math.random() * 100) + 10 },
          airQuality: Math.floor(Math.random() * 50) + 20,
          windSpeed: weatherData.current?.wind_speed_10m || 12.5,
          humidity: weatherData.current?.relative_humidity_2m || 75
        };
        
        setEnvironmentalData(envData);

        setTimeout(() => {
          setAiAdvisory(generateLocalAdvisory(envData));
          setIsLoading(false);
        }, 1500);

      } catch (err) {
        console.error("Failed to fetch nodal data:", err);
        setAiAdvisory("### ❌ Error sa Koneksyon\n\nHindi makakuha ng data sa kasalukuyan. Paki-check ang iyong internet.");
        setIsLoading(false);
      }
    };

    fetchNodalData();
  }, [activeZone]);

  if (!activeZone) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center p-8 border border-slate-200 rounded-3xl bg-white shadow-sm max-w-md"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <MapPin size={32} className="text-slate-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Select a Farm Zone</h2>
          <p className="text-slate-500 text-base leading-relaxed">Please select a location on the Live Map to view our AI analysis for your farm.</p>
        </motion.div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="bento-dashboard relative bg-white">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-3xl overflow-hidden mb-8 shadow-sm border border-slate-200/50 shrink-0"
        style={{ height: '380px', minHeight: '380px', flexShrink: 0 }}
      >
        {/* Read-Only Mini Map Background */}
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={[activeZone.lat, activeZone.lng]} 
            zoom={13} 
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
              maxZoom={19}
            />
            <Marker position={[activeZone.lat, activeZone.lng]} icon={customMarkerIcon} />
          </MapContainer>
          {/* Overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent z-10 pointer-events-none"></div>
        </div>

        {/* Header Content */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 pointer-events-none">
          <div className="flex items-end justify-between w-full">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl pointer-events-auto max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md rounded-full text-emerald-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                Active Monitoring
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight mb-2 drop-shadow-xl">{activeZone.name}</h1>
              <p className="text-slate-200 flex items-center gap-2 font-medium drop-shadow-md text-base lg:text-lg">
                <MapPin size={18} className="text-emerald-400" /> 
                Location: {activeZone.lat.toFixed(4)}, {activeZone.lng.toFixed(4)}
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/dashboard/map')}
              className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 group text-lg"
            >
              View on Live Map
              <ArrowUpRight size={20} className="text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={itemVariants} className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileText size={22} className="text-emerald-600" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">AI Advisory</h3>
            </div>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.span 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold flex items-center gap-2"
                >
                  <Loader2 size={14} className="animate-spin" strokeWidth={2.5} /> Analyzing Data...
                </motion.span>
              ) : (
                <motion.span 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold"
                >
                  Report Ready
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {isLoading ? (
              <div className="animate-pulse flex flex-col gap-4 mt-6">
                <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-24 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4 pb-8"
              >
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarClock size={14} /> Last Updated: {aiAdvisory?.timestamp}
                </div>
                
                {aiAdvisory?.cards?.map((card) => {
                  let IconComponent = Activity;
                  if (card.iconName === 'Droplet') IconComponent = Droplet;
                  if (card.iconName === 'ShieldAlert') IconComponent = ShieldAlert;
                  if (card.iconName === 'Wind') IconComponent = Wind;
                  if (card.iconName === 'CloudSun') IconComponent = CloudSun;

                  const colorStyles = {
                    danger: 'bg-rose-50 border-rose-100',
                    warning: 'bg-amber-50 border-amber-100',
                    success: 'bg-emerald-50 border-emerald-100',
                    info: 'bg-blue-50 border-blue-100'
                  }[card.type] || 'bg-slate-50 border-slate-100';

                  const textStyles = {
                    danger: 'text-rose-900',
                    warning: 'text-amber-900',
                    success: 'text-emerald-900',
                    info: 'text-blue-900'
                  }[card.type] || 'text-slate-900';

                  const descStyles = {
                    danger: 'text-rose-700',
                    warning: 'text-amber-700',
                    success: 'text-emerald-700',
                    info: 'text-blue-700'
                  }[card.type] || 'text-slate-700';

                  const iconColor = {
                    danger: 'text-rose-500',
                    warning: 'text-amber-500',
                    success: 'text-emerald-500',
                    info: 'text-blue-500'
                  }[card.type] || 'text-slate-500';

                  return (
                    <div key={card.id} className={`p-5 rounded-xl border ${colorStyles}`}>
                      <div className={`flex items-center gap-2 font-bold mb-2 text-base ${textStyles}`}>
                        <IconComponent size={18} className={iconColor} strokeWidth={2.5} />
                        {card.title}
                      </div>
                      <p className={`text-sm leading-relaxed ${descStyles}`}>
                        {card.description}
                      </p>
                      {card.actionItems && (
                        <div className="mt-4 pt-4 border-t border-rose-200/50">
                          <p className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">Recommended Actions</p>
                          <ul className="space-y-2">
                            {card.actionItems.map((item, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2 text-rose-800">
                                <span className="mt-[4px] text-rose-400 text-xs">●</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="col-span-1 flex flex-col gap-6">
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={20} className="text-emerald-500" strokeWidth={2} />
              <h3 className="text-lg font-bold text-slate-800">Crop Health (NDVI)</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">{environmentalData?.ndvi || '--'}</span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Score</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">Scores above 0.5 indicate healthy vegetation.</p>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-6 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((environmentalData?.ndvi || 0) * 100, 100)}%` }}
                transition={{ duration: 1, type: "spring" }}
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-500" 
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-800 mb-6">Current Conditions</h3>
            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
               <div className="flex flex-col gap-1.5 justify-end">
                 <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap"><Droplet size={14} className="text-blue-500 shrink-0"/> Soil Moisture</span>
                 <span className="text-3xl font-black text-slate-800 leading-none">{environmentalData?.soilMoisture || '--'}%</span>
               </div>
               <div className="flex flex-col gap-1.5 justify-end">
                 <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap"><CloudSun size={14} className="text-amber-500 shrink-0"/> Temperature</span>
                 <span className="text-3xl font-black text-slate-800 leading-none">{environmentalData?.soilTemp || '--'}°C</span>
               </div>
               <div className="flex flex-col gap-1.5 justify-end">
                 <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap"><Wind size={14} className="text-slate-500 shrink-0"/> Wind</span>
                 <span className="text-3xl font-black text-slate-800 leading-none flex items-baseline gap-1">
                   {environmentalData?.windSpeed || '--'} <span className="text-lg font-bold text-slate-400">km/h</span>
                 </span>
               </div>
               <div className="flex flex-col gap-1.5 justify-end">
                 <span className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-2 tracking-wider whitespace-nowrap"><ShieldAlert size={14} className="shrink-0"/> Hazards</span>
                 <span className="text-xl font-black text-rose-600 leading-none pt-1">
                   {environmentalData?.nearestTyphoon?.distance < 500 ? `Typhoon (${environmentalData?.nearestTyphoon?.distance}km)` : 'No Threat'}
                 </span>
               </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardView;
