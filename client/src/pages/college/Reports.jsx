import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { FileText, Key, Copy, ExternalLink, Download, BarChart2, TrendingUp, CheckCircle2, Users, Award, RefreshCw, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const CollegeReports = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [passkeyInfo, setPasskeyInfo] = useState(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [reports, setReports] = useState([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingMou, setGeneratingMou] = useState(false);
  const [downloadingSummary, setDownloadingSummary] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/college/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch {
      // silently ignore — reports list is a secondary feature on this page
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await axios.post(`${API}/college/reports/generate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(prev => [res.data, ...prev]);
      toast.success('Placement report generated!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateMou = async () => {
    setGeneratingMou(true);
    try {
      const res = await axios.get(`${API}/college/mou`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.open(`${import.meta.env.VITE_API_DOMAIN}${res.data.mouDocument}`, '_blank');
      toast.success('MoU generated');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to generate MoU');
    } finally {
      setGeneratingMou(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(`${API}/college/me/dashboard-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      if (res.data?.college?.principalPasskey) {
        const url = `${window.location.origin}/principal/executive-summary/${res.data.college.principalPasskey}`;
        setPasskeyInfo({ passkey: res.data.college.principalPasskey, executiveUrl: url });
      }
    } catch (err) {
      toast.error('Failed to load placement reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePasskey = async () => {
    setGeneratingKey(true);
    try {
      const res = await axios.post(`${API}/college/principal-passkey`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = `${window.location.origin}/principal/executive-summary/${res.data.passkey}`;
      setPasskeyInfo({ passkey: res.data.passkey, executiveUrl: url, code: res.data.code, codeExpiry: res.data.codeExpiry });
      toast.success('New access code generated — the previous code no longer works.');
    } catch (err) {
      toast.error('Failed to generate access code');
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Executive URL copied to clipboard!');
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Access code copied to clipboard!');
  };

  const downloadSummaryReport = async () => {
    setDownloadingSummary(true);
    try {
      const res = await axios.get(`${API}/college/reports/summary-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.college?.code || 'campus'}_placement_summary.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Placement summary report downloaded');
    } catch (err) {
      toast.error('Failed to generate summary report');
    } finally {
      setDownloadingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={24} className="text-emerald-600" /> Placement Reports & Principal Passkey
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate executive summaries for your College Principal and Management (`Reports ah principal ku share pannaum`).
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            variant="outline"
            className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold gap-2 px-5 h-10"
          >
            <RefreshCw size={14} className={generatingReport ? 'animate-spin' : ''} /> {generatingReport ? 'Generating...' : 'Generate Report Now'}
          </Button>
          <Button
            onClick={downloadSummaryReport}
            disabled={downloadingSummary}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 px-5 h-10 shadow-sm"
          >
            <Download size={14} /> {downloadingSummary ? 'Preparing PDF...' : 'Download Summary Report (.PDF)'}
          </Button>
        </div>
      </div>

      {/* Auto-Generated PDF Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ScrollText size={16} className="text-emerald-600" /> Auto-Generated PDF Reports
          </h3>
          <Button
            onClick={handleGenerateMou}
            disabled={generatingMou}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-2 px-4 h-9"
          >
            <FileText size={13} /> {generatingMou ? 'Generating MoU...' : 'Generate / Download MoU'}
          </Button>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4">
            No reports generated yet. Reports are auto-generated {data?.subscription?.status === 'campus_pro' || data?.subscription?.status === 'campus_elite' ? 'weekly' : 'monthly'}, or you can generate one now.
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {reports.map(r => (
              <div key={r._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{r.periodLabel}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{r.frequency} report</p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_DOMAIN}${r.reportUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Principal Executive Passkey Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              <Key size={12} /> Live Read-Only Executive Dashboard URL
            </span>
            <h2 className="text-lg font-black tracking-tight">Principal Executive Passkey Link</h2>
            <p className="text-xs text-slate-300 max-w-2xl font-medium">
              Share this link with your College Principal or Trust Management — but the link alone won't open the dashboard. Share the 4-digit access code below alongside it; without the correct code, it's unauthorized.
            </p>
          </div>
        </div>

        {passkeyInfo && (
          <div className="bg-white/10 rounded-xl p-4 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shareable Executive Link</p>
              <p className="font-mono text-xs text-emerald-300 truncate mt-0.5 font-bold">{passkeyInfo.executiveUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyUrl(passkeyInfo.executiveUrl)}
                className="rounded-lg text-xs font-bold gap-1.5 bg-white text-slate-900 hover:bg-slate-100"
              >
                <Copy size={14} /> Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(passkeyInfo.executiveUrl, '_blank')}
                className="rounded-lg text-xs font-bold gap-1.5 bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <ExternalLink size={14} /> Preview
              </Button>
            </div>
          </div>
        )}

        {passkeyInfo?.code && (
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">4-Digit Access Code — share this once, it won't be shown again</p>
              <p className="font-mono text-3xl text-white tracking-[0.3em] font-black mt-1">{passkeyInfo.code}</p>
              {passkeyInfo.codeExpiry && (
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Valid until {new Date(passkeyInfo.codeExpiry).toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyCode(passkeyInfo.code)}
              className="rounded-lg text-xs font-bold gap-1.5 bg-white text-slate-900 hover:bg-slate-100 shrink-0"
            >
              <Copy size={14} /> Copy Code
            </Button>
          </div>
        )}

        <div className="pt-1 flex items-center gap-3">
          <Button
            onClick={handleGeneratePasskey}
            disabled={generatingKey}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 h-10 shadow"
          >
            <Key size={14} className="mr-1.5" />
            {generatingKey ? 'Generating...' : passkeyInfo ? 'Generate New Code' : 'Activate Link & Generate Code'}
          </Button>
          {passkeyInfo && !passkeyInfo.code && (
            <p className="text-[11px] text-slate-400 font-medium">Click above to issue a fresh access code to share with your Principal.</p>
          )}
        </div>
      </div>

      {/* Quick Summary Grid */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Students</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{data.totalStudents}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Placed</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{data.stats.placed}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Interview Pipeline</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{data.stats.interviewing}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{data.successRate}%</p>
          </div>
        </div>
      )}

      {/* Department Breakdown Table */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-emerald-600" /> Department-wise Placement Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Count</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Share of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.departments?.map(dept => (
                  <tr key={dept.name} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 text-xs">{dept.name}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">{dept.count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${data.totalStudents > 0 ? (dept.count / data.totalStudents) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {data.totalStudents > 0 ? ((dept.count / data.totalStudents) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeReports;
