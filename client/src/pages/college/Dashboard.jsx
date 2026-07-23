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

const StatCard = ({ icon: Icon, label, value, color, subtext, onClick }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-[24px] border border-slate-200/60 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group ${onClick ? 'cursor-pointer hover:border-emerald-300' : ''}`}
  >
    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.08] group-hover:scale-150 transition-transform duration-700 pointer-events-none" style={{ background: color }} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border border-white shadow-sm" style={{ background: `${color}15` }}>
          <Icon size={22} style={{ color }} strokeWidth={2.5} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight" style={{ color: color !== '#0ea5e9' && color !== '#8b5cf6' && color !== '#f59e0b' && color !== '#3b82f6' && color !== '#10b981' && color !== '#06b6d4' ? undefined : color }}>{value}</p>
        {subtext && <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>}
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
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
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
      <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 text-white shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              {college.logo ? (
                <img src={college.logo.startsWith('http') ? college.logo : `${import.meta.env.VITE_API_DOMAIN}${college.logo}`} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white/10 shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg border-4 border-white/10">
                  <GraduationCap size={36} />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-widest text-[10px] uppercase backdrop-blur-md">
                  TPO Dashboard
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{college.name}</h1>
              <p className="text-sm md:text-base text-slate-400 font-medium max-w-xl leading-relaxed mt-2">
                Manage your institution's placement drives, student verification, and analytics dynamically.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <button onClick={() => navigate('/college/drives/new')} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-all shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_-15px_rgba(16,185,129,0.7)] text-[11px] uppercase tracking-widest hover:-translate-y-1">
              <QrCode size={16} /> Launch Drive
            </button>
            <button onClick={() => navigate('/college/students')} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold transition-all backdrop-blur-md text-[11px] uppercase tracking-widest hover:-translate-y-1">
              <Users size={16} /> Students
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[24px] border border-slate-200/60 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.department}
            onChange={e => setFilters(p => ({ ...p, department: e.target.value }))}
            className="w-full text-xs font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-emerald-500/20 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.batchYear}
            onChange={e => setFilters(p => ({ ...p, batchYear: e.target.value }))}
            className="w-full text-xs font-bold text-slate-600 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-emerald-500/20 outline-none"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.year} value={b.year}>Batch {b.year}</option>)}
          </select>
        </div>
        {(filters.department || filters.batchYear) && (
          <button onClick={() => setFilters({ department: '', batchYear: '' })} className="px-6 py-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0">
            Clear Filters
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Students" value={totalStudents} color="#0ea5e9" />
        <StatCard icon={BookOpen} label="Registered" value={stats.registered} color="#8b5cf6" />
        <StatCard icon={Briefcase} label="Applied" value={stats.applied} color="#f59e0b" />
        <StatCard icon={Clock} label="Interviewing" value={stats.interviewing} color="#3b82f6" />
        <StatCard icon={CheckCircle2} label="Placed" value={stats.placed} color="#10b981" />
        <StatCard icon={TrendingUp} label="Success Rate" value={`${successRate}%`} color="#06b6d4" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={QrCode} label="Active Drives" value={totalDrives} color="#8b5cf6" onClick={() => navigate('/college/drives')} subtext="Click to manage" />
        <StatCard icon={ShieldCheck} label="Verified Students" value={verifiedCount} color="#10b981" onClick={() => navigate('/college/verification')} subtext="ID verified" />
        <StatCard icon={Building2} label="Company Matches" value="View →" color="#f59e0b" onClick={() => navigate('/college/company-match')} subtext="See who's hiring your students" />
      </div>

      {/* Placement Funnel */}
      {placementFunnel && (
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
            <Send size={14} className="text-emerald-500" /> Placement Funnel Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
               { label: 'Applications', value: placementFunnel.applicationsSubmitted, color: 'text-blue-600' },
               { label: 'Shortlisted', value: placementFunnel.shortlistsReceived, color: 'text-indigo-600' },
               { label: 'Interviews', value: placementFunnel.interviewsScheduled, color: 'text-violet-600' },
               { label: 'Offers Made', value: placementFunnel.offersMade, color: 'text-emerald-600' },
               { label: 'Avg. Salary', value: `₹${placementFunnel.averagePlacementSalary} LPA`, color: 'text-amber-600' }
            ].map((metric, i) => (
              <div key={i} className="relative group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{metric.label}</p>
                <p className={`text-3xl font-black tracking-tight ${metric.color}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recruiter Spotlight (Campus Pro+) */}
      {recruiterSpotlight && recruiterSpotlight.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Building2 size={14} className="text-amber-600" /> Companies Engaging With Your Students
          </h3>
          <div className="flex flex-wrap gap-3">
            {recruiterSpotlight.map(r => (
              <div key={r._id || r.companyName} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-700">{r.companyName || 'Unknown Company'}</span>
                <span className="text-[10px] text-slate-400 font-semibold">{r.applicationCount} applications</span>
              </div>
            ))}
          </div>
        </div>
      )}
          {/* Department & Batch Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* By Department */}
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <BarChart2 size={14} className="text-emerald-500" /> Students By Department
          </h3>
          {departments.length === 0 ? (
            <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No department data yet</p>
          ) : (
            <div className="space-y-4">
              {departments.map(dept => (
                <div key={dept.name} className="flex items-center justify-between group">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{dept.name}</span>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 group-hover:opacity-80"
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
        <div className="bg-white rounded-[32px] border border-slate-200/60 p-8 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
            <Award size={14} className="text-blue-500" /> By Batch Year
          </h3>
          {batches.length === 0 ? (
            <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No batch data yet</p>
          ) : (
            <div className="space-y-4">
              {batches.map(batch => (
                <div key={batch.year} className="flex items-center justify-between group">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Batch {batch.year}</span>
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1000 group-hover:opacity-80"
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
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <UserCheck size={14} className="text-emerald-600" /> Recent Registrations
          </h3>
          <button onClick={() => navigate('/college/students')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        {recentStudents.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4">No students registered yet. Share your campus drive QR code to get started!</p>
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
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">
                          {s.user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{s.user?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 font-medium">{s.department || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.placementStatus === 'placed' ? 'bg-emerald-50 text-emerald-700' :
                        s.placementStatus === 'interviewing' ? 'bg-blue-50 text-blue-700' :
                        s.placementStatus === 'applied' ? 'bg-amber-50 text-amber-700' :
                        s.placementStatus === 'active' ? 'bg-purple-50 text-purple-700' :
                        'bg-slate-50 text-slate-600'
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
