import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessionService } from '../services/sessionService';
import { AssessmentSession, MonitoringEvent, SimilarityResultResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskGauge } from '../components/RiskGauge';
import { ExplainabilityCard } from '../components/ExplainabilityCard';
import { EventTimeline } from '../components/EventTimeline';
import {
  ArrowLeft,
  User,
  Clock,
  Code2,
  FileCode,
  Layers,
  Clipboard,
  EyeOff,
  AlertTriangle,
  Info
} from 'lucide-react';

export const AdminSessionDetail: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [similarity, setSimilarity] = useState<SimilarityResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      if (!sessionId) return;
      try {
        const [sessData, evData] = await Promise.all([
          sessionService.getSession(Number(sessionId)),
          sessionService.getSessionEvents(Number(sessionId)),
        ]);
        setSession(sessData);
        setEvents(evData);

        // Fetch similarity if there are submissions
        if (sessData.submissions && sessData.submissions.length > 0) {
          try {
            const simData = await sessionService.getSimilarityAnalysis(sessData.submissions[0].id);
            setSimilarity(simData);
          } catch (e) {
            // No similarity records yet
          }
        }
      } catch (err: any) {
        setError('Failed to load session details.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Loading session inspection analysis...
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4">
        <p>{error || 'Session not found'}</p>
        <Link to="/admin/sessions" className="text-emerald-400 text-xs hover:underline">
          Return to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/sessions"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {session.candidate?.name || 'Candidate'}
              </h1>
              <RiskBadge level={session.risk_level} score={session.risk_score} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Assessment: <strong className="text-slate-200">{session.assessment?.title}</strong> • Started at {new Date(session.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
            Session ID: #{session.id}
          </span>
        </div>
      </div>

      {/* Top Split: Risk Meter & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Gauge Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Assessment Suspicion Meter
          </span>
          <RiskGauge score={session.risk_score} level={session.risk_level} size={220} />
          <p className="text-[11px] text-slate-500 text-center mt-3 max-w-xs leading-normal">
            Algorithmic blend of rule heuristics, keystroke ratios, and Isolation Forest ML anomaly scoring.
          </p>
        </div>

        {/* Explainability Summary */}
        <div className="lg:col-span-2">
          <ExplainabilityCard
            score={session.risk_score}
            level={session.risk_level}
            reasons={session.risk_reasons || []}
            anomalyScore={session.behavior_anomaly_score}
          />
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Tab Switches</span>
            <span className="text-lg font-bold font-mono text-white">
              {session.tab_switch_count}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({session.total_hidden_duration.toFixed(1)}s)
              </span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Focus Losses</span>
            <span className="text-lg font-bold font-mono text-white">
              {session.blur_count}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({session.total_blur_duration.toFixed(1)}s)
              </span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Clipboard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Paste Operations</span>
            <span className="text-lg font-bold font-mono text-white">
              {session.paste_count}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({session.large_paste_count} large)
              </span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Max Similarity</span>
            <span className="text-lg font-bold font-mono text-white">
              {Math.round(session.code_similarity_max * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Code Submission & Similarity Section */}
      {session.submissions && session.submissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Candidate Submitted Code & Cross-Similarity</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Snippet Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Submission Code ({session.submissions[0].language})
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(session.submissions[0].submitted_at).toLocaleTimeString()}
                </span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto max-h-72 border border-slate-800">
                {session.submissions[0].code}
              </pre>
            </div>

            {/* Similarity Comparisons */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300">
                  Cross-Submission Similarity Matrix
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  AST + Token Vectorizer
                </span>
              </div>

              {similarity && similarity.results.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {similarity.results.map((res, i) => (
                    <div
                      key={i}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          Compared with: {res.candidate_name || `Submission #${res.compared_submission_id}`}
                        </span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            res.similarity_score >= 0.8
                              ? 'text-rose-400'
                              : res.similarity_score >= 0.6
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {Math.round(res.similarity_score * 100)}% match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {res.explanation}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{similarity.disclaimer}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No other candidate submissions available to compare against.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chronological Event Timeline */}
      <EventTimeline events={events} />
    </div>
  );
};
