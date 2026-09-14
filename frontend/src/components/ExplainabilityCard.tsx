import React from 'react';
import { RiskLevel } from '../types';
import { AlertTriangle, CheckCircle2, UserCheck, Shield, HelpCircle } from 'lucide-react';

interface ExplainabilityCardProps {
  score: number;
  level: RiskLevel;
  reasons: string[];
  anomalyScore?: number;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  score,
  level,
  reasons,
  anomalyScore,
}) => {
  const isHighOrCritical = level === 'HIGH' || level === 'CRITICAL';
  const isMedium = level === 'MEDIUM';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Explainable Detection Rationale</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Non-Accusatory Analysis</span>
        </div>
      </div>

      {/* Human Review Recommendation Banner */}
      <div
        className={`p-3.5 rounded-lg border flex items-start gap-3 ${
          isHighOrCritical
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            : isMedium
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
        }`}
      >
        {isHighOrCritical ? (
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
        ) : isMedium ? (
          <UserCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          <strong className="block font-semibold text-sm mb-0.5">
            {isHighOrCritical
              ? 'Multiple Anomalous Signals Detected — Human Review Recommended'
              : isMedium
              ? 'Moderate Activity Variations Observed — Discretionary Review'
              : 'Typical Assessment Interaction — Activity Within Normal Parameters'}
          </strong>
          <span>
            {isHighOrCritical
              ? 'This system flags statistical anomalies and unusual interaction patterns. It does NOT assert definitive cheating. A qualified human evaluator should review the code submission and context.'
              : isMedium
              ? 'Occasional focus shifts or pastes were detected. These may represent benign research or editor habits.'
              : 'No significant behavioral outliers or abnormal code patterns were detected for this candidate.'}
          </span>
        </div>
      </div>

      {/* Breakdown of contributing reasons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
          Contributing Evidence & Signals ({reasons.length})
        </span>
        <ul className="space-y-2 text-xs text-slate-300">
          {reasons.map((reason, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <span className="leading-normal">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {anomalyScore !== undefined && anomalyScore > 0 && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80 text-slate-400">
          <span>Isolation Forest Anomaly Index:</span>
          <span className="font-mono font-semibold text-slate-200">{anomalyScore.toFixed(1)} / 100</span>
        </div>
      )}
    </div>
  );
};
