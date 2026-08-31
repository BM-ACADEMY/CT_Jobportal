import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Users, Search, Filter, Download, Upload, ChevronDown, ShieldCheck, X, Clock, LogIn, LogOut, CheckCircle2, XCircle, Eye, Edit2, Trash2, Loader2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import PhoneNumberInput from '@/components/shared/PhoneNumberInput';

const API = import.meta.env.VITE_API_BASE_URL;

const statusColors = {
  unplaced: 'bg-slate-50 text-slate-500',
  registered: 'bg-slate-50 text-slate-600',
  active: 'bg-purple-50 text-purple-700',
  applied: 'bg-amber-50 text-amber-700',
  shortlisted: 'bg-cyan-50 text-cyan-700',
  interviewing: 'bg-blue-50 text-blue-700',
  placed: 'bg-emerald-50 text-emerald-700',
  opted_out: 'bg-red-50 text-red-600',
};

const statusUpdateOptions = ['unplaced', 'registered', 'active', 'applied', 'shortlisted', 'interviewing', 'opted_out'];
const ACTIVITY_PAGE_SIZE = 5;

const Students = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', batchYear: '', status: '' });
  const [pendingDept, setPendingDept] = useState('');
  const [pendingYear, setPendingYear] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(true);
  const [browseAll, setBrowseAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [placementAccreditationFile, setPlacementAccreditationFile] = useState(null);
  const [progressionAccreditationFile, setProgressionAccreditationFile] = useState(null);
  const [importingAccreditationCsv, setImportingAccreditationCsv] = useState('');
  const [accreditationImportResult, setAccreditationImportResult] = useState(null);

  // Detail drawer state
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [verifying, setVerifying] = useState(false);
  const emptyAccreditation = { gender: '', programme: '', outcome: 'Not Placed', employerName: '', employerCity: '', designation: '', packageLPA: '', offerDate: '', offerSource: '', driveReference: '', institutionJoined: '', programmeJoined: '' };
  const [accreditationForm, setAccreditationForm] = useState(emptyAccreditation);
  const [accreditationEvidence, setAccreditationEvidence] = useState(null);
  const [savingAccreditation, setSavingAccreditation] = useState(false);
  const [canonicalEmployers, setCanonicalEmployers] = useState([]);

  // Edit modal state
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({ department: '', batchYear: '', rollNumber: '', cgpa: '', activeArrears: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk-select state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const courseYearSelected = !!(filters.department && filters.batchYear);
  const listUnlocked = courseYearSelected || browseAll;

  useEffect(() => {
    fetchDepartments();
    fetchYears();
  }, []);

  useEffect(() => {
    if (listUnlocked) fetchStudents();
  }, [page, filters, browseAll]);

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const res = await axios.get(`${API}/college/profile`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data.departments || []);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally { setDepartmentsLoading(false); }
  };

  const fetchYears = async () => {
    setYearsLoading(true);
    try {
      const res = await axios.get(`${API}/college/academic-years`, { headers: { Authorization: `Bearer ${token}` } });
      setYears(res.data.years || []);
    } catch (err) {
      toast.error('Failed to load academic years');
    } finally { setYearsLoading(false); }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setSelectedIds([]);
    try {
      const params = { page, limit: 10, ...filters };
      if (search) params.search = search;
      if (browseAll) params.sort = 'name';
      const res = await axios.get(`${API}/college/students`, { headers: { Authorization: `Bearer ${token}` }, params });
      setStudents(res.data.students);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load students');
    } finally { setLoading(false); }
  };

  const viewStudents = () => {
    if (!pendingDept || !pendingYear) return toast.error('Select both course and year');
    setBrowseAll(false);
    setPage(1);
    setFilters({ department: pendingDept, batchYear: pendingYear, status: '' });
  };

  const searchAllStudents = (e) => {
    e.preventDefault();
    setPendingDept('');
    setPendingYear('');
    setFilters({ department: '', batchYear: '', status: '' });
    setPage(1);
    setBrowseAll(true);
  };

  const changeCourseYear = () => {
    setPendingDept('');
    setPendingYear('');
    setBrowseAll(false);
    setFilters({ department: '', batchYear: '', status: '' });
    setStudents([]);
    setTotal(0);
    setPages(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(`${API}/college/students/csv-template`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'student_import_template.csv'; a.click();
    } catch { toast.error('Failed to download template'); }
  };

  const downloadCredentials = async () => {
    try {
      const res = await axios.get(`${API}/college/students/credentials-export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'student_credentials_list.csv'; a.click();
      toast.success('Credentials sheet downloaded successfully!');
    } catch { toast.error('Failed to download credentials sheet'); }
  };

  const openDetail = async (id) => {
    if (id !== detailId) setActivityPage(1); // don't reset when re-fetching the same student after an edit
    setDetailId(id);
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}/college/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetail(res.data);
      const acc = res.data.student?.accreditation || {};
      setAccreditationForm({ gender: acc.gender || '', programme: acc.programme || '', outcome: acc.outcome || (res.data.student?.placementStatus === 'placed' ? 'Placed' : 'Not Placed'), employerName: acc.placement?.employerName || '', employerCity: acc.placement?.employerCity || '', designation: acc.placement?.designation || '', packageLPA: acc.placement?.packageLPA || '', offerDate: acc.placement?.offerDate ? String(acc.placement.offerDate).slice(0, 10) : '', offerSource: acc.placement?.offerSource || '', driveReference: acc.placement?.driveReference || '', evidenceUrl: acc.placement?.evidenceUrl || '', institutionJoined: acc.progression?.institutionJoined || '', programmeJoined: acc.progression?.programmeJoined || '', progressionEvidenceUrl: acc.progression?.evidenceUrl || '' });
      setAccreditationEvidence(null);
      axios.get(`${API}/college/accreditation/employers`, { headers: { Authorization: `Bearer ${token}` } }).then(result => setCanonicalEmployers(result.data || [])).catch(() => {});
    } catch { toast.error('Failed to load student detail'); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailId(null); setDetail(null); };

  const saveAccreditation = async event => {
    event.preventDefault();
    setSavingAccreditation(true);
    try {
      const form = new FormData();
      Object.entries(accreditationForm).forEach(([key, value]) => form.append(key, value ?? ''));
      if (accreditationEvidence) form.append('evidence', accreditationEvidence);
      await axios.put(`${API}/college/students/${detail.student._id}/accreditation`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Accreditation record and evidence saved');
      openDetail(detail.student._id);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to save accreditation record'); }
    finally { setSavingAccreditation(false); }
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setEditForm({
      department: s.department || '',
      batchYear: s.batchYear || '',
      rollNumber: s.rollNumber || '',
      cgpa: s.cgpa || '',
      activeArrears: s.activeArrears || '',
      phone: s.phone || s.user?.profile?.phone || '',
    });
  };

  const closeEdit = () => { setEditStudent(null); };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        department: editForm.department,
        rollNumber: editForm.rollNumber,
        phone: editForm.phone,
        batchYear: editForm.batchYear ? parseInt(editForm.batchYear) : undefined,
        cgpa: editForm.cgpa !== '' ? parseFloat(editForm.cgpa) : undefined,
        activeArrears: editForm.activeArrears !== '' ? parseInt(editForm.activeArrears) : undefined,
      };
      await axios.put(`${API}/college/students/${editStudent._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Student details updated');
      closeEdit();
      fetchStudents();
      if (detailId === editStudent._id) openDetail(detailId);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteStudent = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/college/students/${deleteTarget._id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Student removed');
      setDeleteTarget(null);
      if (detailId === deleteTarget._id) closeDetail();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove student');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.length === students.length ? [] : students.map(s => s._id));
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const res = await axios.post(`${API}/college/students/bulk-delete`, { studentIds: selectedIds }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(res.data.msg || 'Students removed');
      setBulkDeleteOpen(false);
      setSelectedIds([]);
      if (detailId && selectedIds.includes(detailId)) closeDetail();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove selected students');
    } finally {
      setBulkDeleting(false);
    }
  };

  const updateStatus = async (status) => {
    setSavingStatus(true);
    try {
      await axios.put(`${API}/college/students/${detailId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Status updated');
      openDetail(detailId);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to update status'); }
    finally { setSavingStatus(false); }
  };

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const runVerify = async (action, reason) => {
    setVerifying(true);
    try {
      await axios.post(`${API}/college/students/${detailId}/verify`, { action, reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === 'approve' ? 'ID approved' : 'ID rejected');
      setRejectDialogOpen(false);
      openDetail(detailId);
      fetchStudents();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to update'); }
    finally { setVerifying(false); }
  };

  const verifyId = (action) => {
    if (action === 'reject') { setRejectDialogOpen(true); return; }
    runVerify('approve');
  };

  const handleImport = async () => {
    if (!importFile) return toast.error('Select a CSV file');
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await axios.post(`${API}/college/students/csv-import`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Imported ${res.data.imported} students. Skipped: ${res.data.skipped}. Errors: ${res.data.errors?.length || 0}`);
      setShowImport(false);
      setImportFile(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Import failed');
    } finally { setImporting(false); }
  };

  const downloadAccreditationTemplate = async type => {
    try {
      const res = await axios.get(`${API}/college/accreditation/template/${type}`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `accreditation_${type}_template.csv`; anchor.click(); window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download accreditation template'); }
  };

  const importAccreditationCsv = async type => {
    const file = type === 'placement' ? placementAccreditationFile : progressionAccreditationFile;
    if (!file) return toast.error(`Select a ${type} CSV file`);
    setImportingAccreditationCsv(type);
    try {
      const form = new FormData(); form.append('file', file);
      const res = await axios.post(`${API}/college/accreditation/import/${type}`, form, { headers: { Authorization: `Bearer ${token}` } });
      setAccreditationImportResult({ type, ...res.data });
      toast.success(res.data.msg);
      if (type === 'placement') setPlacementAccreditationFile(null); else setProgressionAccreditationFile(null);
      if (listUnlocked) fetchStudents();
    } catch (err) { toast.error(err.response?.data?.msg || `Failed to import ${type} records`); }
    finally { setImportingAccreditationCsv(''); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={18} className="text-[#39c884]" /> Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {listUnlocked ? `${total} students total` : 'Select a course and year, or search to view all students'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {listUnlocked && (
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="rounded text-xs font-medium gap-1 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white transition-all cursor-pointer">
              <Filter size={14} /> Filters <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)} className="rounded text-xs font-medium gap-1 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white transition-all cursor-pointer">
            <Upload size={14} /> Bulk CSV Import
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCredentials} className="rounded text-xs font-medium gap-1 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white transition-all cursor-pointer text-slate-700">
            <Download size={14} /> Export Credentials
          </Button>
        </div>
      </div>

      {/* CSV Import */}
      {showImport && (
        <div className="p-5 bg-white rounded-none border border-[#e8e8e8] shadow-sm space-y-3 animate-in fade-in duration-300">
          <div>
            <p className="text-sm font-semibold text-slate-900">Bulk Student & Accreditation Import</p>
            <p className="text-xs text-slate-500 mt-1">Use the updated combined template to create/update students and include their placement or progression record in the same CSV.</p>
          </div>
          <div className="flex gap-2 items-center">
            <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])} className="text-xs flex-1" />
            <Button size="sm" onClick={handleImport} disabled={importing} className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white text-xs font-medium px-4 border-none">
              {importing ? 'Importing...' : 'Import combined CSV'}
            </Button>
          </div>
          <button onClick={downloadTemplate} className="text-xs font-medium text-[#39c884] hover:text-[#2ea86e] hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent">
            <Download size={12} /> Download Students Upload Template
          </button>

          <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div><p className="text-xs font-semibold text-slate-900">Update accreditation records for existing students</p><p className="text-[10px] text-slate-500 mt-0.5">Students are matched by register number. Import the Placement Register first, then Progression.</p></div>
              <div className="flex gap-3"><button onClick={() => downloadAccreditationTemplate('placement')} className="text-[10px] font-medium text-[#39c884] hover:underline border-none bg-transparent cursor-pointer">Placement template</button><button onClick={() => downloadAccreditationTemplate('progression')} className="text-[10px] font-medium text-[#39c884] hover:underline border-none bg-transparent cursor-pointer">Progression template</button></div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-none border border-emerald-100 bg-emerald-50/10 p-4 space-y-2">
                <p className="text-[11px] font-semibold text-emerald-950">Placement Register CSV</p>
                <input type="file" accept=".csv,text/csv" onChange={event => setPlacementAccreditationFile(event.target.files?.[0] || null)} className="block w-full text-[10px]" />
                <Button size="sm" onClick={() => importAccreditationCsv('placement')} disabled={!placementAccreditationFile || !!importingAccreditationCsv} className="h-8 rounded bg-[#39c884] hover:bg-[#2ea86e] text-white text-[10px] font-medium border-none">{importingAccreditationCsv === 'placement' ? 'Importing…' : 'Bulk import placements'}</Button>
              </div>
              <div className="rounded-none border border-indigo-100 bg-indigo-50/20 p-4 space-y-2">
                <p className="text-[11px] font-semibold text-indigo-950">Progression CSV</p>
                <input type="file" accept=".csv,text/csv" onChange={event => setProgressionAccreditationFile(event.target.files?.[0] || null)} className="block w-full text-[10px]" />
                <Button size="sm" onClick={() => importAccreditationCsv('progression')} disabled={!progressionAccreditationFile || !!importingAccreditationCsv} className="h-8 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium border-none">{importingAccreditationCsv === 'progression' ? 'Importing…' : 'Bulk import progression'}</Button>
              </div>
            </div>
            {accreditationImportResult && <div className="rounded-none border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap gap-3 text-[10px] font-bold"><span>{accreditationImportResult.totalRows} rows</span><span className="text-emerald-600">{accreditationImportResult.imported} imported</span><span className="text-amber-600">{accreditationImportResult.warnings} warnings</span><span className="text-red-600">{accreditationImportResult.failed} failed</span><span className="text-orange-600">{accreditationImportResult.unmatched} unmatched</span></div>
              {accreditationImportResult.issues?.length > 0 && <div className="max-h-32 overflow-y-auto mt-2 space-y-1">{accreditationImportResult.issues.map((issue,index) => <p key={`${issue.row}-${index}`} className="text-[9px] text-slate-600"><b>Row {issue.row}{issue.registerNumber ? ` · ${issue.registerNumber}` : ''}:</b> {issue.issue}</p>)}</div>}
            </div>}
          </div>
        </div>
      )}

      {/* Course & Year gate */}
      {!listUnlocked ? (
        <div className="bg-white rounded-none border border-[#e8e8e8] shadow-sm p-10 flex flex-col items-center text-center gap-4">
          <div className="w-10 h-10 rounded-none bg-[#39c884]/10 flex items-center justify-center text-[#39c884] border border-[#39c884]/30">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-800">Select Course &amp; Year</p>
            <p className="text-xs text-slate-400 mt-1">Choose a department and batch year to view the student list.</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <select value={pendingDept} onChange={e => setPendingDept(e.target.value)} disabled={departmentsLoading} className="text-xs font-normal bg-white border border-[#d9d9d9] rounded-none px-3 py-2 text-slate-700 min-w-[160px] disabled:opacity-50 hover:border-[#39c884] focus:border-[#39c884] focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all outline-none cursor-pointer">
              <option value="">{departmentsLoading ? 'Loading courses...' : 'Select Course'}</option>
              {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
            </select>
            <select value={pendingYear} onChange={e => setPendingYear(e.target.value)} disabled={yearsLoading} className="text-xs font-normal bg-white border border-[#d9d9d9] rounded-none px-3 py-2 text-slate-700 min-w-[160px] disabled:opacity-50 hover:border-[#39c884] focus:border-[#39c884] focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all outline-none cursor-pointer">
              <option value="">{yearsLoading ? 'Loading years...' : 'Select Year'}</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button onClick={viewStudents} className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white font-medium px-6 h-9 transition-colors border-none cursor-pointer">View Students</Button>
          </div>
          {!departmentsLoading && departments.length === 0 && (
            <p className="text-[11px] text-amber-600 font-medium">No courses configured yet. Add departments for your college to enable this filter.</p>
          )}
          {!yearsLoading && years.length === 0 && (
            <p className="text-[11px] text-amber-600 font-medium">No academic years yet. Create a campus drive or add a student to enable this filter.</p>
          )}

          <div className="w-full max-w-sm flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-slate-300 pt-2">
            <div className="flex-1 h-px bg-slate-200" /> Or <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={searchAllStudents} className="w-full max-w-md flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all students by name, email, or roll number..." className="pl-9 h-9 rounded-none border-[#d9d9d9] hover:border-[#39c884] focus:border-[#39c884] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all placeholder:text-slate-400" />
            </div>
            <Button type="submit" variant="outline" className="rounded text-xs font-medium px-5 h-9 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white transition-all cursor-pointer">Search All</Button>
          </form>
          <p className="text-[11px] text-slate-400">Shows every student, A–Z within each batch year.</p>
        </div>
      ) : (
      <>
      {/* Selected course/year, or browse-all indicator */}
      <div className="flex items-center gap-2">
        {courseYearSelected ? (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-100">
            {departments.find(d => d.code === filters.department)?.name || filters.department} · Batch {filters.batchYear}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-none bg-slate-100 text-slate-600 border border-slate-200">
            All Students · A–Z by Year
          </span>
        )}
        <button onClick={changeCourseYear} className="text-xs font-medium text-[#39c884] hover:text-[#2ea86e] underline cursor-pointer bg-transparent border-none">Change</button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or roll number..." className="pl-9 h-9 rounded-none border-[#d9d9d9] hover:border-[#39c884] focus:border-[#39c884] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all placeholder:text-slate-400" />
        </div>
        <Button type="submit" size="sm" className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white font-medium px-6 h-9 border-none cursor-pointer">Search</Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-none border border-[#e8e8e8] shadow-sm animate-in fade-in duration-300">
          {browseAll && (
            <>
              <select value={filters.department} onChange={e => { setFilters(p => ({ ...p, department: e.target.value })); setPage(1); }} className="text-xs font-normal bg-white border border-[#d9d9d9] rounded-none px-3 py-2 text-slate-700 min-w-[140px] hover:border-[#39c884] focus:border-[#39c884] outline-none cursor-pointer">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
              <select value={filters.batchYear} onChange={e => { setFilters(p => ({ ...p, batchYear: e.target.value })); setPage(1); }} className="text-xs font-normal bg-white border border-[#d9d9d9] rounded-none px-3 py-2 text-slate-700 min-w-[140px] hover:border-[#39c884] focus:border-[#39c884] outline-none cursor-pointer">
                <option value="">All Batches</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }} className="text-xs font-normal bg-white border border-[#d9d9d9] rounded-none px-3 py-2 text-slate-700 min-w-[140px] hover:border-[#39c884] focus:border-[#39c884] outline-none cursor-pointer">
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => {
              setFilters(p => ({ ...p, status: '', ...(browseAll ? { department: '', batchYear: '' } : {}) }));
              setPage(1);
            }}
            className="text-xs font-medium text-[#39c884] hover:text-[#2ea86e] cursor-pointer bg-transparent border-none"
          >
            Clear
          </button>
        </div>
      )}

      {/* Selection toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/20 border border-blue-100 rounded-none">
          <p className="text-xs font-medium text-slate-700">{selectedIds.length} student{selectedIds.length === 1 ? '' : 's'} selected</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds([])} className="text-xs font-medium text-[#39c884] hover:underline cursor-pointer bg-transparent border-none">Clear</button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} className="rounded-none text-xs font-medium gap-1.5 h-8">
              <Trash2 size={13} /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-3 border-[#39c884] border-t-transparent rounded-full" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e8e8e8]">
          <Users size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No students found</p>
          <p className="text-xs text-slate-400 mt-1">Share your campus drive QR to start registrations</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-[#e8e8e8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fafafa]">
                <tr className="border-b border-[#e8e8e8]">
                  <th className="w-10 py-3 pl-4 pr-1">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                      className="rounded-none border-slate-300 text-[#39c884] focus:ring-[#39c884]"
                      title="Select all on this page"
                    />
                  </th>
                  {['Student', 'Department', 'Batch', 'Roll No.', 'Status', 'Verified', 'Source', 'Registered'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-800">{h}</th>
                  ))}
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className={`border-b border-[#f0f0f0] hover:bg-[#fafafa] transition-colors cursor-pointer ${selectedIds.includes(s._id) ? 'bg-[#39c884]/5' : ''}`} onClick={() => openDetail(s._id)}>
                    <td className="py-3 pl-4 pr-1" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(s._id)}
                        onChange={() => toggleSelect(s._id)}
                        className="rounded-none border-slate-300 text-[#39c884] focus:ring-[#39c884]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-emerald-50 flex items-center justify-center text-[#39c884] font-bold text-xs shrink-0">{s.user?.name?.[0]?.toUpperCase() || '?'}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate">{s.user?.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-normal text-slate-600">{s.department || '—'}</td>
                    <td className="py-3 px-4 text-xs font-normal text-slate-600">{s.batchYear || '—'}</td>
                    <td className="py-3 px-4 text-xs font-normal text-slate-600">{s.rollNumber || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold uppercase tracking-wider ${statusColors[s.placementStatus] || 'bg-slate-50 text-slate-600'}`}>{s.placementStatus}</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.idVerification?.status === 'approved' ? <ShieldCheck size={16} className="text-[#39c884]" /> : <span className="text-[10px] text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-[10px] font-semibold uppercase text-slate-400">{s.registrationSource}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openDetail(s._id)} title="View" className="p-1.5 rounded-none text-slate-400 hover:text-[#39c884] hover:bg-emerald-50 transition-colors bg-transparent border-none cursor-pointer">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(s)} title="Edit" className="p-1.5 rounded-none text-slate-400 hover:text-[#39c884] hover:bg-emerald-50 transition-colors bg-transparent border-none cursor-pointer">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} title="Delete" className="p-1.5 rounded-none text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8e8e8] bg-[#fafafa]">
              <p className="text-xs text-slate-500 font-medium">Page {page} of {pages} ({total} total)</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-none text-xs h-8 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white cursor-pointer transition-all">Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="rounded-none text-xs h-8 border-[#d9d9d9] hover:text-[#39c884] hover:border-[#39c884] hover:bg-white cursor-pointer transition-all">Next</Button>
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {/* Detail Drawer */}
      {detailId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={closeDetail}>
          <div className="bg-white rounded-2xl max-w-2xl w-full mt-10 mb-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-sm font-black text-slate-900">{detail?.student?.user?.name || 'Student Detail'}</h2>
              <div className="flex items-center gap-1">
                {detail?.student && (
                  <>
                    <button onClick={() => openEdit(detail.student)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteTarget(detail.student)} title="Delete" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button onClick={closeDetail} className="text-slate-400 hover:text-slate-700 ml-1"><X size={18} /></button>
              </div>
            </div>

            {detailLoading || !detail ? (
              <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="p-5 space-y-6 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">Email</p><p className="font-bold text-slate-800">{detail.student.user?.email}</p></div>
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">Phone</p><p className="font-bold text-slate-800">{detail.student.phone || detail.student.user?.profile?.phone || '—'}</p></div>
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">Department</p><p className="font-bold text-slate-800">{detail.student.department || '—'}</p></div>
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">Batch / Roll No.</p><p className="font-bold text-slate-800">{detail.student.batchYear || '—'} / {detail.student.rollNumber || '—'}</p></div>
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">CGPA / Arrears</p><p className="font-bold text-slate-800">{detail.student.cgpa || 0} / {detail.student.activeArrears || 0}</p></div>
                  <div><p className="text-slate-400 font-bold uppercase text-[10px]">Source</p><p className="font-bold text-slate-800 uppercase">{detail.student.registrationSource}</p></div>
                </div>

                {/* Status update */}
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Placement Status</p>
                  <div className="flex items-center gap-2">
                    <select
                      defaultValue={detail.student.placementStatus}
                      onChange={e => updateStatus(e.target.value)}
                      disabled={savingStatus}
                      className="h-9 rounded-lg border border-slate-200 px-2 font-bold"
                    >
                      {statusUpdateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {savingStatus && <span className="text-slate-400">Saving...</span>}
                  </div>
                </div>

                {/* Accreditation capture — source of truth for compliance exports */}
                <form onSubmit={saveAccreditation} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
                  <div>
                    <p className="text-indigo-900 font-black uppercase text-[10px]">Accreditation Placement / Progression Record</p>
                    <p className="text-[10px] text-indigo-600 mt-1">Required source data for the NAAC/NBA/AICTE/NIRF-ready export. Evidence is mandatory for every claimed outcome.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="space-y-1"><span className="font-bold text-slate-500">Gender *</span><select value={accreditationForm.gender} onChange={e => setAccreditationForm(p => ({ ...p, gender: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2"><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Programme *</span><Input value={accreditationForm.programme} onChange={e => setAccreditationForm(p => ({ ...p, programme: e.target.value }))} placeholder="B.E. Computer Science and Engineering" className="h-9 bg-white" /></label>
                    <label className="space-y-1 sm:col-span-2"><span className="font-bold text-slate-500">Outcome *</span><select value={accreditationForm.outcome} onChange={e => setAccreditationForm(p => ({ ...p, outcome: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2"><option>Not Placed</option><option>Placed</option><option>Higher Studies</option><option>Qualified Competitive Exam</option></select></label>
                  </div>

                  {accreditationForm.outcome === 'Placed' && <div className="grid sm:grid-cols-2 gap-3 border-t border-indigo-100 pt-3">
                    <label className="space-y-1"><span className="font-bold text-slate-500">Canonical employer *</span><Input list="canonical-employers" value={accreditationForm.employerName} onChange={e => setAccreditationForm(p => ({ ...p, employerName: e.target.value }))} placeholder="Select a registered company" className="h-9 bg-white" /><datalist id="canonical-employers">{canonicalEmployers.map(company => <option key={company._id} value={company.name}>{company.location}</option>)}</datalist><span className="text-[9px] text-slate-400">Only administrator-managed company names are accepted.</span></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Employer city</span><Input value={accreditationForm.employerCity} onChange={e => setAccreditationForm(p => ({ ...p, employerCity: e.target.value }))} className="h-9 bg-white" /></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Designation / role *</span><Input value={accreditationForm.designation} onChange={e => setAccreditationForm(p => ({ ...p, designation: e.target.value }))} className="h-9 bg-white" /></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Package (LPA) *</span><Input type="number" min="0" step="0.01" value={accreditationForm.packageLPA} onChange={e => setAccreditationForm(p => ({ ...p, packageLPA: e.target.value }))} className="h-9 bg-white" /></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Offer date *</span><Input type="date" value={accreditationForm.offerDate} onChange={e => setAccreditationForm(p => ({ ...p, offerDate: e.target.value }))} className="h-9 bg-white" /></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Offer source *</span><select value={accreditationForm.offerSource} onChange={e => setAccreditationForm(p => ({ ...p, offerSource: e.target.value }))} className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2"><option value="">Select</option><option>Campus drive</option><option>Pool campus drive</option><option>Off-campus, verified</option><option>Platform application</option></select></label>
                    <label className="space-y-1 sm:col-span-2"><span className="font-bold text-slate-500">Drive / requisition reference</span><Input value={accreditationForm.driveReference} onChange={e => setAccreditationForm(p => ({ ...p, driveReference: e.target.value }))} placeholder="DRV-2026-037" className="h-9 bg-white" /></label>
                  </div>}

                  {['Higher Studies', 'Qualified Competitive Exam'].includes(accreditationForm.outcome) && <div className="grid sm:grid-cols-2 gap-3 border-t border-indigo-100 pt-3">
                    <label className="space-y-1"><span className="font-bold text-slate-500">Institution / examination *</span><Input value={accreditationForm.institutionJoined} onChange={e => setAccreditationForm(p => ({ ...p, institutionJoined: e.target.value }))} className="h-9 bg-white" /></label>
                    <label className="space-y-1"><span className="font-bold text-slate-500">Programme joined / result *</span><Input value={accreditationForm.programmeJoined} onChange={e => setAccreditationForm(p => ({ ...p, programmeJoined: e.target.value }))} className="h-9 bg-white" /></label>
                  </div>}

                  {accreditationForm.outcome !== 'Not Placed' && <label className="block space-y-1 border-t border-indigo-100 pt-3"><span className="font-bold text-slate-500">{accreditationForm.outcome === 'Placed' ? 'Offer letter' : 'Admission letter / scorecard'} evidence *</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setAccreditationEvidence(e.target.files?.[0] || null)} className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-[10px]" />{(accreditationForm.evidenceUrl || accreditationForm.progressionEvidenceUrl) && <a href={`${import.meta.env.VITE_API_DOMAIN}${accreditationForm.evidenceUrl || accreditationForm.progressionEvidenceUrl}`} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 hover:underline">View evidence currently on record</a>}</label>}
                  <Button type="submit" disabled={savingAccreditation} className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider">{savingAccreditation ? 'Saving & verifying…' : 'Save accreditation record'}</Button>
                </form>

                {/* ID Verification */}
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">ID Verification</p>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold uppercase px-2 py-1 rounded-full text-[10px] ${detail.student.idVerification?.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : detail.student.idVerification?.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                      {detail.student.idVerification?.status || 'none'}
                    </span>
                    {detail.student.idVerification?.status === 'pending' && (
                      <>
                        <Button size="sm" disabled={verifying} onClick={() => verifyId('approve')} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold h-8 gap-1">
                          <CheckCircle2 size={12} /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={verifying} onClick={() => verifyId('reject')} className="rounded-lg text-[10px] font-bold h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50">
                          <XCircle size={12} /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Drive applications */}
                {detail.student.driveApplications?.length > 0 && (
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Drive Applications</p>
                    <div className="space-y-1">
                      {detail.student.driveApplications.map((da, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                          <span className="font-bold text-slate-800">{da.drive?.title || 'Drive'}</span>
                          <span className="font-bold uppercase text-[10px] text-slate-500">{da.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity monitoring */}
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Activity</p>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="flex items-center gap-1.5"><LogIn size={12} className="text-emerald-500" /><span className="font-bold text-slate-700">{detail.loginActivity?.lastLoginAt ? new Date(detail.loginActivity.lastLoginAt).toLocaleString('en-IN') : 'Never logged in'}</span></div>
                    <div className="flex items-center gap-1.5"><LogOut size={12} className="text-slate-400" /><span className="font-bold text-slate-700">{detail.loginActivity?.lastLogoutAt ? new Date(detail.loginActivity.lastLogoutAt).toLocaleString('en-IN') : '—'}</span></div>
                  </div>
                  <p className="text-slate-500 mb-2 flex items-center gap-1"><Clock size={12} /> Total time on platform: <span className="font-bold text-slate-800">{detail.loginActivity?.totalMinutes || 0} min</span></p>
                  {(() => {
                    const sessions = detail.loginActivity?.sessions || [];
                    const activityPages = Math.max(1, Math.ceil(sessions.length / ACTIVITY_PAGE_SIZE));
                    const pagedSessions = sessions.slice((activityPage - 1) * ACTIVITY_PAGE_SIZE, activityPage * ACTIVITY_PAGE_SIZE);
                    return (
                      <>
                        <div className="space-y-1">
                          {pagedSessions.map((s, i) => (
                            <div key={i} className="flex justify-between text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1">
                              <span>{new Date(s.loginAt).toLocaleString('en-IN')}</span>
                              <span>{s.logoutAt ? `${s.durationMinutes} min` : 'active session'}</span>
                            </div>
                          ))}
                          {sessions.length === 0 && (
                            <p className="text-slate-400">No session history yet.</p>
                          )}
                        </div>
                        {activityPages > 1 && (
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-slate-400 font-medium">Page {activityPage} of {activityPages}</p>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" disabled={activityPage <= 1} onClick={() => setActivityPage(p => p - 1)} className="rounded-lg text-[10px] h-6 px-2">Prev</Button>
                              <Button variant="outline" size="sm" disabled={activityPage >= activityPages} onClick={() => setActivityPage(p => p + 1)} className="rounded-lg text-[10px] h-6 px-2">Next</Button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title="Reject this student's ID verification?"
        confirmLabel="Reject"
        destructive
        loading={verifying}
        reason={{ label: 'Reason (optional)', placeholder: 'Let the student know what needs fixing...' }}
        onConfirm={(reason) => runVerify('reject', reason)}
      />

      {/* Edit Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
          <form onSubmit={saveEdit} className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900">Edit {editStudent.user?.name}</h2>
              <button type="button" onClick={closeEdit} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</label>
                  <Input value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Batch Year</label>
                  <Input type="number" value={editForm.batchYear} onChange={e => setEditForm(p => ({ ...p, batchYear: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</label>
                  <Input value={editForm.rollNumber} onChange={e => setEditForm(p => ({ ...p, rollNumber: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                  <PhoneNumberInput value={editForm.phone} onChange={phone => setEditForm(p => ({ ...p, phone }))} size="sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CGPA</label>
                  <Input type="number" step="0.01" value={editForm.cgpa} onChange={e => setEditForm(p => ({ ...p, cgpa: e.target.value }))} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Arrears</label>
                  <Input type="number" value={editForm.activeArrears} onChange={e => setEditForm(p => ({ ...p, activeArrears: e.target.value }))} className="rounded-xl h-10" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end p-5 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={closeEdit} className="rounded-xl text-xs font-bold">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.user?.name || 'this student'} from your college?`}
        description="This removes them from your student list and any drive registrations. Their job-seeker account itself is not deleted."
        confirmLabel="Remove"
        destructive
        loading={deleting}
        onConfirm={confirmDeleteStudent}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Remove ${selectedIds.length} student${selectedIds.length === 1 ? '' : 's'} from your college?`}
        description="This removes them from your student list and any drive registrations. Their job-seeker accounts themselves are not deleted."
        confirmLabel="Remove"
        destructive
        loading={bulkDeleting}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
};

export default Students;
