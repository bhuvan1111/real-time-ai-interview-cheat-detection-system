import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { RiskTimelinePoint } from '../types';

interface RiskDistributionProps {
  distribution: Record<string, number>;
}

export const RiskDistributionChart: React.FC<RiskDistributionProps> = ({ distribution }) => {
  const data = [
    { name: 'Low Risk', value: distribution.LOW || 0, color: '#10b981' },
    { name: 'Medium Risk', value: distribution.MEDIUM || 0, color: '#f59e0b' },
    { name: 'High Risk', value: distribution.HIGH || 0, color: '#f97316' },
    { name: 'Critical Risk', value: distribution.CRITICAL || 0, color: '#ef4444' },
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface EventDistributionProps {
  counts: Record<string, number>;
}

export const EventDistributionChart: React.FC<EventDistributionProps> = ({ counts }) => {
  const data = Object.entries(counts).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={10}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface SessionTimelineChartProps {
  timeline: RiskTimelinePoint[];
}

export const SessionTimelineChart: React.FC<SessionTimelineChartProps> = ({ timeline }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timeline} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
          />
          <Line
            type="monotone"
            dataKey="risk_score"
            name="Risk Score"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 4, fill: '#f97316' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
