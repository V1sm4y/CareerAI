import React, { useEffect, useState } from 'react';
import {
  FileText, Sparkles, Trash2, Clock, HardDrive, Star,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { resumesApi } from '../services/api';
import Header from '../components/Layout/Header';
import ResumeUpload from '../components/Resumes/ResumeUpload';
import ResumeAnalysis from '../components/Resumes/ResumeAnalysis';
import type { Resume, AnalysisResult } from '../types';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<{ resumeId: number; result: AnalysisResult } | null>(null);

  const load = async () => {
    try {
      const res = await resumesApi.list();
      setResumes(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUploaded = (resume: Resume) => {
    setResumes((prev) => [resume, ...prev]);
  };

  const handleAnalyze = async (id: number) => {
    setAnalyzing(id);
    try {
      const res = await resumesApi.analyze(id);
      setActiveAnalysis({ resumeId: id, result: res.data });
      // Update the resume's score in local state
      setResumes((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, ai_score: res.data.score, ai_recommendations: res.data.recommendations.join('\n') }
            : r
        )
      );
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(null);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const scoreColor = (score?: number) => {
    if (!score) return 'text-white/40';
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Resumes" subtitle="Upload and analyze your resumes with AI" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left column: Upload + list */}
          <div className="space-y-6">
            <ResumeUpload onUploaded={handleUploaded} />

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="glass-card text-center py-10">
                <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No resumes uploaded yet.</p>
                <p className="text-white/25 text-sm mt-1">Upload your first PDF resume above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">
                  Your Resumes ({resumes.length})
                </h3>
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className={`glass-card !p-4 cursor-pointer transition-all duration-200
                      ${activeAnalysis?.resumeId === resume.id ? 'border-brand-500/40 bg-brand-500/5' : ''}`}
                    onClick={() => {
                      if (activeAnalysis?.resumeId === resume.id) {
                        setActiveAnalysis(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{resume.original_filename}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <HardDrive className="w-3 h-3" /> {formatSize(resume.file_size)}
                          </span>
                          <span className="text-white/30 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(resume.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {resume.ai_score !== undefined && resume.ai_score !== null ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Star className={`w-4 h-4 ${scoreColor(resume.ai_score)}`} />
                          <span className={`font-bold text-sm ${scoreColor(resume.ai_score)}`}>
                            {resume.ai_score}
                          </span>
                        </div>
                      ) : null}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleAnalyze(resume.id); }}
                        disabled={analyzing === resume.id}
                        className="btn-primary !px-3 !py-1.5 !text-xs flex items-center gap-1.5 flex-shrink-0"
                      >
                        {analyzing === resume.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            {resume.ai_score !== undefined && resume.ai_score !== null ? 'Re-analyze' : 'Analyze'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column: Analysis result */}
          <div>
            {activeAnalysis ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-400" /> AI Analysis
                  </h3>
                  <button
                    onClick={() => setActiveAnalysis(null)}
                    className="text-white/40 hover:text-white/70 text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
                <ResumeAnalysis result={activeAnalysis.result} />
              </div>
            ) : (
              <div className="glass-card h-full min-h-64 flex flex-col items-center justify-center text-center p-10">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-brand-400/60" />
                </div>
                <h3 className="text-white/60 font-semibold mb-2">AI Resume Analysis</h3>
                <p className="text-white/30 text-sm max-w-xs">
                  Upload a resume and click <strong className="text-white/50">Analyze</strong> to get
                  AI-powered feedback on your resume quality, strengths, and improvements.
                </p>
                <div className="mt-6 flex items-center gap-2 text-brand-400/60 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Powered by AI
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
