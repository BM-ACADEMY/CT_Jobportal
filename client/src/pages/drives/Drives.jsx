import React, { useEffect, useState } from 'react';
import SEOHead from '../../components/seo/SEOHead';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, Loader2, Users } from 'lucide-react';
import { API, fmtDate, inr } from './driveUi';

// Short price list for organisers. Prices and limits come from the server's drive settings, so this never drifts from what is charged.
const featureLines = (p) => [
  `Up to ${p.maxRegistrations.toLocaleString('en-IN')} registrations`,
  'Pass with QR and token numbers',
  p.qrCheckIn ? 'Check-in by pass code or QR scan' : 'Check-in by mobile number',
  p.screeningMax ? `${p.screeningMax} screening questions` : null,
  p.inviteLimit ? `Invites to ${p.inviteLimit} matching job seekers` : null,
  p.homeSpotDays ? `Home page spot for ${p.homeSpotDays} days` : null,
  p.reminders.includes('whatsapp') ? 'Email and WhatsApp reminders' : 'Email reminders',
  p.fullReport ? 'Full after-drive report and CSV list' : null,
  p.costPerHire ? 'Cost per hire' : null,
].filter(Boolean);

const OrganiserPlans = () => {
  const [plans, setPlans] = useState(null);
  useEffect(() => { axios.get(`${API}/drives/plans`).then((r) => setPlans(r.data)).catch(() => setPlans(null)); }, []);
  if (!plans) return null;
  return (
    <section className="space-y-3 pt-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">Hiring? Run your own walk-in drive</h2>
        <p className="text-sm text-slate-500 mt-1">Per drive, no monthly plan. Prices are before {Math.round(plans.gstRate * 100)}% GST. Your first drive each month is free.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {plans.plans.map((p) => (
          <div key={p.key} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2">
            <p className="font-black text-slate-900">{p.label}</p>
            <p className="text-xl font-black text-emerald-700">{p.price ? inr(p.price) : 'Free'}</p>
            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">{featureLines(p).map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </div>
      <Link to="/company/drives" className="inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">Create a drive</Link>
    </section>
  );
};

// Public list of upcoming walk-in drives.
const Drives = () => {
  const [drives, setDrives] = useState(null);
  useEffect(() => { axios.get(`${API}/drives`).then((r) => setDrives(r.data)).catch(() => setDrives([])); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      <SEOHead title="Walk-in drives in Tamil Nadu | Velaivaaipu" description="Upcoming walk-in hiring drives with venue, date and roles. Register free and get a pass." path="/drives" />      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><CalendarDays className="text-emerald-600" /> Walk-in Drives</h1>
        <p className="text-sm text-slate-500 mt-1">Register for free, get your pass, and walk in on the day.</p>
      </div>
      {!drives ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        : drives.length === 0 ? <div className="text-center py-16 bg-white rounded-2xl border border-slate-100"><p className="text-sm font-bold text-slate-500">No drives right now. Please check again soon.</p></div>
        : drives.map((d) => (
          <Link key={d.slug} to={`/drives/${d.slug}`} className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-emerald-300">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-black text-slate-900">{d.title}</h2>
              {d.sponsored && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Sponsored</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">{d.organiserName}</p>
            <p className="text-sm text-slate-700 mt-2">{fmtDate(d.date)} · {[d.venue?.name, d.venue?.city].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Users size={12} /> {d.roles.map((r) => r.title).slice(0, 3).join(', ')}</p>
          </Link>
        ))}
      <OrganiserPlans />
    </div>
  );
};
export default Drives;
