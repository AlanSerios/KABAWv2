import React from 'react';
import { List, SquaresFour, ChartLineUp, MapTrifold, Lifebuoy, Gear, CaretDown, PlusCircle } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import textLogo from '../assets/kabaw_text_logo.png';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <SquaresFour size={20} weight="fill" /> },
    { label: 'Live Map', path: '/dashboard/map', icon: <MapTrifold size={20} /> },
    { label: 'Analytics', path: '/dashboard/analytics', icon: <ChartLineUp size={20} /> },
    { label: 'Support Tickets', path: '/dashboard/support', icon: <Lifebuoy size={20} /> },
  ];

  return (
    <div className="sidebar">
      <div className="logo-area">
        <List size={24} color="#0f172a" style={{ cursor: 'pointer' }} onClick={() => setSidebarOpen(!sidebarOpen)} />
        <img src={textLogo} alt="KABAW.net" style={{ height: '18px', marginLeft: '4px' }} />
      </div>
      
      <ul className="nav-links" style={{ listStyle: 'none', padding: 0 }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
          return (
            <li 
              key={index} 
              className={isActive ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              {item.label}
            </li>
          );
        })}
        <li style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Gear size={20} /> System Settings
          </div>
          <CaretDown size={16} />
        </li>
      </ul>

      <div className="sidebar-bottom">
        <button className="upload-btn">
          <PlusCircle size={20} weight="bold" /> Add Sensor Node
        </button>

        <div className="user-block">
          <div className="user-block-avatar">
            <span style={{ fontWeight: '700', color: '#0f172a' }}>A</span>
          </div>
          <div className="user-block-info">
            <span className="name">Admin</span>
            <span className="role">Admin Account</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
