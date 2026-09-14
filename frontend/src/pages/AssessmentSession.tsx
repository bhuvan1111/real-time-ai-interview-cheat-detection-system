import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService } from '../services/sessionService';
import { AssessmentSession, Question } from '../types';
import { CodeEditor } from '../components/CodeEditor';
import { useMonitoring } from '../hooks/useMonitoring';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { Clock, Send, ShieldCheck, Radio, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const AssessmentSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [timeLeftSec, setTimeLeftSec] = useState<number>(3600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // WebSocket for candidate real-time channel
  const wsUrl = sessionId && token ? `ws://localhost:8000/ws/session/${sessionId}?token=${token}` : '';
  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    enabled: !!sessionId && !isSubmitted,
  });

  // Client-side non-invasive monitoring hook
  const { recordPaste, recordKeystroke } = useMonitoring({
    sessionId: Number(sessionId),
    sendWsMessage: sendMessage,
    enabled: !!session && session.status === 'active' && !isSubmitted,
  });

  // Fetch session details
  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      try {
        const data = await sessionService.getSession(Number(sessionId));
        setSession(data);

        // Set initial question and starter code
        if (data.assessment?.questions && data.assessment.questions.length > 0) {
          const q = data.assessment.questions[0];
          setActiveQuestion(q);
          setCode(q.starter_code || '# Write your solution here\n');
          setLanguage(q.language || 'python');
        }

        // Calculate timer
        const durationSec = (data.assessment?.duration || 60) * 60;
        const elapsedSec = (Date.now() - new Date(data.started_at).getTime()) / 1000;
        const remaining = Math.max(0, Math.floor(durationSec - elapsedSec));
        setTimeLeftSec(remaining);
      } catch (err: any) {
        setError('Failed to load session details.');
      }
    }
    loadSession();
  }, [sessionId]);

  // Countdown timer interval
  useEffect(() => {
    if (timeLeftSec <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSec, isSubmitted]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAssessment = async () => {
    if (!sessionId || !activeQuestion || isSubmitting) return;

    const confirmed = window.confirm('Are you ready to submit your assessment? You cannot modify code after submission.');
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      // 1. Submit final code
      await sessionService.submitCode(Number(sessionId), activeQuestion.id, code, language);
      // 2. Finish session
      await sessionService.finishSession(Number(sessionId));
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Assessment Submitted</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your solution and session telemetry have been securely saved for evaluator review.
            </p>
          </div>
          <button
            onClick={() => navigate('/candidate')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-sm">{error || 'Session not found or expired.'}</p>
        <button
          onClick={() => navigate('/candidate')}
          className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs hover:bg-slate-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Assessment Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-slate-100">
              {session.assessment?.title || 'Technical Assessment'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-slate-400">
            <span>Candidate:</span>
            <strong className="text-slate-200">{user?.name}</strong>
          </div>
        </div>

        {/* Center Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-sm font-bold border ${
            timeLeftSec < 300
              ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
              : 'bg-slate-950 border-slate-800 text-emerald-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeftSec)}</span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="flex h-2 w-2 relative">
              {isConnected ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              )}
            </span>
            <span>{isConnected ? 'Monitoring Active' : 'Connecting...'}</span>
          </div>

          <button
            onClick={handleSubmitAssessment}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Assessment'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Problem on Left, Code Editor on Right */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Problem Pane */}
        <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-900/50 min-h-0">
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Problem Description</span>
            </div>
            {activeQuestion && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {activeQuestion.time_limit} min target
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-sm text-slate-300 leading-relaxed">
            {activeQuestion ? (
              <>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {activeQuestion.title}
                </h2>

                <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-300 space-y-3">
                  {activeQuestion.description}
                </div>
              </>
            ) : (
              <p className="text-slate-500">No question selected.</p>
            )}

            {/* Monitoring disclosure banner inside assessment */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 leading-normal flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Assessment session protected by BhuvanGuard AI. Window focus shifts and paste operations
                are automatically recorded as metadata.
              </span>
            </div>
          </div>
        </div>

        {/* Right Code Editor Pane */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-2">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            onPasteEvent={recordPaste}
            onKeystrokeEvent={recordKeystroke}
          />
        </div>
      </div>
    </div>
  );
};
