import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const Card = ({ title, rows }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4">
    <h2 className="font-black text-slate-900 mb-2">{title}</h2>
    {rows.map(([l, v]) => <div key={l} className="flex justify-between text-sm py-1 border-t border-slate-100"><span className="text-slate-600">{l}</span><b>{v}</b></div>)}
  </div>
);

// Super Admin: the numbers for every service in one place.
const Services = () => {
  const [d, setD] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/services-overview`).then((r) => setD(r.data)).catch(() => setD({ error: true })); }, []);
  if (!d) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (d.error) return <p className="p-6 text-sm font-bold text-red-600">Could not load the numbers.</p>;
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-black text-slate-900">All services</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Internships" rows={[['Live now', d.internships.live], ['Free (verified companies)', d.internships.free], ['Applications', d.internships.applications], ['Students applied', d.internships.students], ['Selected', d.internships.selected]]} />
        <Card title="Walk-in Drives" rows={[['Total', d.drives.total], ['Waiting for approval', d.drives.pending], ['Published', d.drives.published], ['Paid', d.drives.paid], ['Registrations', d.drives.registrations]]} />
        <Card title="Promoted jobs" rows={[['Sponsored now', d.promotions.sponsoredJobs], ['Urgent now', d.promotions.urgentJobs]]} />
        <Card title="Logos on home page" rows={[['Companies agreed', d.logos.companiesAgreed], ['Companies approved', d.logos.companiesApproved], ['Colleges approved', d.logos.collegesApproved]]} />
        <Card title="WhatsApp and invites" rows={[['WhatsApp opt-ins', d.whatsapp.optIns], ['Signups from invite links', d.whatsapp.referredSignups]]} />
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="font-black text-slate-900 mb-2">Companies with most internships</h2>
          {d.internships.topCompanies.length ? d.internships.topCompanies.map((c) => <div key={c.company} className="flex justify-between text-sm py-1 border-t border-slate-100"><span>{c.company}</span><b>{c.internships}</b></div>) : <p className="text-sm text-slate-500">None yet.</p>}
        </div>
      </div>
    </div>
  );
};
export default Services;
