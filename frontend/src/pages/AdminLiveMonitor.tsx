import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../services/sessionService';
import { AssessmentSession } from '../types';
import { LiveSessionCard } from '../components/LiveSessionCard';
import { useWebSocket } from '../hooks/useWebSocket';
import { Radio, Activity, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface LiveEventMessage {
  id: number;
  session_id: number;
  candidate_name: string;
  assessment_title: string;
  event_type: string;
  severity: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const AdminLiveMonitor: React.FC = () => {
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEventMessage[]>([]);
  const [latestEventMap, setLatestEventMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);

  const token = localStorage.getItem('token');
  const wsUrl = token ? `ws://localhost:8000/ws/admin?token=${token}` : '';

  // Handle incoming live broadcast over WebSocket
  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'LIVE_EVENT') {
      const { event, session } = msg;

      // Update session in state
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === session.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...session };
          return updated;
        } else {
          return [session, ...prev];
        }
      });

      // Update latest event string
      setLatestEventMap((prev) => ({
        ...prev,
        [session.id]: `${event.event_type} (${event.severity})`,
      }));

      // Append to live event ticker
      setLiveEvents((prev) => [event, ...prev.slice(0, 19)]); // Keep last 20
    }
  }, []);

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleWsMessage,
  });

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await sessionService.getSessions();
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const displayedSessions = activeOnly
    ? sessions.filter((s) => s.status === 'active')
    : sessions;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Connecting to live telemetry streams...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">Real-Time Monitoring Wall</h1>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  isConnected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                <span>{isConnected ? 'WebSocket Stream Live' : 'Connecting Stream...'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live updates propagate instantly without browser refresh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              activeOnly
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{activeOnly ? 'Showing Active Only' : 'Showing All Sessions'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Live Session Tiles on Left, Real-Time Event Stream on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Session Tiles Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Monitored Assessment Sessions ({displayedSessions.length})</span>
            </h2>
          </div>

          {displayedSessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
              No active assessment sessions currently streaming.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedSessions.map((session) => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  latestEvent={latestEventMap[session.id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Real-time Ticker / Feed on Right */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Live Telemetry Stream</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Incoming Feeds</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 max-h-[640px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Awaiting telemetry events from candidates...
              </div>
            ) : (
              liveEvents.map((ev, i) => (
                <div
                  key={ev.id || i}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1 hover:border-slate-700 transition-colors animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{ev.candidate_name}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        ev.severity === 'HIGH'
                          ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                          : ev.severity === 'MEDIUM'
                          ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {ev.event_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {ev.assessment_title}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
