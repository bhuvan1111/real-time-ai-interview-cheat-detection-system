import React, { useState, useRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { Play, Check, RefreshCw, Terminal, Code2 } from 'lucide-react';
import { sessionService } from '../services/sessionService';

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  onPasteEvent?: (characterCount: number) => void;
  onKeystrokeEvent?: (inserted: number, deleted: number) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  onLanguageChange,
  onPasteEvent,
  onKeystrokeEvent,
  readOnly = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor');
  const lastValRef = useRef<string>(value);

  const handleEditorMount: OnMount = (editor, monaco) => {
    // Intercept paste on Monaco container
    const domNode = editor.getDomNode();
    if (domNode && onPasteEvent) {
      domNode.addEventListener('paste', (e: ClipboardEvent) => {
        const text = e.clipboardData?.getData('text/plain') || '';
        if (text.length > 0) {
          onPasteEvent(text.length);
        }
      });
    }
  };

  const handleEditorChange: OnChange = (newVal = '') => {
    if (onKeystrokeEvent) {
      const prev = lastValRef.current;
      const diff = newVal.length - prev.length;
      if (diff > 0) {
        onKeystrokeEvent(diff, 0);
      } else if (diff < 0) {
        onKeystrokeEvent(0, Math.abs(diff));
      }
      lastValRef.current = newVal;
    }
    onChange(newVal);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setError(null);
    setOutput(null);
    setActiveTab('output');

    try {
      const res = await sessionService.runCode(value, language);
      setOutput(res.output);
      setError(res.error || null);
      setExecutionTime(res.execution_time_ms);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Execution failed. Check code syntax.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Top Editor Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Code Editor</span>
          </div>

          {onLanguageChange && !readOnly && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript (Node.js)</option>
            </select>
          )}

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Auto-saving</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'javascript' ? 'javascript' : 'python'}
            value={value}
            theme="vs-dark"
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'JetBrains Mono, monospace',
              tabSize: 4,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              renderLineHighlight: 'all',
              lineNumbers: 'on',
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>

        {/* Output Console Pane */}
        {(output !== null || error !== null || isRunning) && (
          <div className="h-44 bg-slate-950 border-t border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">Test Output Console</span>
                {executionTime !== null && (
                  <span className="text-slate-500">({executionTime} ms)</span>
                )}
              </div>
              <button
                onClick={() => { setOutput(null); setError(null); }}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap">
              {isRunning && <span className="text-slate-400">Executing code in sandbox...</span>}
              {output && <div className="text-emerald-400">{output}</div>}
              {error && <div className="text-rose-400 font-semibold">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
