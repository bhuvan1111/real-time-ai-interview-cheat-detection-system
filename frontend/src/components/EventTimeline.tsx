import React from 'react';
import { MonitoringEvent } from '../types';
import {
  Clock,
  Layers,
  EyeOff,
  Clipboard,
  Zap,
  Coffee,
  CheckCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';

interface EventTimelineProps {
  events: MonitoringEvent[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
        No monitoring events recorded yet for this session.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'TAB_SWITCH':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'WINDOW_BLUR':
      case 'FOCUS_LOSS':
        return <EyeOff className="w-4 h-4 text-orange-400" />;
      case 'PASTE':
        return <Clipboard className="w-4 h-4 text-rose-400" />;
      case 'TYPING_BURST':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'INACTIVITY':
        return <Coffee className="w-4 h-4 text-slate-400" />;
      case 'HIGH_CODE_SIMILARITY':
        return <FileCode className="w-4 h-4 text-rose-400" />;
      case 'SUBMISSION':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH':
        return <span className="bg-rose-950/80 text-rose-400 border border-rose-800 text-[10px] px-1.5 py-0.5 rounded font-medium">HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-950/80 text-amber-400 border border-amber-800 text-[10px] px-1.5 py-0.5 rounded font-medium">MEDIUM</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-1.5 py-0.5 rounded font-medium">LOW</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Chronological Event Timeline</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono">{events.length} total events</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {events.map((ev, i) => {
          const date = new Date(ev.timestamp);
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return (
            <div key={ev.id || i} className="relative group">
              {/* Timeline Marker Node */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-sm">
                {getEventIcon(ev.event_type)}
              </div>

              <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-200">{ev.event_type}</span>
                    {getSeverityBadge(ev.severity)}
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.score_contribution > 0 && (
                      <span className="text-[11px] font-mono font-semibold text-amber-400">
                        +{ev.score_contribution.toFixed(0)} pts
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500">{timeStr}</span>
                  </div>
                </div>

                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400 font-mono">
                    {Object.entries(ev.metadata).map(([k, v]) => {
                      if (typeof v === 'object' && v !== null) return null;
                      return (
                        <span key={k} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {k}: <strong className="text-slate-200">{String(v)}</strong>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
