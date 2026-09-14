import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Radio,
  FileCode2,
  Users,
  BarChart3,
  CheckSquare,
  History,
  ShieldAlert
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  const adminLinks: NavItem[] = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/live', label: 'Live Monitoring', icon: Radio, badge: 'Realtime' },
    { to: '/admin/assessments', label: 'Assessments', icon: FileCode2 },
    { to: '/admin/sessions', label: 'Candidate Sessions', icon: Users },
    { to: '/admin/analytics', label: 'Analytics & Trends', icon: BarChart3 },
  ];

  const candidateLinks: NavItem[] = [
    { to: '/candidate', label: 'My Assessments', icon: LayoutDashboard },
    { to: '/candidate/history', label: 'Session History', icon: History },
  ];

  const links = isAdmin ? adminLinks : candidateLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-6 px-4 select-none shrink-0">
      <div className="space-y-6">
        <div className="px-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            {isAdmin ? 'Evaluation Console' : 'Candidate Workspace'}
          </span>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin' || link.to === '/candidate'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Safety Notice in Sidebar */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Ethics & Privacy</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          No keystroke text or clipboard content stored. All algorithmic scores require human review.
        </p>
      </div>
    </aside>
  );
};
