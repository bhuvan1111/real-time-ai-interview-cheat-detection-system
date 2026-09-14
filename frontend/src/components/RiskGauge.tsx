import React from 'react';
import { RiskLevel } from '../types';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, size = 180 }) => {
  const safeScore = Math.max(0, Math.min(100, score));
  // Map 0-100 to angle from -180deg to 0deg (semi-circle)
  const angle = (safeScore / 100) * 180 - 90;

  const colorMap = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };

  const currentColor = colorMap[level] || colorMap.LOW;

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg
          viewBox="0 0 200 120"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * safeScore) / 100}
            className="transition-all duration-700 ease-out"
          />

          {/* Center Point */}
          <circle cx="100" cy="100" r="7" fill="#38bdf8" />
          <circle cx="100" cy="100" r="3" fill="#0f172a" />

          {/* Needle */}
          <g
            transform={`rotate(${angle} 100 100)`}
            className="transition-transform duration-700 ease-out origin-center"
          >
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="32"
              stroke="#f8fafc"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Score Readout Inside */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span
            className="text-3xl font-extrabold tracking-tight font-mono"
            style={{ color: currentColor }}
          >
            {safeScore.toFixed(0)}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </span>
        </div>
      </div>

      <div className="flex justify-between w-full max-w-[180px] text-[10px] text-slate-500 font-semibold px-2 mt-1">
        <span>0 (NORMAL)</span>
        <span>100 (ANOMALOUS)</span>
      </div>
    </div>
  );
};
