import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Users, Megaphone, Building2, ChevronLeft, Search, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

// Rendered for any role that has accepted an in-charge invite for at least one campus drive —
// see Sidebar.jsx (user.hasInchargeDrives) and GET /api/college/me/incharge-drives.
const ManageDrive = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDriveId, setActiveDriveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [stageValue, setStageValue] = useState('stage1');
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);
  const [applying, setApplying] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', link: '' });
  const [posting, setPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => { fetchDrives(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/college/me/incharge-drives`);
      setDrives(res.data || []);
    } catch {
      toast.error('Failed to load your assigned drives');
    } finally {
      setLoading(false);
    }
  };

  const openDrive = async (driveId) => {
    setActiveDriveId(driveId);
    setDetailLoading(true);
    setSelectedIds([]);
    setSelectedCompanyIdx(0);
    setSearchQuery('');
    setSearchOpen(false);
    try {
      const res = await axios.get(`${API}/college/drives/${driveId}`);
      setDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to load drive');
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => { setActiveDriveId(null); setDetail(null); };

  const toggleSelect = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const applyStage = async () => {
    if (selectedIds.length === 0) return toast.error('Select at least one student');
    setApplying(true);
    try {
      const payload = { studentIds: selectedIds, status: stageValue };
      if (stageValue === 'selected' && detail?.drive?.companies?.length > 0) {
        const chosen = detail.drive.companies[selectedCompanyIdx] || detail.drive.companies[0];
        payload.companyName = chosen.name;
        payload.packageLPA = chosen.packageLPA;
        payload.tierPolicy = chosen.tierPolicy;
      }
      await axios.put(`${API}/college/drives/${activeDriveId}/student-round`, payload);
      toast.success(`Updated ${selectedIds.length} student(s)`);
      setSelectedIds([]);
      openDrive(activeDriveId);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to update'); }
    finally { setApplying(false); }
  };

  const [exportingStudents, setExportingStudents] = useState(false);

  const exportStudents = async () => {
    setExportingStudents(true);
    try {
      const res = await axios.get(`${API}/college/drives/${activeDriveId}/students-export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${detail?.drive?.driveCode || 'drive'}_registered_students.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Registered students list downloaded');
    } catch { toast.error('Failed to export students'); }
    finally { setExportingStudents(false); }
  };

  const submitAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title) return toast.error('Title is required');
    setPosting(true);
    try {
      await axios.post(`${API}/college/drives/${activeDriveId}/announcements`, announcementForm);
      toast.success('Announcement posted');
      setAnnouncementForm({ title: '', message: '', link: '' });
      openDrive(activeDriveId);
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to post'); }
    finally { setPosting(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full" /></div>;
  }

  if (!activeDriveId) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode size={20} className="text-emerald-600" /> Manage Drive
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Campus drives you've been added as in-charge for.</p>
        </div>

        {drives.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <QrCode size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No drives assigned to you yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {drives.map(drive => (
              <button
                key={drive._id}
                onClick={() => openDrive(drive._id)}
                className="text-left bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <h3 className="text-sm font-black text-slate-900">{drive.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{drive.college?.name} · {drive.driveCode}</p>
                {(drive.companies?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {drive.companies.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Building2 size={10} /> {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button onClick={backToList} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800">
        <ChevronLeft size={14} /> All assigned drives
      </button>

      {detailLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full" /></div>
      ) : detail && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-black text-slate-900">{detail.drive?.title}</h2>
            {detail.drive?.companies?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {detail.drive.companies.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    <Building2 size={12} /> {c.name}{c.packageLPA ? ` · ${c.packageLPA} LPA` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1"><Users size={14} /> Students ({detail.students?.length || 0})</h3>
              <Button
                size="sm"
                variant="outline"
                disabled={exportingStudents || !detail.students?.length}
                onClick={exportStudents}
                className="rounded-lg text-xs font-bold gap-1.5 h-8"
              >
                <Download size={13} /> {exportingStudents ? 'Exporting...' : 'Export List'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select value={stageValue} onChange={e => setStageValue(e.target.value)} className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold">
                {STAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {stageValue === 'selected' && detail.drive?.companies?.length > 0 && (
                <select value={selectedCompanyIdx} onChange={e => setSelectedCompanyIdx(parseInt(e.target.value))} className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold">
                  {detail.drive.companies.map((c, i) => (
                    <option key={i} value={i}>{c.name}{c.packageLPA ? ` · ${c.packageLPA} LPA` : ''}</option>
                  ))}
                </select>
              )}
              <Button size="sm" disabled={applying || selectedIds.length === 0} onClick={applyStage} className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold h-9">
                {applying ? 'Updating...' : `Apply to ${selectedIds.length || 0} selected`}
              </Button>
            </div>

            {/* Search-to-select combobox */}
            <div ref={searchBoxRef} className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search name, email, roll no, phone to select students..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  className="h-10 text-xs rounded-lg bg-slate-50 border-slate-200 pl-9"
                />
              </div>

              {searchOpen && searchQuery.trim() && (() => {
                const q = searchQuery.toLowerCase();
                const filtered = (detail.students || []).filter(s => {
                  if (selectedIds.includes(s._id)) return false;
                  return (
                    (s.user?.name || '').toLowerCase().includes(q) ||
                    (s.user?.email || '').toLowerCase().includes(q) ||
                    (s.rollNumber || '').toLowerCase().includes(q) ||
                    (s.phone || '').toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="absolute z-10 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                    {filtered.length === 0 ? (
                      <p className="text-xs text-slate-400 p-4">No matching students found.</p>
                    ) : filtered.map(s => {
                      const appStatus = s.driveApplications?.find(d => d.drive === activeDriveId)?.status || 'registered';
                      return (
                        <button
                          type="button"
                          key={s._id}
                          onClick={() => { toggleSelect(s._id); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-3 py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 text-left text-xs transition-colors"
                        >
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
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Selected students */}
            {selectedIds.length === 0 ? (
              <p className="text-xs text-slate-400 mt-3">Search above and select students to apply a stage update to.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedIds.map(id => {
                  const s = (detail.students || []).find(st => st._id === id);
                  return (
                    <span key={id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-700">
                      {s?.user?.name || 'Student'}
                      <button type="button" onClick={() => toggleSelect(id)} className="text-emerald-500 hover:text-emerald-800 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1"><Megaphone size={14} /> Post Announcement</h3>
            <form onSubmit={submitAnnouncement} className="space-y-2">
              <Input value={announcementForm.title} onChange={e => setAnnouncementForm(p => ({ ...p, title: e.target.value }))} placeholder="Title (e.g. Interview Link for Round 2)" className="rounded-lg h-9 text-xs" />
              <Input value={announcementForm.message} onChange={e => setAnnouncementForm(p => ({ ...p, message: e.target.value }))} placeholder="Message" className="rounded-lg h-9 text-xs" />
              <Input value={announcementForm.link} onChange={e => setAnnouncementForm(p => ({ ...p, link: e.target.value }))} placeholder="Link (optional)" className="rounded-lg h-9 text-xs" />
              <Button type="submit" size="sm" disabled={posting} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9">
                {posting ? 'Posting...' : 'Post Announcement'}
              </Button>
            </form>
            <div className="space-y-2 mt-4 max-h-40 overflow-y-auto">
              {(detail.drive?.announcements || []).slice().reverse().map((a, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs">
                  <p className="font-bold text-slate-800">{a.title}</p>
                  {a.message && <p className="text-slate-500 mt-0.5">{a.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrive;
