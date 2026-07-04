import React, { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import axios from 'axios';

const AIGenerateModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    desiredPosition: '',
    experienceLevel: 'Mid-Level',
    skills: '',
    additionalInfo: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Sparkles className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Resume Builder</h2>
              <p className="text-xs text-slate-500 font-medium">Generate an ATS-friendly, keyword-rich resume.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-[12px] transition-colors text-slate-400 hover:text-slate-600">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              {loading ? <><Loader2 size={16} className="animate-spin" /> Generating AI Resume...</> : <><Sparkles size={16} /> Generate AI Resume</>}
            </button>
            <p className="text-center text-[10px] font-medium text-slate-400 mt-3 flex items-center justify-center gap-1.5">
              <Sparkles size={10} className="text-emerald-500" />
              Powered by Gemini AI. Your resume will be reviewed and optimized.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIGenerateModal;
