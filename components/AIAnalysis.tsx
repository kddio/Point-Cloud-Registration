import React from 'react';
import { Bot, Sparkles, Loader2 } from 'lucide-react';

interface AIAnalysisProps {
  analysis: string | null;
  isLoading: boolean;
  onAnalyze: () => void;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis, isLoading, onAnalyze }) => {
  return (
    <div className="bg-slate-800 border-l border-slate-700 p-4 flex flex-col h-full w-80">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Bot size={20} className="text-purple-400" />
          AI Engineer
        </h2>
        <p className="text-xs text-slate-400 mt-1">Gemini 2.5 Geometry Assistant</p>
      </div>

      <div className="flex-1 bg-slate-900/80 rounded-lg border border-slate-700 p-4 overflow-y-auto font-mono text-sm leading-relaxed relative">
        {!analysis && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
            <Sparkles size={32} className="mb-3 opacity-20" />
            <p>Ready to analyze point cloud topology and alignment vectors.</p>
          </div>
        )}
        
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-purple-400">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-xs animate-pulse">Processing geometry...</p>
          </div>
        )}

        {analysis && !isLoading && (
          <div className="text-slate-300 space-y-2">
             {/* Simple markdown-like parser for basic bolding */}
             {analysis.split('\n').map((line, i) => (
               <p key={i} className={line.startsWith('-') ? "pl-4" : ""}>
                 {line}
               </p>
             ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={onAnalyze}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-3 px-4 rounded font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 border border-purple-500/50"
        >
          {isLoading ? 'Analyzing...' : (
             <>
               <Sparkles size={18} /> Analyze Alignment
             </>
          )}
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Uses Gemini 2.5 Flash for spatial reasoning.
        </p>
      </div>
    </div>
  );
};

export default AIAnalysis;
