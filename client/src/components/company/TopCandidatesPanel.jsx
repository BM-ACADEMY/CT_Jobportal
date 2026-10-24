import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { trackShown, trackClick } from '../../utils/recommendationEvents';

const API = import.meta.env.VITE_API_BASE_URL;

// "Top candidates for this job" for the job's owner. Shows nothing while the relevance engine is off,
// or when no job seeker fits well enough, so it never fills the page with weak suggestions.
const TopCandidatesPanel = ({ jobId }) => {
  const [candidates, setCandidates] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API}/jobs/${jobId}/top-candidates`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then((res) => { if (!cancelled && res.data?.enabled) setCandidates(res.data.candidates || []); })
      .catch(() => { /* a suggestion panel is never worth an error message */ });
    return () => { cancelled = true; };
  }, [jobId]);

  if (!candidates.length) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <button
        type="button"
        onClick={() => {
          // The suggestions count as "shown" when the recruiter actually opens the panel.
          if (!open) trackShown('top_candidates', candidates.map((c) => ({ jobId, candidateId: c._id, score: c.relevance?.score })));
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-transparent border-none cursor-pointer p-0"
        aria-expanded={open}
      >
        <Sparkles size={13} /> {candidates.length} top candidate{candidates.length > 1 ? 's' : ''} for this job
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {candidates.map((c) => (
            <div key={c._id} className="text-xs bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="font-semibold text-slate-800">
                {c.name}
                {c.isPriority && <span className="ml-2 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full">Priority</span>}
                {c.profile?.headline ? <span className="font-normal text-slate-500">, {c.profile.headline}</span> : null}
              </p>
              {c.relevance?.reasons?.length > 0 && (
                <p className="text-emerald-700 font-medium mt-0.5">Why: {c.relevance.reasons.slice(0, 3).join(' · ')}</p>
              )}
              {c.profile?.skills?.length > 0 && <p className="text-slate-500 mt-0.5">{c.profile.skills.join(', ')}</p>}
            </div>
          ))}
          <p className="text-[10px] text-slate-400">A suggestion, not a guarantee. Review each profile before you decide.</p>
          <Link
            to="/company/candidates"
            onClick={() => candidates.forEach((c) => trackClick('top_candidates', { jobId, candidateId: c._id, score: c.relevance?.score }))}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Open candidate search
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopCandidatesPanel;
