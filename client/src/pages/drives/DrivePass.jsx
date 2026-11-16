import React, { useEffect, useState } from 'react';
import SEOHead from '../../components/seo/SEOHead';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { API, fmtDate, STATUS_TEXT } from './driveUi';

// The registered person's pass: show the QR or the code at the desk.
const DrivePass = () => {
  const { code } = useParams();
  const [p, setP] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => { axios.get(`${API}/drives/registration/${code}`).then((r) => setP(r.data)).catch(() => setMissing(true)); }, [code]);
  if (missing) return <p className="text-center py-16 font-bold text-slate-600">Pass not found.</p>;
  if (!p) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-600" /></div>;
  return (
    <div className="max-w-sm mx-auto px-4 py-8">

      <SEOHead title="Your drive pass | Velaivaaipu" description="Your walk-in drive pass." path={window.location.pathname} robots="noindex, nofollow" />      <div className="bg-white rounded-3xl border border-slate-100 p-5 text-center space-y-3">
        <p className="text-xs font-bold uppercase text-emerald-700">Your drive pass</p>
        <h1 className="text-lg font-black text-slate-900">{p.drive.title}</h1>
        <p className="text-sm text-slate-700">{fmtDate(p.drive.date)} · {p.slot}</p>
        <p className="text-sm text-slate-600">{p.drive.venue?.address}</p>
        <img src={`${API}/drives/registration/${p.code}/qr.png`} alt="Your pass QR" className="w-48 h-48 mx-auto" />
        <p className="text-2xl font-black tracking-widest text-slate-900">{p.code}</p>
        <p className="text-sm font-bold text-slate-700">{p.name}</p>
        {p.tokenNumber && <p className="text-lg font-black text-emerald-700">Token {p.tokenNumber}</p>}
        <p className="text-xs text-slate-500">Status: {STATUS_TEXT[p.status] || p.status}</p>
        {p.drive.documents?.length > 0 && <p className="text-xs text-slate-600">Bring: {p.drive.documents.join(', ')}</p>}
        <p className="text-xs text-slate-400">Take a screenshot of this page to keep your pass.</p>
      </div>
    </div>
  );
};
export default DrivePass;
