import React, { useState } from 'react';
import { ShieldCheck, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConsentModalProps {
  isOpen: boolean;
  assessmentTitle: string;
  durationMinutes: number;
  onConsent: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  assessmentTitle,
  durationMinutes,
  onConsent,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Assessment Monitoring Notice & Consent</h2>
            <p className="text-sm text-slate-400">{assessmentTitle} ({durationMinutes} minutes)</p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 space-y-3">
          <p className="leading-relaxed">
            To maintain assessment integrity and fairness for all candidates, this platform uses an automated, 
            explainable activity analysis system.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-xs">What We Collect</span>
                <span className="text-xs text-slate-400">
                  Tab visibility state, window focus loss, paste character counts, and editor keystroke intervals.
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-xs">What We Never Collect</span>
                <span className="text-xs text-slate-400">
                  No clipboard text, no keystroke characters, no webcams or microphones, and no unrelated browser history.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <span>
              <strong>Human in the Loop:</strong> Automated scores are assistive indicators, not absolute proof of misconduct. All flags undergo review by a human interviewer before any decision.
            </span>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer select-none text-sm text-slate-300">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
          />
          <span>
            I have read and understand the monitoring disclosure. I consent to session metadata collection during this assessment.
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={!agreed}
            onClick={onConsent}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              agreed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            Begin Assessment Session
          </button>
        </div>
      </div>
    </div>
  );
};
