import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { sessionService } from '../services/sessionService';
import { AnalyticsOverview, AssessmentSession } from '../types';
import { RiskDistributionChart, EventDistributionChart } from '../components/AnalyticsCharts';
import { RiskBadge } from '../components/RiskBadge';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, sess] = await Promise.all([
          analyticsService.getOverview(),
          sessionService.getSessions(),
        ]);
        setOverview(ov);
        setSessions(sess);
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !overview) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Compiling organizational integrity analytics...
      </div>
    );
  }

  const suspiciousRate =
    sessions.length > 0
      ? Math.round((overview.suspicious_sessions / sessions.length) * 100)
      : 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">System Analytics & Trends</h1>
        <p className="text-xs text-slate-400">
          Aggregated assessment metrics, anomaly distributions, and integrity indicators.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Suspicious Rate</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-3xl font-black font-mono text-amber-400">{suspiciousRate}%</span>
          <p className="text-[11px] text-slate-500 mt-1">Sessions with risk score &gt;= 50</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Telemetry Events</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-3xl font-black font-mono text-emerald-400">
            {overview.total_events_processed}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Real-time browser interactions evaluated</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Mean Assessment Risk</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-3xl font-black font-mono text-purple-400">
            {overview.average_risk_score} / 100
          </span>
          <p className="text-[11px] text-slate-500 mt-1">Across all candidate cohorts</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-1">Risk Tier Proportion</h3>
          <p className="text-xs text-slate-500 mb-4">Relative frequency of LOW, MEDIUM, HIGH, and CRITICAL risk sessions</p>
          <RiskDistributionChart distribution={overview.risk_level_counts} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h3 className="text-sm font-bold text-slate-200 mb-1">Event Ingestion Volumes</h3>
          <p className="text-xs text-slate-500 mb-4">Total occurrences per event type</p>
          <EventDistributionChart counts={overview.event_type_counts} />
        </div>
      </div>

      {/* Candidate Risk Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-slate-200">Candidate Session Risk Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Assessment</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Tab Switches</th>
                <th className="py-2.5 px-3">Large Pastes</th>
                <th className="py-2.5 px-3">ML Anomaly Index</th>
                <th className="py-2.5 px-3">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-semibold text-slate-100">
                    {s.candidate?.name || 'Candidate'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{s.assessment?.title}</td>
                  <td className="py-3 px-3 font-mono font-bold">{s.risk_score.toFixed(1)}</td>
                  <td className="py-3 px-3 font-mono">{s.tab_switch_count}</td>
                  <td className="py-3 px-3 font-mono">{s.large_paste_count}</td>
                  <td className="py-3 px-3 font-mono">{s.behavior_anomaly_score.toFixed(1)}</td>
                  <td className="py-3 px-3">
                    <RiskBadge level={s.risk_level} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
