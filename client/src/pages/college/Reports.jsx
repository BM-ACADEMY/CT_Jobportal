import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { FileText, Key, Copy, ExternalLink, Download, BarChart2, TrendingUp, CheckCircle2, Users, Award, RefreshCw, ScrollText, ShieldCheck, AlertTriangle, FileSpreadsheet } from 'lucide-react';
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
  const defaultAcademicYear = `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [accreditation, setAccreditation] = useState(null);
  const [loadingAccreditation, setLoadingAccreditation] = useState(false);
  const [exportingAccreditation, setExportingAccreditation] = useState('');
  const [placementImportFile, setPlacementImportFile] = useState(null);
  const [progressionImportFile, setProgressionImportFile] = useState(null);
  const [importingAccreditation, setImportingAccreditation] = useState('');
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchReports();
  }, []);

  useEffect(() => {
    if (data) fetchAccreditationOverview();
  }, [data, academicYear, selectedDepartments]);

  const accreditationParams = () => ({
    academic_year: academicYear,
    ...(selectedDepartments.length ? { departments: selectedDepartments.join(',') } : {}),
  });

  const fetchAccreditationOverview = async () => {
    setLoadingAccreditation(true);
    try {
      const res = await axios.get(`${API}/college/accreditation/overview`, { headers: { Authorization: `Bearer ${token}` }, params: accreditationParams() });
      setAccreditation(res.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to load accreditation readiness');
    } finally { setLoadingAccreditation(false); }
  };

  const downloadAccreditation = async (format) => {
    setExportingAccreditation(format);
    try {
      const res = await axios.get(`${API}/college/accreditation-export`, { headers: { Authorization: `Bearer ${token}` }, params: { ...accreditationParams(), format }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${data?.college?.code || 'college'}_accreditation_${academicYear}.${format}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} accreditation export downloaded`);
    } catch (err) { toast.error('Failed to generate accreditation export'); }
    finally { setExportingAccreditation(''); }
  };

  const toggleDepartment = department => setSelectedDepartments(current => current.includes(department) ? current.filter(item => item !== department) : [...current, department]);

  const downloadAccreditationTemplate = async type => {
    try {
      const res = await axios.get(`${API}/college/accreditation/template/${type}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `accreditation_${type}_template.csv`; anchor.click(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download import template'); }
  };

  const importAccreditationCsv = async type => {
    const file = type === 'placement' ? placementImportFile : progressionImportFile;
    if (!file) return toast.error(`Choose a ${type} CSV file`);
    setImportingAccreditation(type);
    try {
      const form = new FormData(); form.append('file', file);
      const res = await axios.post(`${API}/college/accreditation/import/${type}`, form, { headers: { Authorization: `Bearer ${token}` } });
      setImportResult({ type, ...res.data });
      toast.success(res.data.msg);
      if (type === 'placement') setPlacementImportFile(null); else setProgressionImportFile(null);
      fetchAccreditationOverview();
    } catch (err) { toast.error(err.response?.data?.msg || `Failed to import ${type} CSV`); }
    finally { setImportingAccreditation(''); }
  };

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

      {/* Accreditation-ready placement export */}
      <section className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-200"><ShieldCheck size={13} /> Accreditation reporting</span>
            <h2 className="mt-3 text-xl font-black">Placement & Student Progression Export</h2>
            <p className="mt-2 text-xs leading-5 text-slate-300">Generate structured underlying data for NAAC SSR/AQAR, NBA SAR, AICTE and NIRF reporting. The workbook includes six sheets and an evidence-gap log. It does not hard-code changing framework metric numbers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadAccreditation('xlsx')} disabled={!!exportingAccreditation || !accreditation?.recordCount} className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs gap-2"><FileSpreadsheet size={15} /> {exportingAccreditation === 'xlsx' ? 'Building workbook…' : 'Download 6-sheet XLSX'}</Button>
            <Button onClick={() => downloadAccreditation('csv')} disabled={!!exportingAccreditation || !accreditation?.recordCount} variant="outline" className="rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 font-bold text-xs gap-2"><Download size={15} /> {exportingAccreditation === 'csv' ? 'Preparing…' : 'Placement CSV'}</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic year</label>
            <input value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2025-26" className="mt-2 h-10 w-full rounded-xl border border-white/15 bg-slate-900 px-3 text-sm font-bold text-white outline-none focus:border-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Departments <span className="normal-case tracking-normal">(none selected = all)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">{data?.departments?.map(item => { const name = item.name; const active = selectedDepartments.includes(name); return <button key={name} onClick={() => toggleDepartment(name)} className={`rounded-lg border px-3 py-2 text-[10px] font-bold transition ${active ? 'border-indigo-300 bg-indigo-400/20 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{name}</button>; })}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div><h3 className="text-sm font-black">Bulk import accreditation records</h3><p className="text-[10px] text-slate-400 mt-1">Import placement outcomes first, then the optional progression file. Students are matched by university register number.</p></div>
            <div className="flex gap-2"><button onClick={() => downloadAccreditationTemplate('placement')} className="text-[10px] font-bold text-indigo-300 hover:text-white">Placement template</button><span className="text-white/20">|</span><button onClick={() => downloadAccreditationTemplate('progression')} className="text-[10px] font-bold text-indigo-300 hover:text-white">Progression template</button></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
              <div><p className="text-xs font-black">1. Placement Register CSV</p><p className="text-[9px] text-slate-400 mt-1">One row for every graduating student—including not placed, higher studies, and examination outcomes.</p></div>
              <input type="file" accept=".csv,text/csv" onChange={event => setPlacementImportFile(event.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:font-bold file:text-indigo-200" />
              <Button onClick={() => importAccreditationCsv('placement')} disabled={!placementImportFile || !!importingAccreditation} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black">{importingAccreditation === 'placement' ? 'Validating & importing…' : 'Import placement records'}</Button>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4 space-y-3">
              <div><p className="text-xs font-black">2. Progression CSV</p><p className="text-[9px] text-slate-400 mt-1">Higher studies and qualified competitive-exam details with admission-letter or scorecard references.</p></div>
              <input type="file" accept=".csv,text/csv" onChange={event => setProgressionImportFile(event.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:font-bold file:text-indigo-200" />
              <Button onClick={() => importAccreditationCsv('progression')} disabled={!progressionImportFile || !!importingAccreditation} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black">{importingAccreditation === 'progression' ? 'Validating & importing…' : 'Import progression records'}</Button>
            </div>
          </div>
          {importResult && <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
            <div className="flex flex-wrap gap-4 text-[10px]"><span><b className="text-white">{importResult.totalRows}</b> rows</span><span className="text-emerald-300"><b>{importResult.imported}</b> imported</span><span className="text-amber-300"><b>{importResult.warnings}</b> warnings</span><span className="text-rose-300"><b>{importResult.failed}</b> failed</span><span className="text-orange-300"><b>{importResult.unmatched}</b> unmatched</span></div>
            {importResult.issues?.length > 0 && <div className="mt-3 max-h-36 overflow-y-auto space-y-1">{importResult.issues.map((issue,index) => <p key={`${issue.row}-${index}`} className="text-[9px] text-slate-300"><b>Row {issue.row}{issue.registerNumber ? ` · ${issue.registerNumber}` : ''}:</b> {issue.issue}</p>)}</div>}
          </div>}
          <p className="text-[9px] text-slate-500">Bulk import updates existing college students only. Unmatched register numbers are reported and never silently created. Use Students → Bulk Upload first when onboarding new students.</p>
        </div>

        {loadingAccreditation ? <div className="py-5 text-center text-xs text-slate-400">Calculating live metrics…</div> : accreditation && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['Graduated', accreditation.metrics.total.graduated],['Placed', accreditation.metrics.total.placed],['Placement rate', `${(accreditation.metrics.total.placementPct * 100).toFixed(1)}%`],['Total progression', accreditation.metrics.total.progression]].map(([label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>)}
            </div>
            <div className={`flex items-center gap-3 rounded-xl border p-4 ${accreditation.missingEvidence ? 'border-amber-400/30 bg-amber-400/10' : 'border-emerald-400/30 bg-emerald-400/10'}`}>
              {accreditation.missingEvidence ? <AlertTriangle className="text-amber-300 shrink-0" size={20} /> : <CheckCircle2 className="text-emerald-300 shrink-0" size={20} />}
              <div><p className="text-xs font-black">{accreditation.missingEvidence ? `${accreditation.missingEvidence} claim(s) missing evidence` : 'All claimed outcomes have evidence'}</p><p className="text-[10px] text-slate-300 mt-0.5">{accreditation.claimCount} placement/progression claims checked. Add evidence from Students → student details before submission.</p></div>
            </div>
          </>
        )}
        <p className="text-[10px] text-slate-400">Every export is access-controlled to the linked college/TPO and logged with the user, academic year, departments, format, time and record count.</p>
      </section>

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
