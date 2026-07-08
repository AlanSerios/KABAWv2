import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, LayoutDashboard, Map as MapIcon, Inbox, Activity, 
  Settings, LogOut, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Command, X,
  FolderKanban, Users, Globe, CreditCard, Terminal, Blocks, Hash, Calendar
} from 'lucide-react';

import { SidebarNav, flatMockData } from './ui/dashboard-sidebar';

export default function AppLayout({ zones, setZones, activeZoneId, setActiveZoneId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState('Kabaw Admin');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = flatMockData.find(i => i.path === location.pathname) || flatMockData.find(i => i.id === 'home');
  const activeTitle = activeItem ? activeItem.title : 'Dashboard';

  const handleSelect = (id, path) => {
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className="flex w-full h-screen bg-slate-100 overflow-hidden font-sans">
      <div 
        className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-slate-50 border-r border-slate-200 ${
          isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
        }`}
      >
        <SidebarNav 
          className="w-[260px] border-none bg-transparent" 
          activeId={activeItem?.id}
          onSelect={handleSelect}
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={setActiveWorkspace}
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 bg-white relative">
         <div className="h-14 border-b border-slate-200 flex items-center px-4 justify-between bg-white shrink-0 z-10 relative">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsOpen(!isOpen)}
               className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
             >
               {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
             </button>
             <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
               <span className="truncate">{activeWorkspace}</span>
               <span className="text-slate-300">/</span>
               <span className="text-slate-900 truncate">{activeTitle}</span>
             </div>
           </div>
           
           <div className="flex items-center gap-3 relative">
           </div>
         </div>

         <div className="flex-1 flex flex-col min-h-0 relative z-0 bg-[#FAFAFA]">
           <Outlet context={{ zones, setZones, activeZoneId, setActiveZoneId }} />
         </div>
      </div>

      {isSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 border-b border-slate-200">
              <Search className="w-[18px] h-[18px] text-slate-400 mr-3 shrink-0" strokeWidth={1.5} />
              <input 
                autoFocus
                className="flex-1 bg-transparent py-4 outline-none text-[14px] text-slate-900 placeholder:text-slate-400 font-sans"
                placeholder="Search projects, docs, or actions..."
              />
              <kbd 
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-[4px] cursor-pointer hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                ESC
              </kbd>
            </div>
            <div className="p-2 py-8 flex flex-col items-center justify-center bg-slate-50/50">
               <Command className="w-6 h-6 text-slate-300 mb-2" strokeWidth={1.5} />
               <p className="text-[13px] text-slate-500 font-medium">Type a command or search...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
