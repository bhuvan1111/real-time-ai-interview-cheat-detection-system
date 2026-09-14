import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { sessionService } from '../services/sessionService';
import { AnalyticsOverview, AssessmentSession } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskDistributionChart, EventDistributionChart } from '../components/AnalyticsCharts';
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [ovData, sessData] = await Promise.all([
        analyticsService.getOverview(),
        sessionService.getSessions(),
      ]);
      setOverview(ovData);
      setSessions(sessData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredSessions = sessions.filter((s) => {
    const candName = s.candidate?.name?.toLowerCase() || '';
    const assessTitle = s.assessment?.title?.toLowerCase() || '';
    const matchesSearch =
      candName.includes(searchTerm.toLowerCase()) ||
      assessTitle.includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || s.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Loading evaluator command center...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Evaluator Command Center</h1>
          <p className="text-xs text-slate-400">
            Real-time assessment session monitoring, behavioral analysis, and cheat risk telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/admin/live"
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-rose-600/30 transition-all"
          >
            <Activity className="w-4 h-4" />
            <span>Open Live Wall</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active Candidates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Candidates</span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-white">{overview.active_sessions}</span>
              <span className="text-xs text-slate-500">/ {overview.total_candidates} registered</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium block mt-1">Live assessment sessions</span>
          </div>

          {/* Card 2: Suspicious Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suspicious Sessions</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-amber-400">{overview.suspicious_sessions}</span>
              <span className="text-xs text-slate-500">Risk &gt;= 50</span>
            </div>
            <span className="text-[11px] text-amber-300 font-medium block mt-1">Human review recommended</span>
          </div>

          {/* Card 3: High/Critical Risk */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Risk Sessions</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-rose-400">{overview.critical_risk_sessions}</span>
              <span className="text-xs text-slate-500">Risk &gt;= 75</span>
            </div>
            <span className="text-[11px] text-rose-300 font-medium block mt-1">High anomaly density</span>
          </div>

          {/* Card 4: Avg Risk Score */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Risk Score</span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-purple-400">{overview.average_risk_score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block mt-1">{overview.total_events_processed} events processed</span>
          </div>
        </div>
      )}

      {/* Middle Grid: Analytical Charts */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 mb-1">Risk Profile Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of candidate sessions across the 4 risk tiers</p>
            <RiskDistributionChart distribution={overview.risk_level_counts} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-slate-200 mb-1">Signal Event Volumes</h3>
            <p className="text-xs text-slate-500 mb-4">Aggregated monitoring events recorded during assessments</p>
            <EventDistributionChart counts={overview.event_type_counts} />
          </div>
        </div>
      )}

      {/* Candidate Sessions Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Candidate Assessment Sessions</span>
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidate or assessment..."
                className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-56"
              />
            </div>

            {/* Risk Filter Select */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Risk Evaluation</th>
                  <th className="py-3 px-4">Key Signals</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      <div>
                        <span>{s.candidate?.name || 'Candidate'}</span>
                        <span className="block text-[11px] font-normal text-slate-500">{s.candidate?.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {s.assessment?.title || 'Coding Assessment'}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={s.risk_level} score={s.risk_score} size="md" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 space-x-2">
                      <span>{s.tab_switch_count} tabs</span>
                      <span>•</span>
                      <span>{s.large_paste_count} lg pastes</span>
                      <span>•</span>
                      <span>{Math.round(s.code_similarity_max * 100)}% sim</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          s.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/sessions/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
