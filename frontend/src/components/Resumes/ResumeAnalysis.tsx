import React from 'react';
import { CheckCircle, AlertTriangle, Star, Layers, TrendingUp } from 'lucide-react';
import type { AnalysisResult } from '../../types';

interface Props {
  result: AnalysisResult;
}

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#1a1e36" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-white/40">/ 100</span>
      </div>
    </div>
  );
}

export default function ResumeAnalysis({ result }: Props) {
  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="glass-card flex items-center gap-8">
        <ScoreRing score={result.score} />
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold text-white">{result.grade}</span>
            <span className="text-white/40">Grade</span>
          </div>
          <p className="text-white/60 text-sm mb-4">Resume Quality Score</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-600 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-0.5">Word Count</p>
              <p className="text-white font-semibold">{result.word_count.toLocaleString()}</p>
            </div>
            <div className="bg-dark-600 rounded-xl p-3">
              <p className="text-white/40 text-xs mb-0.5">Sections Found</p>
              <p className="text-white font-semibold">{result.sections_found.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections detected */}
      {result.sections_found.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-brand-400" />
            <h4 className="font-semibold text-white">Detected Sections</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.sections_found.map((s) => (
              <span key={s} className="px-3 py-1 rounded-full text-xs font-medium bg-brand-500/20 text-brand-300 border border-brand-500/20 capitalize">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">Strengths</h4>
          </div>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-white/70 text-sm">
                <Star className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="glass-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h4 className="font-semibold text-white">Recommendations</h4>
          </div>
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-white/70 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
