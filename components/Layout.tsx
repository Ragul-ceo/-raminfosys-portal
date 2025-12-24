
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import Logo from './Logo';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, onTabChange, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const isHR = user.role === UserRole.HR;
  const canManage = isAdmin || isHR;

  const NavItem = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => { onTabChange(id); setIsMobileMenuOpen(false); }}
      className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${
        activeTab === id 
        ? 'bg-[#00599f] text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe]">
      {/* GLOBAL HEADER */}
      <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 lg:px-12 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo className="h-14 w-auto cursor-pointer" onClick={() => onTabChange('OVERVIEW')} />
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavItem id="OVERVIEW" label="Dashboard" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
              <NavItem id="TASKS" label="Planner" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
              <NavItem id="LEAVES" label="Absence" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
              {canManage && (
                <NavItem id="EMPLOYEES" label="Personnel" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[13px] font-black text-slate-900 font-jakarta">{user.name}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role} GATEWAY</span>
            </div>
            
            <button 
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Exit
            </button>

            {/* Mobile Toggle */}
            <button 
              className="lg:hidden p-2 text-slate-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 p-6 flex flex-col gap-2 shadow-2xl animate-in slide-in-from-top-4">
            <NavItem id="OVERVIEW" label="Dashboard" icon={<div />} />
            <NavItem id="TASKS" label="Planner" icon={<div />} />
            <NavItem id="LEAVES" label="Absence" icon={<div />} />
            {canManage && <NavItem id="EMPLOYEES" label="Personnel" icon={<div />} />}
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* GLOBAL FOOTER */}
      <footer className="px-12 py-8 bg-white border-t border-slate-50 text-center">
        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">Ram Infosys Enterprise Infrastructure • Node v5.4.0</p>
      </footer>
    </div>
  );
};

const SectionTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 px-4 ${className}`}>{children}</div>
);

const SidebarLink = ({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick: () => void }) => (
  <div onClick={onClick} className={`flex items-center gap-5 px-6 py-5 rounded-2xl cursor-pointer transition-all duration-500 group relative ${active ? 'bg-gradient-to-r from-[#00599f] to-[#004a85] text-white shadow-2xl shadow-blue-900/40 -translate-y-0.5' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
    <span className="transition-transform group-hover:scale-125"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}></path></svg></span>
    <span className="text-[12px] font-black uppercase tracking-[0.15em]">{label}</span>
    {active && <span className="absolute right-4 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_white]"></span>}
  </div>
);

export default Layout;
