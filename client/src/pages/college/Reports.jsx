import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { FileText, Key, Copy, ExternalLink, Download, BarChart2, TrendingUp, CheckCircle2, Users, Award, RefreshCw, ScrollText, ShieldCheck, AlertTriangle, FileSpreadsheet, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const antInputClass = "h-9 px-3 text-xs bg-white border border-[#d9d9d9] rounded-none outline-none hover:border-[#39c884] focus:border-[#39c884] focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

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
        <div className="animate-spin w-8 h-8 border-3 border-[#39c884] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-[#39c884]" /> Placement Reports & Principal Passkey
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Generate executive summaries for your College Principal and Management.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            variant="outline"
            className="rounded border-[#d9d9d9] text-slate-700 hover:text-[#39c884] hover:border-[#39c884] hover:bg-white text-xs font-medium gap-2 px-5 h-9 cursor-pointer"
          >
            <RefreshCw size={14} className={generatingReport ? 'animate-spin' : ''} /> {generatingReport ? 'Generating...' : 'Generate Report Now'}
          </Button>
          <Button
            onClick={downloadSummaryReport}
            disabled={downloadingSummary}
            className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white text-xs font-medium gap-2 px-5 h-9 shadow-sm border-none cursor-pointer"
          >
            <Download size={14} /> {downloadingSummary ? 'Preparing PDF...' : 'Download Summary Report (.PDF)'}
          </Button>
        </div>
      </div>

      {/* Accreditation-ready placement export */}
      <section className="rounded-none border border-[#e8e8e8] bg-white p-6 md:p-8 text-slate-900 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-none border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#39c884]"><ShieldCheck size={13} /> Accreditation reporting</span>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Placement & Student Progression Export</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Generate structured underlying data for NAAC SSR/AQAR, NBA SAR, AICTE and NIRF reporting. The workbook includes six sheets and an evidence-gap log. It does not hard-code changing framework metric numbers.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => downloadAccreditation('xlsx')} disabled={!!exportingAccreditation || !accreditation?.recordCount} className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white font-medium text-xs gap-2 px-4 h-9 cursor-pointer border-none"><FileSpreadsheet size={15} /> {exportingAccreditation === 'xlsx' ? 'Building workbook…' : 'Download 6-sheet XLSX'}</Button>
            <Button onClick={() => downloadAccreditation('csv')} disabled={!!exportingAccreditation || !accreditation?.recordCount} variant="outline" className="rounded border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] bg-white text-slate-700 font-medium text-xs gap-2 px-4 h-9 cursor-pointer"><Download size={15} /> {exportingAccreditation === 'csv' ? 'Preparing…' : 'Placement CSV'}</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-5 rounded-none border border-[#e8e8e8] bg-slate-50 p-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic year</label>
            <input value={academicYear} onChange={event => setAcademicYear(event.target.value)} placeholder="2025-26" className={antInputClass + " w-full mt-2"} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Departments <span className="normal-case tracking-normal">(none selected = all)</span></p>
            <div className="mt-2 flex flex-wrap gap-2">{data?.departments?.map(item => { const name = item.name; const active = selectedDepartments.includes(name); return <button key={name} onClick={() => toggleDepartment(name)} className={`rounded-none border px-3 py-1.5 text-[10px] font-semibold transition cursor-pointer ${active ? 'border-[#39c884] bg-[#39c884]/10 text-[#39c884]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{name}</button>; })}</div>
          </div>
        </div>

        <div className="rounded-none border border-[#e8e8e8] bg-slate-50/50 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div><h3 className="text-sm font-semibold text-slate-900">Bulk import accreditation records</h3><p className="text-[10px] text-slate-500 mt-1">Import placement outcomes first, then the optional progression file. Students are matched by university register number.</p></div>
            <div className="flex gap-2"><button onClick={() => downloadAccreditationTemplate('placement')} className="text-[10px] font-medium text-[#39c884] hover:text-[#2ea86e] cursor-pointer bg-transparent border-none">Placement template</button><span className="text-slate-300">|</span><button onClick={() => downloadAccreditationTemplate('progression')} className="text-[10px] font-medium text-[#39c884] hover:text-[#2ea86e] cursor-pointer bg-transparent border-none">Progression template</button></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-none border border-[#e8e8e8] bg-white p-4 space-y-3">
              <div><p className="text-xs font-semibold text-slate-900">1. Placement Register CSV</p><p className="text-[9px] text-slate-400 mt-1">One row for every graduating student—including not placed, higher studies, and examination outcomes.</p></div>
              <input type="file" accept=".csv,text/csv" onChange={event => setPlacementImportFile(event.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-600 file:mr-3 file:rounded-none file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:font-semibold file:text-slate-700 outline-none" />
              <Button onClick={() => importAccreditationCsv('placement')} disabled={!placementImportFile || !!importingAccreditation} className="h-8 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium px-4 border-none cursor-pointer">{importingAccreditation === 'placement' ? 'Validating & importing…' : 'Import placement records'}</Button>
            </div>
            <div className="rounded-none border border-[#e8e8e8] bg-white p-4 space-y-3">
              <div><p className="text-xs font-semibold text-slate-900">2. Progression CSV</p><p className="text-[9px] text-slate-400 mt-1">Higher studies and qualified competitive-exam details with admission-letter or scorecard references.</p></div>
              <input type="file" accept=".csv,text/csv" onChange={event => setProgressionImportFile(event.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-600 file:mr-3 file:rounded-none file:border file:border-slate-200 file:bg-slate-50 file:px-3 file:py-1.5 file:font-semibold file:text-slate-700 outline-none" />
              <Button onClick={() => importAccreditationCsv('progression')} disabled={!progressionImportFile || !!importingAccreditation} className="h-8 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium px-4 border-none cursor-pointer">{importingAccreditation === 'progression' ? 'Validating & importing…' : 'Import progression records'}</Button>
            </div>
          </div>
          {importResult && <div className="rounded-none border border-slate-200 bg-slate-100 p-4">
            <div className="flex flex-wrap gap-4 text-[10px]"><span><b className="text-slate-900">{importResult.totalRows}</b> rows</span><span className="text-emerald-600"><b>{importResult.imported}</b> imported</span><span className="text-amber-600"><b>{importResult.warnings}</b> warnings</span><span className="text-rose-600"><b>{importResult.failed}</b> failed</span><span className="text-orange-600"><b>{importResult.unmatched}</b> unmatched</span></div>
            {importResult.issues?.length > 0 && <div className="mt-3 max-h-36 overflow-y-auto space-y-1">{importResult.issues.map((issue,index) => <p key={`${issue.row}-${index}`} className="text-[9px] text-slate-600"><b>Row {issue.row}{issue.registerNumber ? ` · ${issue.registerNumber}` : ''}:</b> {issue.issue}</p>)}</div>}
          </div>}
          <p className="text-[9px] text-slate-400">Bulk import updates existing college students only. Unmatched register numbers are reported and never silently created. Use Students → Bulk Upload first when onboarding new students.</p>
        </div>

        {loadingAccreditation ? <div className="py-5 text-center text-xs text-slate-400">Calculating live metrics…</div> : accreditation && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: 'Graduated', value: accreditation.metrics.total.graduated, icon: GraduationCap, bgGradient: 'from-[#1b496d] to-[#2a73ab]' },
                { label: 'Placed', value: accreditation.metrics.total.placed, icon: CheckCircle2, bgGradient: 'from-[#0d7c7f] to-[#12adac]' },
                { label: 'Placement rate', value: `${(accreditation.metrics.total.placementPct * 100).toFixed(1)}%`, icon: TrendingUp, bgGradient: 'from-[#b45309] to-[#d97706]' },
                { label: 'Total progression', value: accreditation.metrics.total.progression, icon: Award, bgGradient: 'from-indigo-600 to-purple-500' }
              ].map((metric, i) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className={`relative overflow-hidden p-5 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-none bg-gradient-to-br ${metric.bgGradient}`}>
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                    <div className="flex flex-col h-full justify-between relative z-10">
                      <div className="mb-4 flex items-center justify-between">
                        <Icon size={18} className="text-white opacity-90" strokeWidth={2.5} />
                        <span className="text-[10px] text-white/30 font-black">0{i+1}</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/90">{metric.label}</p>
                        <p className="text-2xl font-black text-white tracking-tight mt-1">{metric.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`flex items-center gap-3 rounded-none border p-4 ${accreditation.missingEvidence ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
              {accreditation.missingEvidence ? <AlertTriangle className="text-amber-600 shrink-0" size={20} /> : <CheckCircle2 className="text-[#39c884] shrink-0" size={20} />}
              <div><p className="text-xs font-semibold text-slate-900">{accreditation.missingEvidence ? `${accreditation.missingEvidence} claim(s) missing evidence` : 'All claimed outcomes have evidence'}</p><p className="text-[10px] text-slate-500 mt-0.5">{accreditation.claimCount} placement/progression claims checked. Add evidence from Students → student details before submission.</p></div>
            </div>
          </>
        )}
        <p className="text-[10px] text-slate-400">Every export is access-controlled to the linked college/TPO and logged with the user, academic year, departments, format, time and record count.</p>
      </section>

      {/* Auto-Generated PDF Reports */}
      <div className="bg-white rounded-none border border-[#e8e8e8] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ScrollText size={16} className="text-[#39c884]" /> Auto-Generated PDF Reports
          </h3>
          <Button
            onClick={handleGenerateMou}
            disabled={generatingMou}
            variant="outline"
            className="rounded border-[#d9d9d9] text-slate-700 hover:text-[#39c884] hover:border-[#39c884] hover:bg-white text-xs font-medium gap-2 px-4 h-9 cursor-pointer"
          >
            <FileText size={13} /> {generatingMou ? 'Generating MoU...' : 'Generate / Download MoU'}
          </Button>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400 italic py-4">
            No reports generated yet. Reports are auto-generated {data?.subscription?.status === 'campus_pro' || data?.subscription?.status === 'campus_elite' ? 'weekly' : 'monthly'}, or you can generate one now.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map(r => (
              <div key={r._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{r.periodLabel}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">{r.frequency} report</p>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_DOMAIN}${r.reportUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#39c884] hover:text-[#2ea86e] hover:underline flex items-center gap-1"
                >
                  <Download size={13} /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Principal Executive Passkey Card */}
      <div className="bg-white rounded-none border border-[#e8e8e8] p-6 text-slate-900 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-emerald-50 text-[#39c884] text-[10px] font-semibold uppercase tracking-widest border border-emerald-100">
              <Key size={12} /> Live Read-Only Executive Dashboard URL
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Principal Executive Passkey Link</h2>
            <p className="text-xs text-slate-500 max-w-2xl font-normal leading-relaxed">
              Share this link with your College Principal or Trust Management — but the link alone won't open the dashboard. Share the 4-digit access code below alongside it; without the correct code, it's unauthorized.
            </p>
          </div>
        </div>

        {passkeyInfo && (
          <div className="bg-slate-50 rounded-none p-4 border border-[#e8e8e8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shareable Executive Link</p>
              <p className="font-mono text-xs text-[#39c884] truncate mt-1 font-semibold">{passkeyInfo.executiveUrl}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => copyUrl(passkeyInfo.executiveUrl)}
                className="rounded text-xs font-medium gap-1.5 bg-[#39c884] hover:bg-[#2ea86e] text-white border-none cursor-pointer"
              >
                <Copy size={14} /> Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(passkeyInfo.executiveUrl, '_blank')}
                className="rounded text-xs font-medium gap-1.5 bg-white border border-[#d9d9d9] text-slate-700 hover:text-[#39c884] hover:border-[#39c884] cursor-pointer"
              >
                <ExternalLink size={14} /> Preview
              </Button>
            </div>
          </div>
        )}

        {passkeyInfo?.code && (
          <div className="bg-emerald-50 rounded-none p-4 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#39c884]">4-Digit Access Code — share this once, it won't be shown again</p>
              <p className="font-mono text-3xl text-[#39c884] tracking-[0.3em] font-bold mt-1.5">{passkeyInfo.code}</p>
              {passkeyInfo.codeExpiry && (
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  Valid until {new Date(passkeyInfo.codeExpiry).toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => copyCode(passkeyInfo.code)}
              className="rounded text-xs font-medium gap-1.5 bg-[#39c884] hover:bg-[#2ea86e] text-white border-none cursor-pointer shrink-0"
            >
              <Copy size={14} /> Copy Code
            </Button>
          </div>
        )}

        <div className="pt-1 flex items-center gap-3">
          <Button
            onClick={handleGeneratePasskey}
            disabled={generatingKey}
            className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white font-medium text-xs px-6 h-9 border-none cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: data.totalStudents, icon: Users, bgGradient: 'from-[#1b496d] to-[#2a73ab]' },
            { label: 'Total Placed', value: data.stats.placed, icon: CheckCircle2, bgGradient: 'from-[#0d7c7f] to-[#12adac]' },
            { label: 'In Interview Pipeline', value: data.stats.interviewing, icon: TrendingUp, bgGradient: 'from-[#b45309] to-[#d97706]' },
            { label: 'Success Rate', value: `${data.successRate}%`, icon: Award, bgGradient: 'from-indigo-600 to-purple-500' }
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className={`relative overflow-hidden p-5 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-none bg-gradient-to-br ${metric.bgGradient}`}>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon size={18} className="text-white opacity-90" strokeWidth={2.5} />
                    <span className="text-[10px] text-white/30 font-black">0{i+1}</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/90">{metric.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight mt-1">{metric.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Department Breakdown Table */}
      {data && (
        <div className="bg-white rounded-none border border-[#e8e8e8] p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 size={16} className="text-[#39c884]" /> Department-wise Placement Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-[#e8e8e8]">
                <tr>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Department</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Count</th>
                  <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Share of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.departments?.map(dept => (
                  <tr key={dept.name} className="border-t border-[#e8e8e8] hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 text-xs">{dept.name}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">{dept.count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-none overflow-hidden">
                          <div
                            className="h-full bg-[#39c884]"
                            style={{ width: `${data.totalStudents > 0 ? (dept.count / data.totalStudents) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
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
