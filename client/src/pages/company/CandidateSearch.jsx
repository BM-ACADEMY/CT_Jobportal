import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search, MapPin, Briefcase, User, Loader2, Sparkles,
  AlertTriangle, ChevronRight, Filter, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE_URL;

const CandidateSearch = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [quota, setQuota] = useState(null); // { limit, used, remaining }
  const [limitReached, setLimitReached] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!q.trim() && !skills.trim() && !location.trim()) {
      toast.error('Enter at least one search term');
      return;
    }
    setLoading(true);
    setLimitReached(false);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (skills.trim()) params.set('skills', skills.trim());
      if (location.trim()) params.set('location', location.trim());

      const res = await axios.get(`${API}/jobs/candidates/search?${params}`, { headers });
      setResults(res.data.candidates || []);
      setQuota({ limit: res.data.limit, used: res.data.used, remaining: res.data.remaining });
      setSearched(true);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
        setLimitReached(true);
        setQuota({ limit: err.response.data.limit, used: err.response.data.used, remaining: 0 });
        setSearched(true);
        setResults([]);
      } else {
        toast.error(err.response?.data?.msg || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (candidateId) => {
    try {
      const res = await axios.get(`${API}/jobs/candidates/${candidateId}/profile`, { headers });
      setQuota({ limit: res.data.limit, used: res.data.used, remaining: res.data.remaining });
      navigate(`/jobseeker/profile/${candidateId}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
        setLimitReached(true);
        setQuota({ limit: err.response.data.limit, used: err.response.data.used, remaining: 0 });
        toast.error('Daily profile view limit reached. Upgrade to view more candidates.');
      } else {
        toast.error(err.response?.data?.msg || 'Could not open profile');
      }
    }
  };

  const isUnlimited = quota?.limit === 0;
  const atLimit = !isUnlimited && quota && quota.remaining === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search our talent pool and view candidate profiles.</p>
      </div>

      {/* Quota banner */}
      {quota && !isUnlimited && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${
          atLimit
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : quota.remaining <= 2
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="shrink-0" />
            {atLimit
              ? `Daily profile view limit reached (${quota.used}/${quota.limit}). Resets at midnight.`
              : `${quota.remaining} of ${quota.limit} candidate profile views remaining today.`
            }
          </div>
          {atLimit && (
            <Link to="/company/subscription" className="flex items-center gap-1 shrink-0 font-bold hover:underline">
              <Sparkles size={11} /> Upgrade
            </Link>
          )}
        </div>
      )}

      {/* Search form */}
      <form onSubmit={handleSearch} className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-sm">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Name, headline, role..."
              className="pl-9 rounded-xl border-slate-200 text-sm focus:border-emerald-300"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="Skills (comma-separated)"
              className="pl-9 rounded-xl border-slate-200 text-sm focus:border-emerald-300"
            />
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              className="pl-9 rounded-xl border-slate-200 text-sm focus:border-emerald-300"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading || atLimit}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-10 px-6 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search Candidates
          </Button>
          {(q || skills || location) && (
            <Button
              type="button"
              variant="outline"
              onClick={() => { setQ(''); setSkills(''); setLocation(''); setResults([]); setSearched(false); setLimitReached(false); }}
              className="rounded-xl border-slate-200 text-slate-500 h-10 px-4 text-xs font-bold gap-1.5"
            >
              <X size={13} /> Clear
            </Button>
          )}
        </div>
      </form>

      {/* Limit reached state */}
      {limitReached && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-xl border border-rose-200 bg-rose-50">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Daily search limit reached</p>
              <p className="text-xs text-rose-600 mt-0.5">
                Your plan allows {quota?.limit} candidate profile view{quota?.limit > 1 ? 's' : ''} per day. Upgrade to get unlimited access.
              </p>
            </div>
          </div>
          <Link to="/company/subscription" className="shrink-0">
            <Button size="sm" className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 h-9 px-4">
              <Sparkles size={12} /> Upgrade Plan
            </Button>
          </Link>
        </div>
      )}

      {/* Results */}
      {searched && !limitReached && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {results.length === 0 ? 'No candidates found' : `${results.length} candidate${results.length > 1 ? 's' : ''} found`}
          </p>
          {results.map(candidate => (
            <div
              key={candidate._id}
              className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all group"
            >
              <Avatar className="w-12 h-12 rounded-xl border border-slate-100 shrink-0">
                {candidate.avatar
                  ? <img src={candidate.avatar} alt={candidate.name} className="w-full h-full object-cover rounded-xl" />
                  : <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold rounded-xl">
                      {candidate.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                }
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {candidate.name}
                </p>
                {candidate.profile?.headline && (
                  <p className="text-xs text-slate-500 font-medium">{candidate.profile.headline}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {candidate.profile?.preferredRole && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Briefcase size={11} /> {candidate.profile.preferredRole}
                    </span>
                  )}
                  {candidate.profile?.location && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={11} /> {candidate.profile.location}
                    </span>
                  )}
                </div>
                {candidate.profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {candidate.profile.skills.slice(0, 5).map(skill => (
                      <Badge key={skill} className="text-[9px] font-bold bg-slate-100 text-slate-600 border-none px-2 py-0.5 rounded-md">
                        {skill}
                      </Badge>
                    ))}
                    {candidate.profile.skills.length > 5 && (
                      <Badge className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 rounded-md">
                        +{candidate.profile.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleViewProfile(candidate._id)}
                disabled={atLimit}
                variant="outline"
                className="rounded-xl border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 font-bold text-xs gap-1.5 h-9 px-4 shrink-0 disabled:opacity-40"
                title={atLimit ? 'Daily limit reached — upgrade to view more profiles' : 'View full profile'}
              >
                View Profile <ChevronRight size={13} />
              </Button>
            </div>
          ))}

          {results.length === 0 && (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <User size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No candidates match your search</p>
              <p className="text-xs text-slate-400 mt-1">Try different keywords, skills, or location.</p>
            </div>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!searched && !loading && (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <Search size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Search for candidates</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Enter a name, skill, or location to find matching candidates in our talent pool.
          </p>
        </div>
      )}
    </div>
  );
};

export default CandidateSearch;
