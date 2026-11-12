import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE_URL;

// WhatsApp alerts consent, and "invite a friend". Consent is recorded now; WhatsApp messages start only when a WhatsApp Business account is connected.
const WhatsAppAndInvite = () => {
  const [d, setD] = useState(null);
  const [number, setNumber] = useState('');
  useEffect(() => { axios.get(`${API}/user/referrals`).then((r) => { setD(r.data); setNumber(r.data.whatsapp?.number || ''); }).catch(() => {}); }, []);
  if (!d) return null;

  const toggle = async (enabled) => {
    try {
      const r = await axios.put(`${API}/user/whatsapp-optin`, { enabled, number });
      setD({ ...d, whatsapp: r.data });
      toast.success(enabled ? 'Saved. We will message you on WhatsApp when this starts.' : 'WhatsApp alerts are off.');
    } catch (e) { toast.error(e.response?.data?.msg || 'Could not save'); }
  };
  const text = `I found jobs on Velaivaaipu. Join free: ${d.link}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-black text-slate-900">WhatsApp job alerts</p>
        <p className="text-xs text-slate-500">Optional. Email stays the default. We will only message you on WhatsApp if you say yes here, and you can turn it off any time.</p>
        <input className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm" placeholder="WhatsApp mobile number" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} disabled={d.whatsapp?.optIn} />
        <button onClick={() => toggle(!d.whatsapp?.optIn)} className={`h-10 px-4 rounded-xl text-sm font-bold ${d.whatsapp?.optIn ? 'border border-slate-200 text-slate-700' : 'bg-emerald-600 text-white'}`}>{d.whatsapp?.optIn ? 'Turn off WhatsApp alerts' : 'Yes, send me alerts on WhatsApp'}</button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <p className="font-black text-slate-900">Invite a friend</p>
        <p className="text-xs text-slate-500">Share your link. Friends who join and verify their account: <b>{d.joined}</b>.</p>
        {d.code && <p className="text-xs text-slate-500">Your referral code: <b className="font-mono break-all select-all">{d.code}</b></p>}
        <div className="flex gap-2 flex-wrap">
          <a className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>Share on WhatsApp</a>
          <button className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold" onClick={() => { navigator.clipboard?.writeText(d.link).then(() => toast.success('Link copied')).catch(() => toast.error('Could not copy')); }}>Copy link</button>
        </div>
      </div>
    </div>
  );
};
export default WhatsAppAndInvite;
