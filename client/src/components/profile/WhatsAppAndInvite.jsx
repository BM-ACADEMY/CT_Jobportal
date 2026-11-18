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
      <div className="bg-white rounded-2xl ring-1 ring-zinc-200/80 p-5 space-y-3">
        <p className="m-0 text-[15px] font-semibold text-[#10213D]">WhatsApp job alerts</p>
        <p className="m-0 text-[13px] leading-relaxed text-zinc-500">Optional. Email stays the default. We will only message you on WhatsApp if you say yes here, and you can turn it off any time.</p>
        <input className="w-full h-10 px-3.5 rounded-xl bg-white ring-1 ring-zinc-200 border-none outline-none text-[13px] focus:ring-2 focus:ring-[#34B678] disabled:bg-zinc-50" placeholder="WhatsApp mobile number" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} disabled={d.whatsapp?.optIn} />
        <button onClick={() => toggle(!d.whatsapp?.optIn)} className={`h-10 px-4 rounded-xl text-[13px] font-semibold border-none cursor-pointer transition ${d.whatsapp?.optIn ? 'bg-white ring-1 ring-zinc-200 text-[#10213D] hover:ring-zinc-300' : 'bg-[#34B678] hover:bg-[#2ca66b] text-white'}`}>{d.whatsapp?.optIn ? 'Turn off WhatsApp alerts' : 'Yes, send me alerts on WhatsApp'}</button>
      </div>
      <div className="bg-white rounded-2xl ring-1 ring-zinc-200/80 p-5 space-y-3">
        <p className="m-0 text-[15px] font-semibold text-[#10213D]">Invite a friend</p>
        <p className="m-0 text-[13px] leading-relaxed text-zinc-500">Share your link. Friends who join and verify their account: <b>{d.joined}</b>.</p>
        <div className="flex gap-2 flex-wrap">
          <a className="h-10 px-4 inline-flex items-center rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-[13px] font-semibold no-underline transition" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text)}`}>Share on WhatsApp</a>
          <button className="h-10 px-4 rounded-xl bg-white ring-1 ring-zinc-200 border-none text-[13px] font-semibold text-[#10213D] cursor-pointer transition hover:ring-zinc-300" onClick={() => { navigator.clipboard?.writeText(d.link).then(() => toast.success('Link copied')).catch(() => toast.error('Could not copy')); }}>Copy link</button>
        </div>
      </div>
    </div>
  );
};
export default WhatsAppAndInvite;
