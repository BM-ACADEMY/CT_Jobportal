import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE_URL;
const TYPES = [
  { value: 'gst', label: 'GST number', hint: '15-character GSTIN' },
  { value: 'registration', label: 'Registration number', hint: 'Shops licence, Udyam or company registration number' },
  { value: 'website', label: 'Company website', hint: 'https://yourcompany.com' },
  { value: 'linkedin', label: 'LinkedIn company page', hint: 'https://www.linkedin.com/company/...' },
];

// For companies on a free email: send one proof of the business. It goes to our team's Needs-action list; nothing is verified automatically.
const ProofUploadForm = () => {
  const [type, setType] = useState('gst');
  const [value, setValue] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('proofType', type);
      fd.append('proofValue', value);
      if (file) fd.append('proofFile', file);
      const res = await axios.post(`${API}/company/verification-proof`, fd);
      toast.success(res.data?.msg || 'Proof sent');
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send your proof');
    } finally { setBusy(false); }
  };

  if (sent) return <p className="m-0 mt-3 text-sm font-semibold text-emerald-800">Proof sent. We will email you once it is checked.</p>;
  const current = TYPES.find((t) => t.value === type);
  return (
    <form onSubmit={submit} className="mt-3 space-y-2 max-w-md">
      <p className="m-0 text-sm font-bold">Send proof of your business</p>
      <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 rounded-lg border border-amber-300 bg-white px-2 text-sm">
        {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input value={value} onChange={(e) => setValue(e.target.value)} maxLength={300} placeholder={current.hint}
        className="w-full h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm" />
      <label className="block text-xs text-amber-900">Optional PDF of the certificate
        <input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} className="block mt-1 text-xs" />
      </label>
      <button type="submit" disabled={busy || (!value.trim() && !file)} className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
        {busy ? 'Sending...' : 'Send proof'}
      </button>
    </form>
  );
};

export default ProofUploadForm;
