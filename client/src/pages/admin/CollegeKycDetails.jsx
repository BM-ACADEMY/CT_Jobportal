import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../config/staffPermissions';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, CheckCircle2, XCircle, Clock, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusStyles = {
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
  pending: 'bg-amber-50 text-amber-700',
};

const CollegeKycDetails = () => {
  const { user: me } = useAuth();
  const canVerify = hasStaffPermission(me, 'colleges_verify');
  const { id } = useParams();
  const navigate = useNavigate();
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  // 'ask' = message the college, 'verify' = verify with a written note, 'reject' = reject with a reason
  const [panel, setPanel] = useState(null);
  const [text, setText] = useState('');
  // Student packs (Super Admin only): record a pack after the college has paid by UPI or bank.
  const [packs, setPacks] = useState(1);
  const [packNote, setPackNote] = useState('');
  const [packBusy, setPackBusy] = useState(false);

  const fetchCollege = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/college/admin/colleges/${id}`);
      setCollege(res.data);
    } catch {
      toast.error('College not found');
      navigate('/admin/colleges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCollege(); }, [id]);

  const setLogo = async (show) => {
    const note = show ? window.prompt('How did the college agree? (for example: agreed by phone, 9 Nov)') : '';
    if (show && !note) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/admin/colleges/${college._id}/logo`, { show, note });
      setCollege({ ...college, showLogo: show });
      toast.success(show ? 'Logo will show in Partner colleges' : 'Logo removed');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update');
    }
  };

  const act = async (status, note = '') => {
    setActing(true);
    try {
      const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/college/admin/verify/${college._id}`, { status, note });
      toast.success(`College marked as ${status}`);
      setCollege({ ...college, ...(res.data?.college || {}), verificationStatus: status });
      setPanel(null); setText('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update');
    } finally {
      setActing(false);
    }
  };

  const ask = async () => {
    setActing(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/college/admin/ask-info/${college._id}`, { message: text });
      toast.success(res.data?.msg || 'Message sent');
      setCollege({ ...college, infoRequests: res.data?.college?.infoRequests || college.infoRequests });
      setPanel(null); setText('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send');
    } finally {
      setActing(false);
    }
  };

  const recordPack = async () => {
    setPackBusy(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/colleges/${college._id}/student-pack`, { packs: Number(packs), note: packNote });
      toast.success(`${res.data.msg} Student limit is now ${res.data.studentLimit}.`);
      setCollege({ ...college, extraStudents: res.data.extraStudents, extraUntil: res.data.extraUntil });
      setPackNote(''); setPacks(1);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save');
    } finally {
      setPackBusy(false);
    }
  };

  const openPanel = (name, preset = '') => { setPanel(name); setText(preset); };
  const onVerify = () => (college.proofDocumentUrl ? act('verified') : openPanel('verify'));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!college) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 py-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/colleges')} className="w-10 h-10 p-0 rounded-xl border-slate-200">
          <ArrowLeft size={18} className="text-slate-500" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="text-emerald-600" /> College KYC Details
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Review and verify college documents</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{college.name}</h2>
            <p className="text-sm text-slate-500 mt-1">Code: {college.code}</p>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${statusStyles[college.verificationStatus] || statusStyles.pending}`}>
            {college.verificationStatus}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-50">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">TPO Contact</p>
            <p className="text-sm font-semibold text-slate-800">{college.tpoUser?.name}</p>
            <p className="text-sm text-slate-500">{college.tpoUser?.email}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">College Contact</p>
            <p className="text-sm font-semibold text-slate-800">{college.collegeEmail || '—'}</p>
            <p className="text-sm text-slate-500">{college.collegePhone || '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">University</p>
            <p className="text-sm font-semibold text-slate-800">{college.university || '—'}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</p>
            <p className="text-sm font-semibold text-slate-800">{college.location || '—'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Proof Document</h3>
          {college.proofDocumentUrl ? (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
              <FileText size={48} className="text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">Document Uploaded</p>
                <p className="text-xs text-slate-500 mt-1">Review the document to verify the college's authenticity.</p>
              </div>
              <a
                href={college.proofDocumentUrl.startsWith('http') ? college.proofDocumentUrl : `${import.meta.env.VITE_API_DOMAIN}${college.proofDocumentUrl}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm"
              >
                <FileText size={16} /> Open Document
              </a>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic bg-slate-50 p-8 rounded-xl text-center border border-dashed border-slate-200">
              No document uploaded (not required)
            </div>
          )}
        </div>

        {canVerify && college.verificationStatus === 'verified' && (
          <div className="pt-6 border-t border-slate-50 flex items-center gap-3">
            <p className="text-sm text-slate-600 flex-1">Partner colleges strip on the home page: <b>{college.showLogo ? 'Showing' : 'Not showing'}</b>. Only after the college has agreed.</p>
            <Button variant="outline" onClick={() => setLogo(!college.showLogo)} className="rounded-xl text-sm font-bold h-11">{college.showLogo ? 'Remove logo' : 'Show logo'}</Button>
          </div>
        )}

        {me?.role === 'admin' && college.verificationStatus === 'verified' && (() => {
          const extra = college.extraStudents > 0 && college.extraUntil && new Date(college.extraUntil) > new Date() ? college.extraStudents : 0;
          const have = Math.round(extra / 250);
          const price = 4999 * packs;
          return (
            <div className="pt-6 border-t border-slate-50 space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Student packs (+250 students each)</h3>
              <p className="text-sm text-slate-600">Plan capacity <b>{college.studentLimit || 100}</b>{extra > 0 && <>, plus <b>{extra}</b> from {have} pack{have > 1 ? 's' : ''} until {new Date(college.extraUntil).toLocaleDateString('en-IN')}</>}. One pack is ₹4,999 plus 18% GST (₹5,898.82), lasts a year, and a college can have at most 3. Record it only after the money has arrived.</p>
              {have < 3 ? (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-xs font-bold text-slate-500 flex flex-col gap-1">Packs
                    <select value={packs} onChange={(e) => setPacks(Number(e.target.value))} className="h-11 rounded-lg border border-slate-200 px-3 text-sm bg-white">
                      {Array.from({ length: 3 - have }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-500 flex flex-col gap-1 flex-1 min-w-[200px]">How it was paid
                    <input value={packNote} maxLength={200} onChange={(e) => setPackNote(e.target.value)} placeholder="For example: UPI, 12 Nov" className="h-11 rounded-lg border border-slate-200 px-3 text-sm" />
                  </label>
                  <Button disabled={packBusy || packNote.trim().length < 5} onClick={recordPack} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-11 px-5">
                    Add {250 * packs} students (₹{(price * 1.18).toLocaleString('en-IN', { maximumFractionDigits: 2 })} received)
                  </Button>
                </div>
              ) : <p className="text-sm text-amber-700">This college has all 3 packs. A bigger plan is better value now.</p>}
            </div>
          );
        })()}

        {(college.verificationNote || (college.infoRequests || []).length > 0) && (
          <div className="pt-6 border-t border-slate-50 space-y-2 text-sm text-slate-600">
            {college.verificationNote && <p><b>Admin note:</b> {college.verificationNote}</p>}
            {(college.infoRequests || []).map((r, i) => (
              <p key={i}><b>Asked {r.askedAt ? new Date(r.askedAt).toLocaleDateString('en-IN') : ''}:</b> {r.message}</p>
            ))}
          </div>
        )}

        {canVerify && <div className="pt-6 border-t border-slate-50 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={acting || college.verificationStatus === 'verified'} onClick={onVerify} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold gap-2 px-6 h-11">
              <CheckCircle2 size={16} /> Verify College
            </Button>
            <Button variant="outline" disabled={acting} onClick={() => openPanel('ask', 'Please reply with your name and role at the college (TPO, Principal or other), and the best phone number to reach you.')} className="rounded-xl text-sm font-bold gap-2 px-6 h-11">
              <MessageSquare size={16} /> Ask for role / details
            </Button>
            <Button variant="outline" disabled={acting || college.verificationStatus === 'rejected'} onClick={() => openPanel('reject')} className="rounded-xl text-sm font-bold gap-2 px-6 h-11 border-red-200 text-red-600 hover:bg-red-50">
              <XCircle size={16} /> Reject
            </Button>
            {college.verificationStatus !== 'pending' && (
              <Button variant="outline" disabled={acting} onClick={() => act('pending')} className="rounded-xl text-sm font-bold gap-2 px-6 h-11">
                <Clock size={16} /> Reset Status
              </Button>
            )}
          </div>

          {panel && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700">
                {panel === 'ask' && 'Message to the college. It goes by email and as an alert. The college stays Pending.'}
                {panel === 'verify' && 'Write how you checked this college (for example: called the principal office, 9 Nov).'}
                {panel === 'reject' && 'Optional reason. It is sent to the college so they can fix it.'}
              </p>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" placeholder={panel === 'verify' ? 'How you checked this college' : 'Write here'} />
              <div className="flex gap-3">
                <Button
                  disabled={acting || (panel !== 'reject' && text.trim().length < 10)}
                  onClick={() => (panel === 'ask' ? ask() : act(panel === 'verify' ? 'verified' : 'rejected', text))}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold h-10 px-5"
                >
                  {panel === 'ask' ? 'Send message' : panel === 'verify' ? 'Verify with note' : 'Reject'}
                </Button>
                <Button variant="outline" onClick={() => { setPanel(null); setText(''); }} className="rounded-xl text-sm font-bold h-10 px-5">Cancel</Button>
              </div>
            </div>
          )}
        </div>}
      </div>
    </div>
  );
};

export default CollegeKycDetails;
