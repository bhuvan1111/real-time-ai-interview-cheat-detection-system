import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../services/assessmentService';
import { sessionService } from '../services/sessionService';
import { Assessment, AssessmentSession } from '../types';
import { ConsentModal } from '../components/ConsentModal';
import { RiskBadge } from '../components/RiskBadge';
import { Clock, Play, CheckCircle, Code2, AlertCircle } from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Consent modal state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isConsentOpen, setIsConsentOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [assessmentsData, sessionsData] = await Promise.all([
          assessmentService.getAssessments(),
          sessionService.getSessions(),
        ]);
        setAssessments(assessmentsData);
        setSessions(sessionsData);
      } catch (err: any) {
        setError('Failed to load assessment data.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartClick = (assessment: Assessment) => {
    // Check if there is an active session already
    const active = sessions.find((s) => s.assessment_id === assessment.id && s.status === 'active');
    if (active) {
      navigate(`/candidate/session/${active.id}`);
      return;
    }

    setSelectedAssessment(assessment);
    setIsConsentOpen(true);
  };

  const handleConsentConfirmed = async () => {
    if (!selectedAssessment) return;
    try {
      const session = await sessionService.startSession(selectedAssessment.id);
      setIsConsentOpen(false);
      navigate(`/candidate/session/${session.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize session.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Loading candidate assessments...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          Candidate Assessment Room
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          Select an assigned technical assessment below. Your activity is automatically monitored
          for tab switching, copy-paste events, and abnormal typing patterns to maintain evaluation fairness.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Assessments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Available Technical Assessments</span>
          </h2>
          <span className="text-xs text-slate-400">{assessments.length} assessments available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((a) => {
            const activeSession = sessions.find((s) => s.assessment_id === a.id && s.status === 'active');
            const completedSession = sessions.find((s) => s.assessment_id === a.id && s.status === 'completed');

            return (
              <div
                key={a.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        a.difficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : a.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {a.difficulty}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{a.duration} min</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-100 text-lg group-hover:text-emerald-400 transition-colors mb-2">
                    {a.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {a.description || 'Comprehensive programming assessment testing algorithmic problem solving.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {a.questions?.length || 1} Question{a.questions?.length !== 1 ? 's' : ''}
                  </span>

                  {completedSession ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartClick(a)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{activeSession ? 'Resume Test' : 'Begin Assessment'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidate Session History */}
      {sessions.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">My Session History</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Assessment</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assessment Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {s.assessment?.title || `Assessment #${s.assessment_id}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Privacy Consent Modal */}
      {selectedAssessment && (
        <ConsentModal
          isOpen={isConsentOpen}
          assessmentTitle={selectedAssessment.title}
          durationMinutes={selectedAssessment.duration}
          onConsent={handleConsentConfirmed}
        />
      )}
    </div>
  );
};
