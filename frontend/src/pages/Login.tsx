import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Route based on role
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/candidate');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">BhuvanGuard AI</h1>
          <p className="text-xs text-slate-400">
            Real-Time Non-Invasive Assessment Cheat Detection System
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="evaluator@interview.ai or candidate@test.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm transition-all mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Fill Badges */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Click Demo Profiles:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@interview.ai', 'AdminPass123!')}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-left text-xs transition-colors"
            >
              <strong className="block text-emerald-400 font-semibold">Admin Evaluator</strong>
              <span className="text-[10px] text-slate-400">admin@interview.ai</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('alice@candidate.com', 'CandidatePass123!')}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-left text-xs transition-colors"
            >
              <strong className="block text-blue-400 font-semibold">Candidate Alice</strong>
              <span className="text-[10px] text-slate-400">Low Risk Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('charlie@candidate.com', 'CandidatePass123!')}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-left text-xs transition-colors"
            >
              <strong className="block text-orange-400 font-semibold">Candidate Charlie</strong>
              <span className="text-[10px] text-slate-400">High Risk Profile</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('diana@candidate.com', 'CandidatePass123!')}
              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded-lg text-left text-xs transition-colors"
            >
              <strong className="block text-rose-400 font-semibold">Candidate Diana</strong>
              <span className="text-[10px] text-slate-400">Critical Risk Profile</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-1">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:underline font-semibold">
            Register Candidate
          </Link>
        </div>
      </div>
    </div>
  );
};
