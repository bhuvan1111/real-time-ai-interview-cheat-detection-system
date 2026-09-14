import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, LogOut, Radio, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  wsConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ wsConnected = true }) => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">BhuvanGuard AI</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AI Monitor
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Explainable Cheat Detection Platform</p>
        </div>
      </Link>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real-time Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-xs">
          <span className="flex h-2 w-2 relative">
            {wsConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
            )}
          </span>
          <span className="text-slate-300 font-mono text-[11px]">
            {wsConnected ? 'Real-Time Stream Active' : 'Offline / Polling'}
          </span>
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  {isAdmin ? 'Lead Evaluator' : 'Candidate'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
