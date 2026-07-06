import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import LiveMapView from './components/LiveMapView';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import './App.css';
import './Dashboard.css';

const DashboardLayout = ({ zones, setZones, activeZoneId, setActiveZoneId }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className={`earthkit-layout ${sidebarOpen ? '' : 'sidebar-closed'}`}>
      <div className="app-container">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <Outlet context={{ zones, setZones, activeZoneId, setActiveZoneId, sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  );
};

function App() {
  const [zones, setZones] = useState([
    { id: 'zone-1', name: 'Tomato Greenhouse', lat: 14.5995, lng: 120.9842 }
  ]);
  const [activeZoneId, setActiveZoneId] = useState('zone-1');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        <Route path="/dashboard" element={<DashboardLayout zones={zones} setZones={setZones} activeZoneId={activeZoneId} setActiveZoneId={setActiveZoneId} />}>
          <Route index element={<DashboardView />} />
          <Route path="map" element={<LiveMapView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
