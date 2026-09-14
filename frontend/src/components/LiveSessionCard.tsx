import React from 'react';
import { AssessmentSession } from '../types';
import { RiskBadge } from './RiskBadge';
import { Layers, Clipboard, FileCode, Radio, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveSessionCardProps {
  session: AssessmentSession;
  latestEvent?: string;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({ session, latestEvent }) => {
  const isSuspicious = session.risk_level === 'HIGH' || session.risk_level === 'CRITICAL';

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-xl ${
        isSuspicious ? 'border-rose-500/50 hover:border-rose-400' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-100 text-base">
                {session.candidate?.name || 'Active Candidate'}
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {session.assessment?.title || 'Coding Assessment'}
            </p>
          </div>

          <RiskBadge level={session.risk_level} score={session.risk_score} size="sm" />
        </div>

        {/* Latest Event Banner */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Latest Signal:</span>
            <strong className="text-slate-200">{latestEvent || 'Assessment in progress'}</strong>
          </div>
        </div>

        {/* Metric Counters Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-semibold mb-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Tabs</span>
            </div>
            <span className="text-base font-bold font-mono text-slate-100">
              {session.tab_switch_count}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-semibold mb-1">
              <Clipboard className="w-3 h-3 text-rose-400" />
              <span>Pastes</span>
            </div>
            <span className="text-base font-bold font-mono text-slate-100">
              {session.large_paste_count} <span className="text-[10px] text-slate-500 font-normal">lg</span>
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] uppercase font-semibold mb-1">
              <FileCode className="w-3 h-3 text-purple-400" />
              <span>Similarity</span>
            </div>
            <span className="text-base font-bold font-mono text-slate-100">
              {Math.round(session.code_similarity_max * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Action */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Status: <strong className={isSuspicious ? 'text-rose-400' : 'text-emerald-400'}>
            {isSuspicious ? 'Review Recommended' : 'Normal'}
          </strong>
        </span>

        <Link
          to={`/admin/sessions/${session.id}`}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <span>Inspect Session</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
