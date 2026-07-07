import React, { useState } from 'react';
import { X, Sparkles, Loader2, FileText, CheckCircle, Percent, Target, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AIGenerateModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState('fresh'); // 'fresh' or 'analyse'
  const [resultMode, setResultMode] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [formData, setFormData] = useState({
    desiredPosition: '',
    experienceLevel: 'Mid-Level',
    skills: '',
    additionalInfo: ''
  });

  const [analyseData, setAnalyseData] = useState({
    jobRole: '',
    jobDescription: '',
    resumeFile: null
  });

  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/generate-resume`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyse = async (e) => {
    e.preventDefault();
    if (!analyseData.resumeFile) return alert('Please upload a resume file');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('jobRole', analyseData.jobRole);
      formDataToSend.append('jobDescription', analyseData.jobDescription);
      formDataToSend.append('resume', analyseData.resumeFile);

      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/analyze-resume`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setAnalysisResult(res.data);
      setResultMode(true);
    } catch (err) {
      console.error(err);
      alert('Failed to analyse resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (resultMode && analysisResult) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Percent className="text-emerald-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Analysis Complete</h2>
                <p className="text-xs text-slate-500 font-medium">ATS Match & Recommendations</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[12px] transition-colors text-slate-400 hover:text-slate-600">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-900">Overall ATS Score</p>
                <p className="text-xs text-slate-500 mt-1">Based on role matching & formatting</p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center border-emerald-500 bg-white">
                <span className="text-2xl font-black text-emerald-600">{analysisResult.score}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Target size={16} className="text-indigo-500" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.missingKeywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                    {kw}
                  </span>
                ))}
                {(!analysisResult.missingKeywords || analysisResult.missingKeywords.length === 0) && (
                  <p className="text-sm text-slate-500">Your resume covers most key requirements!</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-amber-500" /> Improvement Instructions
              </h3>
              <ul className="space-y-3">
                {analysisResult.instructions?.map((inst, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                    <span className="shrink-0 text-amber-500 mt-0.5"><CheckCircle size={14} /></span>
                    <span className="leading-relaxed">{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <button 
              onClick={() => { setResultMode(false); setAnalysisResult(null); }}
              className="w-full h-12 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-[11px] uppercase tracking-widest"
            >
              Analyse Another Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Sparkles className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Resume Studio</h2>
              <p className="text-xs text-slate-500 font-medium">Generate or analyse professional resumes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[12px] transition-colors text-slate-400 hover:text-slate-600">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 shrink-0 bg-slate-50/50">
          <button 
            onClick={() => setMode('fresh')} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'fresh' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Fresh Resume
          </button>
          <button 
            onClick={() => setMode('analyse')} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${mode === 'analyse' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            Analyse Resume
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {mode === 'fresh' ? (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Desired Position *</label>
                <input 
                  type="text" 
                  required
                  value={formData.desiredPosition}
                  onChange={(e) => setFormData({...formData, desiredPosition: e.target.value})}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Experience Level</label>
                <select 
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({...formData, experienceLevel: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 cursor-pointer"
                >
                  <option value="Entry-Level">Entry-Level / Fresher</option>
                  <option value="Mid-Level">Mid-Level (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                  <option value="Executive">Executive / Leadership</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Core Skills</label>
                <input 
                  type="text" 
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="e.g. React, Node.js, AWS, Leadership"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Additional Instructions</label>
                <textarea 
                  rows={3}
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                  placeholder="Any specific achievements, target companies, or style preferences..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Resume Data</>}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAnalyse} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Target Role Name *</label>
                <input 
                  type="text" 
                  required
                  value={analyseData.jobRole}
                  onChange={(e) => setAnalyseData({...analyseData, jobRole: e.target.value})}
                  placeholder="e.g. Product Manager"
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Job Description (JD) *</label>
                <textarea 
                  required
                  rows={4}
                  value={analyseData.jobDescription}
                  onChange={(e) => setAnalyseData({...analyseData, jobDescription: e.target.value})}
                  placeholder="Paste the full job description here..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Upload Resume (PDF/DOC) *</label>
                <div className="relative w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors">
                  <FileText size={16} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-600 truncate flex-1">
                    {analyseData.resumeFile ? analyseData.resumeFile.name : 'Choose a file...'}
                  </span>
                  <input 
                    type="file" 
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setAnalyseData({...analyseData, resumeFile: e.target.files[0]})}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Analysing...</> : <><Target size={16} /> Analyse Resume</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;
