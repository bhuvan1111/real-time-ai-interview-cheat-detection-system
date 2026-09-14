import React, { useState, useEffect } from 'react';
import { assessmentService } from '../services/assessmentService';
import { Assessment, Question } from '../types';
import { Plus, Trash2, Clock, Code2, Check, AlertCircle, X } from 'lucide-react';

export const AdminAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Question sub-form
  const [qTitle, setQTitle] = useState('');
  const [qDesc, setQDesc] = useState('');
  const [qStarter, setQStarter] = useState('def solution():\n    pass\n');
  const [qLang, setQLang] = useState('python');

  const loadAssessments = async () => {
    try {
      const data = await assessmentService.getAssessments();
      setAssessments(data);
    } catch (err) {
      setError('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await assessmentService.createAssessment({
        title,
        description,
        duration: Number(duration),
        difficulty,
        questions: [
          {
            id: 0,
            assessment_id: 0,
            title: qTitle || 'Problem 1',
            description: qDesc || 'Implement the algorithm as specified.',
            starter_code: qStarter,
            language: qLang,
            time_limit: Math.floor(Number(duration) / 2),
          },
        ],
      });

      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      loadAssessments();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create assessment.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await assessmentService.deleteAssessment(id);
      loadAssessments();
    } catch (err) {
      alert('Failed to delete assessment.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        Loading assessment bank...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Assessment Bank</h1>
          <p className="text-xs text-slate-400">
            Create, configure, and manage technical coding evaluations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assessment</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((a) => (
          <div
            key={a.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
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
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{a.duration} min</span>
                </div>
              </div>

              <h3 className="font-bold text-slate-100 text-base mb-2">{a.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                {a.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {a.questions?.length || 0} Problem{a.questions?.length !== 1 ? 's' : ''}
              </span>

              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Delete Assessment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Create Technical Assessment</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Assessment Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advanced Python Algorithms & Systems"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Overview / Instructions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what this test evaluates..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none cursor-pointer"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Initial Question Builder */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
                  Initial Coding Problem
                </span>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Problem Title</label>
                  <input
                    type="text"
                    required
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    placeholder="e.g. Reverse Linked List II"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Problem Statement & Examples</label>
                  <textarea
                    rows={3}
                    required
                    value={qDesc}
                    onChange={(e) => setQDesc(e.target.value)}
                    placeholder="Provide detailed problem description, inputs, outputs, and constraints..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Language</label>
                    <select
                      value={qLang}
                      onChange={(e) => setQLang(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Starter Code Template</label>
                  <textarea
                    rows={3}
                    value={qStarter}
                    onChange={(e) => setQStarter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
