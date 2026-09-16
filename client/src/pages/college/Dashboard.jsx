import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap, Users, Briefcase, TrendingUp, CheckCircle2,
  Award, UserCheck, Building2, ArrowRight, BookOpen, QrCode,
  ShieldCheck, BarChart2, Clock, Send
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const StatCard = ({ icon: Icon, label, value, bgGradient, subtext, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden p-5 text-white shadow-sm hover:shadow-md transition-all duration-300 group rounded-none bg-gradient-to-br ${bgGradient} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
    
    <div className="flex flex-col h-full justify-between relative z-10">
      <div className="mb-6">
        <Icon size={20} className="text-white opacity-90" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/80">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight mt-0.5">{value}</p>
        {subtext && <p className="text-[9px] text-white/70 font-semibold mt-2">{subtext}</p>}
      </div>
    </div>
  </div>
);

const CollegeDashboard = () => {
  const auth = useAuth();
  const user = auth?.user;
  const token = auth?.token || localStorage.getItem('token');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: '', batchYear: '' });

  useEffect(() => {
    fetchDashboard();
  }, [filters.department, filters.batchYear]);

  const fetchDashboard = async () => {
    try {
      const params = {};
      if (filters.department) params.department = filters.department;
      if (filters.batchYear) params.batchYear = filters.batchYear;
      const res = await axios.get(`${API}/college/me/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.info('No college linked yet. Please contact admin to set up your college.');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#34b678] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center mb-6">
          <GraduationCap size={36} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">No College Linked</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Your account doesn't have a college linked yet. Please contact the admin to set up your college profile.
        </p>
      </div>
    );
  }

  const { college, stats, totalStudents, successRate, verifiedCount, departments, batches, totalDrives, recentStudents, placementFunnel, recruiterSpotlight } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative rounded-none bg-gradient-to-br from-[#1b496d] via-[#153e5e] to-[#0d2e49] p-8 sm:p-10 text-white shadow-sm overflow-hidden group">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {college.logo ? (
                <img src={college.logo.startsWith('http') ? college.logo : `${import.meta.env.VITE_API_DOMAIN}${college.logo}`} alt="" className="w-20 h-20 object-cover border border-white/10" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white border border-white/10">
                  <GraduationCap size={36} />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-[#34b678]/20 text-[#34b678] border border-[#34b678]/30 font-bold tracking-widest text-[9px] uppercase backdrop-blur-md rounded-none">
                  TPO Dashboard
                </Badge>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">{college.name}</h1>
              <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed mt-1">
                Manage your institution's placement drives, student verification, and analytics dynamically.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button onClick={() => navigate('/college/drives/new')} className="flex items-center gap-2 px-6 py-3 bg-[#34b678] hover:bg-[#2da36a] text-white font-bold transition-all text-[10px] uppercase tracking-widest hover:-translate-y-0.5 cursor-pointer rounded-none border-none">
              <QrCode size={15} /> Launch Drive
            </button>
            <button onClick={() => navigate('/college/students')} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold transition-all backdrop-blur-md text-[10px] uppercase tracking-widest hover:-translate-y-0.5 cursor-pointer rounded-none">
              <Users size={15} /> Students
            </button>
          </div>
        </div>
      </div>

      {/* Title & Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">TPO Analytics Overview</h2>
        <div className="flex items-center gap-2.5">
          <select
            value={filters.department}
            onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}
            className="w-40 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-none px-3 py-2 bg-white hover:bg-slate-50 focus:ring-1 focus:ring-[#34b678] outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <select
            value={filters.batchYear}
            onChange={e => setFilters(p => ({ ...p, batchYear: e.target.value }))}
            className="w-36 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-none px-3 py-2 bg-white hover:bg-slate-50 focus:ring-1 focus:ring-[#34b678] outline-none cursor-pointer"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.year} value={b.year}>Batch {b.year}</option>)}
          </select>
          {(filters.department || filters.batchYear) && (
            <button onClick={() => setFilters({ department: '', batchYear: '' })} className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer rounded-none border border-rose-200">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats - Grid of Gradient Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Students" value={totalStudents} bgGradient="from-[#6b62fc] to-[#8d7cff]" />
        <StatCard icon={BookOpen} label="Registered" value={stats.registered} bgGradient="from-[#a855f7] to-[#c084fc]" />
        <StatCard icon={Briefcase} label="Applied" value={stats.applied} bgGradient="from-[#f97316] to-[#fb923c]" />
        <StatCard icon={Clock} label="Interviewing" value={stats.interviewing} bgGradient="from-[#0ea5e9] to-[#38bdf8]" />
        <StatCard icon={CheckCircle2} label="Placed" value={stats.placed} bgGradient="from-[#10b981] to-[#34d399]" />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} bgGradient="from-[#f43f5e] to-[#fb7185]" />
      </div>

      {/* Secondary Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={QrCode} label="Active Drives" value={totalDrives} bgGradient="from-[#1b496d] to-[#2a73ab]" onClick={() => navigate('/college/drives')} subtext="Manage drives →" />
        <StatCard icon={ShieldCheck} label="Verified Students" value={verifiedCount} bgGradient="from-[#0d7c7f] to-[#12adac]" onClick={() => navigate('/college/verification')} subtext="Verify IDs →" />
        <StatCard icon={Building2} label="Company Matches" value="View List" bgGradient="from-[#b45309] to-[#d97706]" onClick={() => navigate('/college/company-match')} subtext="See who is hiring →" />
      </div>

      {/* Placement Funnel - Sequential Flow Funnel */}
      {placementFunnel && (
        <div className="space-y-4">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-3">
            <span>Placement Funnel Metrics</span>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </h3>
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
            {[
               { label: 'Applications', value: placementFunnel.applicationsSubmitted, bgGradient: 'from-blue-600 to-sky-500', desc: 'Total submissions' },
               { label: 'Shortlisted', value: placementFunnel.shortlistsReceived, bgGradient: 'from-indigo-600 to-purple-500', desc: 'Selected profiles' },
               { label: 'Interviews', value: placementFunnel.interviewsScheduled, bgGradient: 'from-violet-600 to-fuchsia-500', desc: 'Conducted interviews' },
               { label: 'Offers Made', value: placementFunnel.offersMade, bgGradient: 'from-[#10b981] to-[#34d399]', desc: 'Offers accepted' },
               { label: 'Avg. Salary', value: `₹${placementFunnel.averagePlacementSalary} LPA`, bgGradient: 'from-[#f97316] to-[#fb923c]', desc: 'Average Package' }
            ].map((metric, i) => (
              <div key={i} className={`flex-1 p-5 rounded-none shadow-sm bg-gradient-to-br ${metric.bgGradient} text-white hover:shadow-md transition-all duration-300 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">{metric.label}</span>
                    <span className="text-xs text-white/40 font-black">0{i+1}</span>
                  </div>
                  <p className="text-xl font-black tracking-tight mt-4 whitespace-nowrap text-white">{metric.value}</p>
                </div>
                <p className="text-[10px] text-white/80 mt-3 font-semibold">{metric.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recruiter Spotlight */}
      {recruiterSpotlight && recruiterSpotlight.length > 0 && (
        <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
            <Building2 size={14} className="text-[#34b678]" /> Companies Engaging With Your Students
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {recruiterSpotlight.map(r => (
              <div key={r._id || r.companyName} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/60 text-slate-700 text-xs font-medium">
                <span className="font-bold">{r.companyName || 'Unknown Company'}</span>
                <span className="text-[10px] text-slate-400 font-semibold">• {r.applicationCount} applications</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Department & Batch Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Department */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <BarChart2 size={14} className="text-[#34b678]" /> Students By Department
          </h3>
          {departments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No department data yet</p>
          ) : (
            <div className="space-y-4">
              {departments.map(dept => (
                <div key={dept.name} className="flex items-center justify-between group">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{dept.name}</span>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="flex-1 h-1.5 bg-slate-100 overflow-hidden rounded-none">
                      <div
                        className="h-full bg-[#34b678] transition-all duration-1000 group-hover:opacity-80 rounded-none"
                        style={{ width: `${totalStudents > 0 ? (dept.count / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-8 text-right">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Batch Year */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <Award size={14} className="text-blue-500" /> By Batch Year
          </h3>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">No batch data yet</p>
          ) : (
            <div className="space-y-4">
              {batches.map(batch => (
                <div key={batch.year} className="flex items-center justify-between group">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Batch {batch.year}</span>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="flex-1 h-1.5 bg-slate-100 overflow-hidden rounded-none">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000 group-hover:opacity-80 rounded-none"
                        style={{ width: `${totalStudents > 0 ? (batch.count / totalStudents) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-8 text-right">{batch.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <UserCheck size={14} className="text-[#34b678]" /> Recent Registrations
          </h3>
          <button onClick={() => navigate('/college/students')} className="text-xs font-bold text-[#34b678] hover:text-[#2da36a] flex items-center gap-1 cursor-pointer border-none bg-transparent">
            View All <ArrowRight size={12} />
          </button>
        </div>
        {recentStudents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No students registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map(s => (
                  <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/college/students/${s._id}`)}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100/50">
                          {s.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{s.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 font-medium">{s.department || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        s.placementStatus === 'placed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        s.placementStatus === 'interviewing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        s.placementStatus === 'applied' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        s.placementStatus === 'active' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                        'bg-slate-50 text-slate-600 border border-slate-100'
                      }`}>
                        {s.placementStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeDashboard;
