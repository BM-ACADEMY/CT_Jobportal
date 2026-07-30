import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { QrCode, Plus, Users, Calendar, Copy, ExternalLink, ToggleLeft, ToggleRight, Trash2, X, Megaphone, UserPlus, CheckCircle2, Clock, Edit2, Building2, Download, Search, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const API = import.meta.env.VITE_API_BASE_URL;

const STAGE_OPTIONS = [
  { value: 'registered', label: 'Registered' },
  { value: 'stage1', label: 'Stage 1' },
  { value: 'stage2', label: 'Stage 2' },
  { value: 'final_interview', label: 'Final Interview' },
  { value: 'certificate_verification', label: 'Certificate Verification' },
  { value: 'selected', label: 'Selected' },
  { value: 'rejected', label: 'Rejected' },
];

const emptyCompanyRow = { name: '', packageLPA: '', tierPolicy: 'regular', contactName: '', contactEmail: '' };
const emptyForm = { title: '', batchYear: new Date().getFullYear(), departments: '', description: '', companies: [{ ...emptyCompanyRow }], minCGPA: '', maxArrears: '', rounds: '' };

const Drives = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const token = auth?.token || localStorage.getItem('token');
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null); // drive being edited, or null when creating

  // Detail modal state
  const [detailDrive, setDetailDrive] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stageValue, setStageValue] = useState('stage1');
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);
  const [applyingStage, setApplyingStage] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', link: '' });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inchargeForm, setInchargeForm] = useState({ name: '', email: '', phone: '', assignedCompanies: [] });
  const [invitingIncharge, setInvitingIncharge] = useState(false);

  useEffect(() => { fetchDrives(); }, []);

  const fetchDrives = async () => {
    try {
      const res = await axios.get(`${API}/college/drives`, { headers: { Authorization: `Bearer ${token}` } });
      setDrives(res.data);
    } catch { toast.error('Failed to load drives'); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingDrive(null);
    setForm(emptyForm);
    setShowCreate(true);
  };

  const openEditDrive = (drive) => {
    setEditingDrive(drive);
    setForm({
      title: drive.title || '',
      batchYear: drive.batchYear || new Date().getFullYear(),
      departments: (drive.departments || []).join(', '),
      description: drive.description || '',
      companies: drive.companies?.length > 0
        ? drive.companies.map(c => ({ _id: c._id, name: c.name, packageLPA: c.packageLPA || '', tierPolicy: c.tierPolicy || 'regular', contactName: c.contactName || '', contactEmail: c.contactEmail || '' }))
        : drive.companyName
          ? [{ name: drive.companyName, packageLPA: drive.packageLPA || '', tierPolicy: drive.tierPolicy || 'regular', contactName: '', contactEmail: '' }]
          : [{ ...emptyCompanyRow }],
      minCGPA: drive.eligibility?.minCGPA ?? '',
      maxArrears: drive.eligibility?.maxArrears ?? '',
      rounds: (drive.rounds || []).map(r => r.name).join(', '),
    });
    setShowCreate(true);
  };

  const addCompanyRow = () => setForm(p => ({ ...p, companies: [...p.companies, { ...emptyCompanyRow }] }));
  const removeCompanyRow = (idx) => setForm(p => ({ ...p, companies: p.companies.filter((_, i) => i !== idx) }));
  const updateCompanyRow = (idx, field, value) => setForm(p => ({
    ...p,
    companies: p.companies.map((c, i) => i === idx ? { ...c, [field]: value } : c)
  }));

  const saveDrive = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    setCreating(true);
    try {
      const payload = {
        title: form.title,
        batchYear: parseInt(form.batchYear),
        departments: form.departments.split(',').map(d => d.trim()).filter(Boolean),
        description: form.description,
        companies: form.companies
          .filter(c => c.name.trim())
          .map(c => ({
            _id: c._id,
            name: c.name.trim(),
            packageLPA: c.packageLPA ? parseFloat(c.packageLPA) : 0,
            tierPolicy: c.tierPolicy,
            contactName: c.contactName || '',
            contactEmail: c.contactEmail || ''
          })),
        eligibility: {
          minCGPA: form.minCGPA ? parseFloat(form.minCGPA) : 0,
          maxArrears: form.maxArrears !== '' ? parseInt(form.maxArrears) : 10,
        },
        rounds: form.rounds.split(',').map(r => r.trim()).filter(Boolean).map((name, i) => ({ name, order: i + 1 })),
      };
      if (editingDrive) {
        await axios.put(`${API}/college/drives/${editingDrive._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Drive updated!');
      } else {
        await axios.post(`${API}/college/drives`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Drive created!');
      }
      setShowCreate(false);
      setEditingDrive(null);
      setForm(emptyForm);
      fetchDrives();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
    finally { setCreating(false); }
  };

  const toggleDrive = async (drive) => {
    try {
      await axios.put(`${API}/college/drives/${drive._id}`, { isActive: !drive.isActive }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(drive.isActive ? 'Drive closed' : 'Drive reopened');
      fetchDrives();
    } catch { toast.error('Failed to update'); }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingDrive, setDeletingDrive] = useState(false);

  const removeDrive = (drive) => {
    if (drive.isActive) return toast.error('Close the drive before deleting it');
    setDeleteTarget(drive);
  };

  const confirmDeleteDrive = async () => {
    const drive = deleteTarget;
    setDeletingDrive(true);
    try {
      await axios.delete(`${API}/college/drives/${drive._id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Drive deleted');
      if (detailDrive?._id === drive._id) closeDetail();
      setDeleteTarget(null);
      fetchDrives();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to delete'); }
    finally { setDeletingDrive(false); }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Registration link copied!');
  };

  const openDetail = async (drive) => {
    setDetailDrive(drive);
    setDetailLoading(true);
    setSelectedIds([]);
    setSelectedCompanyIdx(0);
    try {
      const res = await axios.get(`${API}/college/drives/${drive._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDetailData(res.data);
    } catch { toast.error('Failed to load drive detail'); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailDrive(null); setDetailData(null); };

  const toggleSelect = (id) => {
    setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const applyStage = async () => {
    if (selectedIds.length === 0) return toast.error('Select at least one student');
    setApplyingStage(true);
    try {
      const payload = { studentIds: selectedIds, status: stageValue };
      if (stageValue === 'selected' && detailDrive.companies?.length > 0) {
        const chosen = detailDrive.companies[selectedCompanyIdx] || detailDrive.companies[0];
        payload.companyName = chosen.name;
        payload.packageLPA = chosen.packageLPA;
        payload.tierPolicy = chosen.tierPolicy;
      }
      await axios.put(`${API}/college/drives/${detailDrive._id}/student-round`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Updated ${selectedIds.length} student(s) to ${stageValue}`);
      setSelectedIds([]);
      openDetail(detailDrive);
      fetchDrives();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to update'); }
    finally { setApplyingStage(false); }
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title) return toast.error('Title is required');
    setPostingAnnouncement(true);
    try {
      await axios.post(`${API}/college/drives/${detailDrive._id}/announcements`, announcementForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Announcement posted');
      setAnnouncementForm({ title: '', message: '', link: '' });
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to post'); }
    finally { setPostingAnnouncement(false); }
  };

  const submitInchargeInvite = async (e) => {
    e.preventDefault();
    if (!inchargeForm.name || !inchargeForm.email || !inchargeForm.phone) return toast.error('Name, email, and phone are required');
    setInvitingIncharge(true);
    try {
      const res = await axios.post(`${API}/college/drives/${detailDrive._id}/incharge/invite`, inchargeForm, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.emailSent) {
        toast.success(`Invite sent to ${inchargeForm.email}`);
      } else {
        navigator.clipboard.writeText(res.data.acceptUrl);
        toast.error('The invite was created, but the email failed to send. The accept link was copied — share it with them directly, or hit Resend later.', { duration: 8000 });
      }
      setInchargeForm({ name: '', email: '', phone: '', assignedCompanies: [] });
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to send invite'); }
    finally { setInvitingIncharge(false); }
  };

  const toggleAssignedCompany = (companyId) => {
    setInchargeForm(p => ({
      ...p,
      assignedCompanies: p.assignedCompanies.includes(companyId)
        ? p.assignedCompanies.filter(id => id !== companyId)
        : [...p.assignedCompanies, companyId]
    }));
  };

  const [resendingId, setResendingId] = useState(null);

  const resendIncharge = async (ic) => {
    setResendingId(ic._id);
    try {
      const res = await axios.post(`${API}/college/drives/${detailDrive._id}/incharge/${ic._id}/resend`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.emailSent) {
        toast.success(`Invite resent to ${ic.email}`);
      } else {
        navigator.clipboard.writeText(res.data.acceptUrl);
        toast.error('Email still failed to send. The accept link was copied to your clipboard instead.', { duration: 8000 });
      }
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to resend invite'); }
    finally { setResendingId(null); }
  };

  const [removeInchargeTarget, setRemoveInchargeTarget] = useState(null);
  const [removingIncharge, setRemovingIncharge] = useState(false);

  const confirmRemoveIncharge = async () => {
    setRemovingIncharge(true);
    try {
      await axios.delete(`${API}/college/drives/${detailDrive._id}/incharge/${removeInchargeTarget._id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('In-charge removed');
      setRemoveInchargeTarget(null);
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to remove in-charge'); }
    finally { setRemovingIncharge(false); }
  };

  const [sendingLinkId, setSendingLinkId] = useState(null);

  const sendCompanyLink = async (company) => {
    if (!company.contactEmail) return toast.error('Add a contact email for this company first (Edit Drive)');
    setSendingLinkId(company._id);
    try {
      const res = await axios.post(`${API}/college/drives/${detailDrive._id}/companies/${company._id}/send-link`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.emailSent) {
        toast.success(`Candidate list link sent to ${company.contactEmail}`);
      } else {
        navigator.clipboard.writeText(res.data.viewUrl);
        toast.error('Email failed to send. The link was copied to your clipboard instead.', { duration: 8000 });
      }
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to send link'); }
    finally { setSendingLinkId(null); }
  };

  const copyCompanyLink = (company) => {
    if (!company.accessToken) return toast.error('Send the link once first to generate it');
    navigator.clipboard.writeText(`${window.location.origin}/company-drive/${company.accessToken}`);
    toast.success('Candidate list link copied!');
  };

  // Invite a real registered Company account to participate — distinct from the manual
  // name/contact-email rows above; this sends a formal request the company can accept/reject.
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState([]);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  const [invitingCompanyId, setInvitingCompanyId] = useState(null);
  const [resendingEntryId, setResendingEntryId] = useState(null);
  // Email and WhatsApp are independent channels — the TPO picks which one(s) to send through.
  const [inviteChannels, setInviteChannels] = useState({ email: true, whatsapp: true });
  const toggleInviteChannel = (channel) => setInviteChannels(p => ({ ...p, [channel]: !p[channel] }));
  const selectedChannelsList = () => Object.entries(inviteChannels).filter(([, on]) => on).map(([c]) => c);

  useEffect(() => {
    if (!companySearchQuery.trim()) { setCompanySearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchingCompanies(true);
      try {
        const res = await axios.get(`${API}/college/companies/search`, {
          params: { query: companySearchQuery },
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanySearchResults(res.data);
      } catch { /* silent — search box stays empty */ }
      finally { setSearchingCompanies(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [companySearchQuery]);

  const inviteCompany = async (company) => {
    const channels = selectedChannelsList();
    if (channels.length === 0) return toast.error('Pick Email and/or WhatsApp before sending the invite');
    setInvitingCompanyId(company._id);
    try {
      await axios.post(`${API}/college/drives/${detailDrive._id}/invite-company/${company._id}`, { channels }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Invite sent to ${company.name}`);
      setCompanySearchQuery('');
      setCompanySearchResults([]);
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to send invite'); }
    finally { setInvitingCompanyId(null); }
  };

  const resendCompanyInvite = async (entry) => {
    const channels = selectedChannelsList();
    if (channels.length === 0) return toast.error('Pick Email and/or WhatsApp before resending');
    setResendingEntryId(entry._id);
    try {
      await axios.post(`${API}/college/drives/${detailDrive._id}/companies/${entry._id}/resend-invite`, { channels }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Invite resent to ${entry.name}`);
      openDetail(detailDrive);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to resend invite'); }
    finally { setResendingEntryId(null); }
  };

  const messageCompanyContact = (conversationId) => {
    navigate('/company/messages', { state: { conversationId } });
  };

  const [exportingStudents, setExportingStudents] = useState(false);

  const exportStudents = async () => {
    setExportingStudents(true);
    try {
      const res = await axios.get(`${API}/college/drives/${detailDrive._id}/students-export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detailDrive.driveCode || 'drive'}_registered_students.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Registered students list downloaded');
    } catch { toast.error('Failed to export students'); }
    finally { setExportingStudents(false); }
  };

  const [exportingCompanies, setExportingCompanies] = useState(false);

  const exportCompanies = async () => {
    setExportingCompanies(true);
    try {
      const res = await axios.get(`${API}/college/drives/${detailDrive._id}/companies-export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detailDrive.driveCode || 'drive'}_companies.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Participating companies downloaded');
    } catch { toast.error('Failed to export companies'); }
    finally { setExportingCompanies(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode size={20} className="text-emerald-600" /> Campus Drives
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{drives.length} drives</p>
        </div>
        <Button onClick={() => (showCreate ? setShowCreate(false) : openCreate())} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1">
          <Plus size={14} /> New Drive
        </Button>
      </div>

      {/* Create / Edit form */}
      {showCreate && (
        <form onSubmit={saveDrive} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in duration-300">
          <h3 className="text-sm font-bold text-slate-900">{editingDrive ? `Edit "${editingDrive.title}"` : 'Create New Campus Drive'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Drive Title *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 2025 Placement Drive" className="mt-1 rounded-xl" />
            </div>

            {/* Companies — multiple companies can participate under one drive */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Companies</label>
                <button type="button" onClick={addCompanyRow} className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add Company
                </button>
              </div>
              <div className="space-y-2">
                {form.companies.map((c, idx) => (
                  <div key={idx} className="space-y-1.5 bg-slate-50 rounded-xl p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center">
                      <Input value={c.name} onChange={e => updateCompanyRow(idx, 'name', e.target.value)} placeholder="e.g. TCS" className="rounded-lg bg-white" />
                      <Input type="number" step="0.1" value={c.packageLPA} onChange={e => updateCompanyRow(idx, 'packageLPA', e.target.value)} placeholder="Package (LPA)" className="rounded-lg bg-white" />
                      <select value={c.tierPolicy} onChange={e => updateCompanyRow(idx, 'tierPolicy', e.target.value)} className="h-10 rounded-lg border border-slate-200 px-2 text-sm font-medium bg-white">
                        <option value="regular">Regular</option>
                        <option value="dream">Dream</option>
                        <option value="super_dream">Super Dream</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCompanyRow(idx)}
                        disabled={form.companies.length === 1}
                        className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Remove company"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0.5">
                      <Input value={c.contactName} onChange={e => updateCompanyRow(idx, 'contactName', e.target.value)} placeholder="Contact person (optional)" className="rounded-lg bg-white h-8 text-xs" />
                      <Input type="email" value={c.contactEmail} onChange={e => updateCompanyRow(idx, 'contactEmail', e.target.value)} placeholder="Contact email — sends them a candidate list link" className="rounded-lg bg-white h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Batch Year *</label>
              <Input type="number" value={form.batchYear} onChange={e => setForm(p => ({ ...p, batchYear: e.target.value }))} className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Departments (comma-separated)</label>
              <Input value={form.departments} onChange={e => setForm(p => ({ ...p, departments: e.target.value }))} placeholder="CS, IT, ECE, Mech" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min CGPA</label>
              <Input type="number" step="0.1" value={form.minCGPA} onChange={e => setForm(p => ({ ...p, minCGPA: e.target.value }))} placeholder="e.g. 6.5" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Max Arrears</label>
              <Input type="number" value={form.maxArrears} onChange={e => setForm(p => ({ ...p, maxArrears: e.target.value }))} placeholder="e.g. 0" className="mt-1 rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interview Rounds (comma-separated)</label>
              <Input value={form.rounds} onChange={e => setForm(p => ({ ...p, rounds: e.target.value }))} placeholder="Aptitude, Technical, HR" className="mt-1 rounded-xl" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job Description / Notes</label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Role, JD, qualifications, etc." className="mt-1 rounded-xl" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => { setShowCreate(false); setEditingDrive(null); }} className="rounded-xl text-xs font-bold">Cancel</Button>
            <Button type="submit" disabled={creating} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
              {creating ? (editingDrive ? 'Saving...' : 'Creating...') : (editingDrive ? 'Save Changes' : 'Create Drive')}
            </Button>
          </div>
        </form>
      )}

      {/* Drives list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full" /></div>
      ) : drives.length === 0 ? (
        <div className="text-center py-16">
          <QrCode size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No campus drives yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first drive to generate a QR code</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drives.map(drive => (
            <div key={drive._id} className={`bg-white rounded-2xl border ${drive.isActive ? 'border-slate-100' : 'border-slate-200 opacity-70'} p-6 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* QR Code */}
                {drive.qrCodeUrl && (
                  <div className="shrink-0 w-28 h-28 rounded-xl border border-slate-100 overflow-hidden bg-white p-1">
                    <img src={drive.qrCodeUrl} alt="QR Code" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDetail(drive)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">{drive.title}</h3>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${drive.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {drive.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  {(drive.companies?.length > 0 ? drive.companies : drive.companyName ? [{ name: drive.companyName, packageLPA: drive.packageLPA }] : []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(drive.companies?.length > 0 ? drive.companies : [{ name: drive.companyName, packageLPA: drive.packageLPA }]).map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Building2 size={10} /> {c.name}{c.packageLPA ? ` · ${c.packageLPA} LPA` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 font-medium mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12} /> Batch {drive.batchYear}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {drive.studentCount || 0} students</span>
                    {drive.departments?.length > 0 && <span>Depts: {drive.departments.join(', ')}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => copyLink(drive.registrationUrl)} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <Copy size={12} /> Copy Link
                    </button>
                    <button onClick={() => window.open(drive.registrationUrl, '_blank')} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <ExternalLink size={12} /> Open
                    </button>
                    <button onClick={() => toggleDrive(drive)} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">
                      {drive.isActive ? <><ToggleRight size={12} /> Close Drive</> : <><ToggleLeft size={12} /> Reopen</>}
                    </button>
                    <button onClick={() => openDetail(drive)} className="flex items-center gap-1 text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                      Manage Drive
                    </button>
                    <button onClick={() => openEditDrive(drive)} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">
                      <Edit2 size={12} /> Edit
                    </button>
                    {!drive.isActive && (
                      <button onClick={() => removeDrive(drive)} className="flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Code */}
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Drive Code</p>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{drive.driveCode}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{drive.display_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailDrive && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <h2 className="text-sm font-black text-slate-900">{detailDrive.title}</h2>
              <button onClick={closeDetail} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-16 shrink-0"><div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full" /></div>
            ) : detailData && (
              <div className="p-5 space-y-6 overflow-y-auto">
                {/* Students + stage update */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Students ({detailData.students?.length || 0})</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={exportingStudents || !detailData.students?.length}
                      onClick={exportStudents}
                      className="rounded-lg text-xs font-bold gap-1.5 h-8"
                    >
                      <Download size={13} /> {exportingStudents ? 'Exporting...' : 'Export List'}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={stageValue} onChange={e => setStageValue(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold">
                        {STAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      {stageValue === 'selected' && detailDrive.companies?.length > 0 && (
                        <select value={selectedCompanyIdx} onChange={e => setSelectedCompanyIdx(parseInt(e.target.value))} className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold">
                          {detailDrive.companies.map((c, i) => (
                            <option key={i} value={i}>{c.name}{c.packageLPA ? ` · ${c.packageLPA} LPA` : ''}</option>
                          ))}
                        </select>
                      )}
                      <Button size="sm" disabled={applyingStage} onClick={applyStage} className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold h-9">
                        {applyingStage ? 'Updating...' : `Apply to ${selectedIds.length || 0} selected`}
                      </Button>
                    </div>

                    <div className="w-full sm:w-64">
                      <Input
                        type="text"
                        placeholder="Search name, email, roll no, phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 text-xs rounded-lg bg-slate-50 border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    {(detailData.students || []).length === 0 ? (
                      <p className="text-xs text-slate-400 p-4">No students registered for this drive yet.</p>
                    ) : (() => {
                      const filtered = (detailData.students || []).filter(s => {
                        const q = searchQuery.toLowerCase();
                        if (!q) return true;
                        return (
                          (s.user?.name || '').toLowerCase().includes(q) ||
                          (s.user?.email || '').toLowerCase().includes(q) ||
                          (s.rollNumber || '').toLowerCase().includes(q) ||
                          (s.phone || '').toLowerCase().includes(q)
                        );
                      });
                      
                      if (filtered.length === 0) {
                        return <p className="text-xs text-slate-400 p-4">No students match your search.</p>;
                      }

                      return filtered.map(s => {
                        const appStatus = s.driveApplications?.find(d => d.drive === detailDrive._id)?.status || 'registered';
                        return (
                          <label key={s._id} className="flex items-center gap-3 px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer text-xs transition-colors">
                            <input type="checkbox" checked={selectedIds.includes(s._id)} onChange={() => toggleSelect(s._id)} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 truncate">{s.user?.name}</span>
                                {s.rollNumber && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{s.rollNumber}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                                <span className="truncate">{s.user?.email}</span>
                                {s.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{s.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                              {appStatus}
                            </span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Participating companies — read-only candidate-list link, no login required */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1"><Building2 size={13} /> Participating Companies</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={exportingCompanies || !(detailData.drive?.companies?.length)}
                      onClick={exportCompanies}
                      className="rounded-lg text-xs font-bold gap-1.5 h-8"
                    >
                      <Download size={13} /> {exportingCompanies ? 'Exporting...' : 'Export Companies'}
                    </Button>
                  </div>
                  {/* Invite a real registered Company account — formal request they can accept/reject */}
                  <div className="mb-3 relative">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Send via:</span>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={inviteChannels.email} onChange={() => toggleInviteChannel('email')} className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={inviteChannels.whatsapp} onChange={() => toggleInviteChannel('whatsapp')} className="rounded" />
                        WhatsApp
                      </label>
                    </div>
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={companySearchQuery}
                        onChange={e => setCompanySearchQuery(e.target.value)}
                        placeholder="Search registered companies to invite..."
                        className="rounded-lg h-9 text-xs pl-8"
                      />
                    </div>
                    {companySearchQuery.trim() && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchingCompanies ? (
                          <p className="text-xs text-slate-400 p-2">Searching...</p>
                        ) : companySearchResults.length === 0 ? (
                          <p className="text-xs text-slate-400 p-2">No matching companies</p>
                        ) : (
                          companySearchResults.map(company => (
                            <button
                              key={company._id}
                              type="button"
                              disabled={invitingCompanyId === company._id}
                              onClick={() => inviteCompany(company)}
                              className="w-full flex items-center gap-2 p-2 hover:bg-emerald-50 text-left text-xs"
                            >
                              <Building2 size={13} className="text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 flex-1 truncate">{company.name}</span>
                              <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                                {invitingCompanyId === company._id ? 'Inviting...' : 'Invite'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {(detailData.drive?.companies || []).length === 0 ? (
                    <p className="text-xs text-slate-400">No companies added yet. Edit this drive to add one, or invite a registered company above.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detailData.drive.companies.map((c) => (
                        <div key={c._id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-slate-800">{c.name}</span>
                            {c.packageLPA > 0 && <span className="text-slate-400"> · {c.packageLPA} LPA</span>}
                            {c.contactEmail ? (
                              <span className="text-slate-400 ml-2">{c.contactName ? `${c.contactName} · ` : ''}{c.contactEmail}</span>
                            ) : !c.company ? (
                              <span className="text-slate-300 ml-2 italic">No contact email set</span>
                            ) : null}
                            {c.company && c.requestStatus && c.requestStatus !== 'none' && (
                              <span className={`ml-2 px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                c.requestStatus === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                c.requestStatus === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {c.requestStatus === 'requested' ? 'Requested' : c.requestStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.contactEmail && (
                              <>
                                {c.accessToken && (
                                  <button type="button" onClick={() => copyCompanyLink(c)} className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline">
                                    Copy Link
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => sendCompanyLink(c)}
                                  disabled={sendingLinkId === c._id}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                  {sendingLinkId === c._id ? 'Sending...' : c.accessToken ? 'Resend Link' : 'Send Link'}
                                </button>
                              </>
                            )}
                            {c.company && c.conversation && (
                              <button
                                type="button"
                                onClick={() => messageCompanyContact(c.conversation)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:underline"
                              >
                                <MessageSquare size={11} /> Message
                              </button>
                            )}
                            {c.company && c.requestStatus === 'requested' && (
                              <button
                                type="button"
                                disabled={resendingEntryId === c._id}
                                onClick={() => resendCompanyInvite(c)}
                                className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                <Send size={11} /> {resendingEntryId === c._id ? 'Resending...' : 'Resend'}
                              </button>
                            )}
                            {c.company && c.requestStatus === 'rejected' && (
                              <button
                                type="button"
                                disabled={invitingCompanyId === c.company}
                                onClick={() => inviteCompany({ _id: c.company, name: c.name })}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                <Send size={11} /> {invitingCompanyId === c.company ? 'Sending...' : 'Re-invite'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Announcement board */}
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1"><Megaphone size={13} /> Announcements</h3>
                  <form onSubmit={submitAnnouncement} className="space-y-2 mb-3">
                    <Input value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="Title (e.g. Interview Link for Round 2)" className="rounded-lg h-9 text-xs" />
                    <Input value={announcementForm.message} onChange={e => setAnnouncementForm(p => ({ ...p, message: e.target.value }))} placeholder="Message" className="rounded-lg h-9 text-xs" />
                    <Input value={announcementForm.link} onChange={e => setAnnouncementForm(p => ({ ...p, link: e.target.value }))} placeholder="Link (optional, e.g. exam/meeting link)" className="rounded-lg h-9 text-xs" />
                    <Button type="submit" size="sm" disabled={postingAnnouncement} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9">
                      {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(detailData.drive?.announcements || []).slice().reverse().map((a, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs">
                        <p className="font-bold text-slate-800">{a.title}</p>
                        {a.message && <p className="text-slate-500 mt-0.5">{a.message}</p>}
                        {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">{a.link}</a>}
                      </div>
                    ))}
                    {(!detailData.drive?.announcements || detailData.drive.announcements.length === 0) && (
                      <p className="text-xs text-slate-400">No announcements yet.</p>
                    )}
                  </div>
                </div>

                {/* Drive in-charge */}
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1"><UserPlus size={13} /> Drive In-Charge</h3>
                  <form onSubmit={submitInchargeInvite} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <Input value={inchargeForm.name} onChange={e => setInchargeForm(p => ({ ...p, name: e.target.value }))} placeholder="Name" className="rounded-lg h-9 text-xs" />
                    <Input value={inchargeForm.email} onChange={e => setInchargeForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="rounded-lg h-9 text-xs" />
                    <Input value={inchargeForm.phone} onChange={e => setInchargeForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-lg h-9 text-xs" />
                    
                    {detailData.drive?.companies?.length > 0 && (
                      <div className="md:col-span-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Assign to specific companies (optional)</p>
                        <div className="flex flex-wrap gap-2">
                          {detailData.drive.companies.map(c => (
                            <label key={c._id} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-white px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={inchargeForm.assignedCompanies.includes(c._id)}
                                onChange={() => toggleAssignedCompany(c._id)}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                              />
                              <span className="font-medium">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button type="submit" size="sm" disabled={invitingIncharge} className="md:col-span-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold h-9">
                      {invitingIncharge ? 'Sending Invite...' : 'Send Invite'}
                    </Button>
                  </form>
                  <div className="space-y-1.5">
                    {(detailData.drive?.inCharges || []).map((ic, i) => (
                      <div key={i} className="flex flex-col p-2 bg-slate-50 rounded-lg text-xs gap-1">
                        <div className="flex items-center gap-2">
                          {ic.status === 'accepted' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-500" />}
                          <span className="font-bold text-slate-800">{ic.name}</span>
                          <span className="text-slate-400">{ic.email}</span>
                          <span className="font-bold uppercase text-[9px] text-slate-500">{ic.status}</span>
                          <div className="ml-auto flex items-center gap-2 shrink-0">
                            {ic.status === 'invited' && (
                              <button
                                type="button"
                                onClick={() => resendIncharge(ic)}
                                disabled={resendingId === ic._id}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                {resendingId === ic._id ? 'Resending...' : 'Resend'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setRemoveInchargeTarget(ic)}
                              title="Remove in-charge"
                              className="text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {ic.assignedCompanies && ic.assignedCompanies.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1 ml-5 mt-1">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Assigned to:</span>
                            {ic.assignedCompanies.map(cId => {
                              const comp = detailData.drive.companies.find(c => c._id === cId);
                              return comp ? <span key={cId} className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">{comp.name}</span> : null;
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!detailData.drive?.inCharges || detailData.drive.inCharges.length === 0) && (
                      <p className="text-xs text-slate-400">No in-charge invited yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Permanently delete "${deleteTarget?.title}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deletingDrive}
        onConfirm={confirmDeleteDrive}
      />

      <ConfirmDialog
        open={!!removeInchargeTarget}
        onOpenChange={(open) => !open && setRemoveInchargeTarget(null)}
        title={`Remove ${removeInchargeTarget?.name} as in-charge?`}
        description="They'll immediately lose access to manage this drive. This doesn't delete their account."
        confirmLabel="Remove"
        destructive
        loading={removingIncharge}
        onConfirm={confirmRemoveIncharge}
      />
    </div>
  );
};

export default Drives;
