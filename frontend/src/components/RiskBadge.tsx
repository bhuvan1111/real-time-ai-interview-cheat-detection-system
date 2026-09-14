import React from 'react';
import { RiskLevel } from '../types';
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const configs = {
    LOW: {
      bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400',
      icon: ShieldCheck,
      label: 'Low Risk',
      pulse: 'bg-emerald-400'
    },
    MEDIUM: {
      bg: 'bg-amber-950/70 border-amber-500/40 text-amber-400',
      icon: AlertCircle,
      label: 'Medium Risk',
      pulse: 'bg-amber-400'
    },
    HIGH: {
      bg: 'bg-orange-950/70 border-orange-500/40 text-orange-400',
      icon: AlertTriangle,
      label: 'High Risk',
      pulse: 'bg-orange-400'
    },
    CRITICAL: {
      bg: 'bg-rose-950/80 border-rose-500/50 text-rose-400 animate-pulse',
      icon: ShieldAlert,
      label: 'Critical Risk',
      pulse: 'bg-rose-400'
    },
  };

  const current = configs[level] || configs.LOW;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${current.bg} ${sizeClasses[size]} font-medium transition-colors shadow-sm`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-mono ml-0.5 text-xs opacity-90">({score.toFixed(0)})</span>
      )}
    </span>
  );
};
