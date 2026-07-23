import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { QrCode, Calendar, Building2, Megaphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_COLLEGE_URL = `${import.meta.env.VITE_API_BASE_URL}/college`;

const CampusDrives = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [joinForm, setJoinForm] = useState({ collegeCode: '', rollNumber: '', department: '', batchYear: '', phone: '' });
  const [joining, setJoining] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_COLLEGE_URL}/me/drives`);
      setStudent(res.data.student);
      setDrives(res.data.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrives(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    const { collegeCode, rollNumber, department, batchYear, phone } = joinForm;
    if (!collegeCode.trim() || !rollNumber.trim() || !department.trim() || !batchYear || !phone.trim()) {
      return toast.error('Please fill in college code, roll number, department, batch year, and phone number');
    }
    setJoining(true);
    try {
      const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
        collegeCode: collegeCode.trim(),
        rollNumber: rollNumber.trim(),
        department: department.trim(),
        batchYear: parseInt(batchYear),
        phone: phone.trim(),
      });
      toast.success(res.data.msg || 'Join request sent');
      setJoinForm({ collegeCode: '', rollNumber: '', department: '', batchYear: '', phone: '' });
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to join college');
    } finally {
      setJoining(false);
    }
  };

  const [reapplying, setReapplying] = useState(false);
  const [reapplyForm, setReapplyForm] = useState({ rollNumber: '', department: '', batchYear: '', phone: '' });

  useEffect(() => {
    if (student?.idVerification?.status === 'rejected') {
      setReapplyForm({
        rollNumber: student.rollNumber || '',
        department: student.department || '',
        batchYear: student.batchYear || '',
        phone: student.phone || '',
      });
    }
  }, [student]);

  const handleReapply = async (e) => {
    e.preventDefault();
    if (!student?.college?.code) return toast.error('Missing college code');
    const { rollNumber, department, batchYear, phone } = reapplyForm;
    if (!rollNumber.trim() || !department.trim() || !batchYear || !phone.trim()) {
      return toast.error('Please fill in roll number, department, batch year, and phone number');
    }
    setReapplying(true);
    try {
      const res = await axios.post(`${API_COLLEGE_URL}/me/join`, {
        collegeCode: student.college.code,
        rollNumber: rollNumber.trim(),
        department: department.trim(),
        batchYear: parseInt(batchYear),
        phone: phone.trim(),
      });
      toast.success(res.data.msg || 'Re-submitted your join request');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to re-apply');
    } finally {
      setReapplying(false);
    }
  };

  const registerForDrive = async (driveId) => {
    setRegisteringId(driveId);
    try {
      await axios.post(`${API_COLLEGE_URL}/me/drives/${driveId}/register`);
      toast.success('Registered for drive!');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to register');
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>;
  }

  if (!student) {
    return (
      <div className="max-w-md mx-auto py-16 space-y-6 animate-in fade-in duration-500">
        <div className="text-center">
          <QrCode size={40} className="text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-black text-slate-900">Join Your College</h1>
          <p className="text-sm text-slate-500 mt-1">Link your account to your college's placement portal to see campus drives here.</p>
        </div>
        <form onSubmit={handleJoin} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Code</Label>
            <Input value={joinForm.collegeCode} onChange={e => setJoinForm(p => ({ ...p, collegeCode: e.target.value }))} placeholder="e.g. SKCT" className="h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</Label>
              <Input value={joinForm.rollNumber} onChange={e => setJoinForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="e.g. 21CS045" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</Label>
              <Input value={joinForm.department} onChange={e => setJoinForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. CSE" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year of Passing</Label>
              <Input type="number" value={joinForm.batchYear} onChange={e => setJoinForm(p => ({ ...p, batchYear: e.target.value }))} placeholder="e.g. 2026" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</Label>
              <Input value={joinForm.phone} onChange={e => setJoinForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" className="h-11 rounded-xl" />
            </div>
          </div>
          <Button type="submit" disabled={joining} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {joining ? 'Sending...' : 'Send Join Request'}
          </Button>
        </form>
      </div>
    );
  }

  const rejected = student.idVerification?.status === 'rejected';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <QrCode size={20} className="text-emerald-600" /> Campus Drives
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          {student.college?.name} · Status: <span className="font-bold uppercase">{rejected ? 'not linked' : student.placementStatus}</span>
          {student.idVerification?.status === 'pending' && ' · ID verification pending TPO approval'}
        </p>
      </div>

      {rejected ? (
        <div className="bg-white rounded-2xl border border-red-100 p-8 space-y-4 max-w-md mx-auto text-center">
          <XCircle size={40} className="text-red-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Your join request was rejected</p>
          <p className="text-xs text-slate-500">
            {student.college?.name} rejected your request to join.
            {student.idVerification?.rejectionReason ? ` Reason: "${student.idVerification.rejectionReason}"` : ''}
            {' '}Double-check your details below and re-apply.
          </p>
          <form onSubmit={handleReapply} className="space-y-3 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Roll Number</Label>
                <Input value={reapplyForm.rollNumber} onChange={e => setReapplyForm(p => ({ ...p, rollNumber: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Department</Label>
                <Input value={reapplyForm.department} onChange={e => setReapplyForm(p => ({ ...p, department: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year of Passing</Label>
                <Input type="number" value={reapplyForm.batchYear} onChange={e => setReapplyForm(p => ({ ...p, batchYear: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</Label>
                <Input value={reapplyForm.phone} onChange={e => setReapplyForm(p => ({ ...p, phone: e.target.value }))} className="h-10 rounded-xl" />
              </div>
            </div>
            <Button type="submit" disabled={reapplying} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-10">
              {reapplying ? 'Re-applying...' : 'Re-apply'}
            </Button>
          </form>
        </div>
      ) : drives.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <QrCode size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No active drives right now</p>
          <p className="text-xs text-slate-400 mt-1">Your TPO will announce new campus drives here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drives.map(drive => (
            <div key={drive._id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900">{drive.title}</h3>
                  {(drive.companies?.length > 0 ? drive.companies : drive.companyName ? [{ name: drive.companyName, packageLPA: drive.packageLPA }] : []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(drive.companies?.length > 0 ? drive.companies : [{ name: drive.companyName, packageLPA: drive.packageLPA }]).map((c, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Building2 size={12} /> {c.name}{c.packageLPA ? ` · ${c.packageLPA} LPA` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {drive.description && <p className="text-xs text-slate-500 mt-2">{drive.description}</p>}
                  <p className="flex items-center gap-1 text-xs text-slate-400 mt-2"><Calendar size={12} /> Batch {drive.batchYear}</p>
                </div>
                <div className="shrink-0">
                  {drive.myApplication ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                      <CheckCircle2 size={12} /> {drive.myApplication.status}
                    </span>
                  ) : (
                    <Button size="sm" disabled={registeringId === drive._id} onClick={() => registerForDrive(drive._id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                      {registeringId === drive._id ? 'Registering...' : 'Register'}
                    </Button>
                  )}
                </div>
              </div>

              {drive.announcements?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1"><Megaphone size={12} /> Announcements</p>
                  {drive.announcements.slice().reverse().slice(0, 5).map((a, i) => (
                    <div key={i} className="text-xs bg-slate-50 rounded-lg p-2.5">
                      <p className="font-bold text-slate-800">{a.title}</p>
                      {a.message && <p className="text-slate-500 mt-0.5">{a.message}</p>}
                      {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">{a.link}</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampusDrives;
