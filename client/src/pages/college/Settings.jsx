import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Building2, ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle, Clock, Save, GraduationCap, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;

const CollegeSettings = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState({ name: '', code: '' });
  const [savingDepts, setSavingDepts] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    university: '',
    location: '',
    principalName: '',
    principalEmail: '',
    collegeEmail: '',
    collegePhone: '',
    additionalReportRecipients: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/college/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        code: res.data.code || '',
        university: res.data.university || '',
        location: res.data.location || '',
        principalName: res.data.principalName || '',
        principalEmail: res.data.principalEmail || '',
        collegeEmail: res.data.collegeEmail || '',
        collegePhone: res.data.collegePhone || '',
        additionalReportRecipients: (res.data.additionalReportRecipients || []).join(', ')
      });
      setDepartments(res.data.departments || []);
    } catch (err) {
      toast.error('Failed to load college profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        additionalReportRecipients: form.additionalReportRecipients.split(',').map(e => e.trim()).filter(Boolean)
      };
      const res = await axios.put(`${API}/college/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('College details updated successfully!');
      setProfile(res.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addDepartment = () => {
    const name = newDept.name.trim();
    const code = newDept.code.trim().toUpperCase();
    if (!name || !code) return toast.error('Enter both department name and code');
    if (departments.some(d => d.code === code)) return toast.error('A department with this code already exists');
    setDepartments(prev => [...prev, { name, code }]);
    setNewDept({ name: '', code: '' });
  };

  const removeDepartment = (code) => {
    setDepartments(prev => prev.filter(d => d.code !== code));
  };

  const saveDepartments = async () => {
    setSavingDepts(true);
    try {
      const res = await axios.put(`${API}/college/profile`, { departments }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
      setDepartments(res.data.departments || []);
      toast.success('Departments updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update departments');
    } finally {
      setSavingDepts(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile) return toast.error('Please select an authorization document or AICTE/College proof');
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.append('proof', proofFile);
      const res = await axios.post(`${API}/college/proof-upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Proof document uploaded successfully!');
      fetchProfile();
      setProofFile(null);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to upload proof document');
    } finally {
      setUploadingProof(false);
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
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 size={24} className="text-emerald-600" /> College Profile & Verification Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Manage your institution details, upload verification proofs, and principal information.
        </p>
      </div>

      {/* Verification Banner */}
      <div className={`p-5 rounded-2xl border flex items-start justify-between gap-4 shadow-sm ${
        profile?.verificationStatus === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
        profile?.verificationStatus === 'rejected' ? 'bg-red-50 border-red-200 text-red-900' :
        'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-start gap-3">
          {profile?.verificationStatus === 'verified' ? (
            <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : profile?.verificationStatus === 'rejected' ? (
            <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
          ) : (
            <Clock size={24} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider">
              Status: {profile?.verificationStatus === 'verified' ? 'Verified Institution' :
                       profile?.verificationStatus === 'rejected' ? 'Verification Rejected' :
                       'Pending Verification'}
            </h3>
            <p className="text-xs mt-1 font-medium opacity-90">
              {profile?.verificationStatus === 'verified'
                ? 'Your college is officially verified. You have full access to campus drives and student management.'
                : profile?.verificationStatus === 'rejected'
                ? 'Your proof document was rejected. Please upload an official AICTE letter, College Principal authorization, or valid ID.'
                : 'Upload your college authorization document below so our Platform Admin can review and approve your account.'}
            </p>
          </div>
        </div>
      </div>

      {/* Proof Document Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Verification Document Proof</h3>
        </div>
        <p className="text-xs text-slate-500">
          To prove authenticity, please upload an official document such as AICTE approval, college registration certificate, or Principal authorization letter.
        </p>

        {profile?.proofDocumentUrl && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium text-slate-700">
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" /> Document uploaded (`{profile.proofDocumentUrl.split('/').pop()}`)
            </span>
            <a
              href={profile.proofDocumentUrl.startsWith('http') ? profile.proofDocumentUrl : `${import.meta.env.VITE_API_DOMAIN}${profile.proofDocumentUrl}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:underline font-bold"
            >
              View Document →
            </a>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <input
            type="file"
            accept=".pdf,.jpg,.png,.jpeg"
            onChange={e => setProofFile(e.target.files[0])}
            className="text-xs flex-1 w-full p-2 border rounded-xl bg-slate-50 font-medium text-slate-600"
          />
          <Button
            onClick={handleUploadProof}
            disabled={uploadingProof || !proofFile}
            className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 px-5 h-10"
          >
            <Upload size={14} /> {uploadingProof ? 'Uploading...' : 'Upload Proof'}
          </Button>
        </div>
      </div>

      {/* Departments Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <GraduationCap size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Departments / Courses</h3>
        </div>
        <p className="text-xs text-slate-500">
          These departments appear as course options when students register, campus drives are created, and when filtering the student list.
        </p>

        {departments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No departments added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {departments.map(d => (
              <span key={d.code} className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                {d.name} <span className="text-slate-400 font-medium">({d.code})</span>
                <button
                  type="button"
                  onClick={() => removeDepartment(d.code)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                  title="Remove department"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Input
            value={newDept.name}
            onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))}
            placeholder="Department name (e.g. Computer Science)"
            className="rounded-xl font-medium flex-1"
          />
          <Input
            value={newDept.code}
            onChange={e => setNewDept(p => ({ ...p, code: e.target.value.toUpperCase() }))}
            placeholder="Code (e.g. CS)"
            className="rounded-xl font-medium uppercase sm:w-32"
          />
          <Button type="button" variant="outline" onClick={addDepartment} className="rounded-xl text-xs font-bold gap-1 shrink-0">
            <Plus size={14} /> Add
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={saveDepartments}
            disabled={savingDepts}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-2 px-6 h-10"
          >
            <Save size={14} /> {savingDepts ? 'Saving...' : 'Save Departments'}
          </Button>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Institution & Principal Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Code (e.g. SKCT) *</label>
            <Input
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              required
              className="mt-1 rounded-xl font-medium uppercase"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Affiliated University</label>
            <Input
              value={form.university}
              onChange={e => setForm(p => ({ ...p, university: e.target.value }))}
              placeholder="e.g. Anna University"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location (City / State)</label>
            <Input
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Coimbatore, Tamil Nadu"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Principal Name</label>
            <Input
              value={form.principalName}
              onChange={e => setForm(p => ({ ...p, principalName: e.target.value }))}
              placeholder="Dr. K. Sundar"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Principal Email (for Reports)</label>
            <Input
              type="email"
              value={form.principalEmail}
              onChange={e => setForm(p => ({ ...p, principalEmail: e.target.value }))}
              placeholder="principal@skct.campus"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Email</label>
            <Input
              type="email"
              value={form.collegeEmail}
              onChange={e => setForm(p => ({ ...p, collegeEmail: e.target.value }))}
              placeholder="office@skct.campus"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">College Phone</label>
            <Input
              value={form.collegePhone}
              onChange={e => setForm(p => ({ ...p, collegePhone: e.target.value }))}
              placeholder="e.g. 044-12345678"
              className="mt-1 rounded-xl font-medium"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Additional Report Recipients (comma-separated emails)</label>
            <Input
              value={form.additionalReportRecipients}
              onChange={e => setForm(p => ({ ...p, additionalReportRecipients: e.target.value }))}
              placeholder="placement.head@skct.campus, management@skct.campus"
              className="mt-1 rounded-xl font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">Placement reports are emailed to the Principal Email and everyone listed here.</p>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold gap-2 px-6 h-10"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Profile Details'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CollegeSettings;
