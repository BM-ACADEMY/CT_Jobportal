import React, { useState } from 'react';
import { Mail, Send, Users, CheckCircle2, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const TEMPLATES = [
  { name: 'Application Received', type: 'Acknowledgement', sent: 320 },
  { name: 'Shortlist Invitation', type: 'Interview', sent: 84 },
  { name: 'Rejection (Polite)', type: 'Status Update', sent: 210 },
  { name: 'Offer Letter Prompt', type: 'Offer', sent: 12 },
];

const BulkMessaging = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <FeatureGate
      featureKey="hasBulkMessaging"
      featureName="Bulk Messaging"
      description="Send personalized messages to hundreds of candidates at once — with templates, open-rate tracking, and merge fields."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-sky-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Bulk Messaging</h1>
            </div>
            <p className="text-sm text-slate-500">Send targeted messages to candidates at scale.</p>
          </div>
          <Button className="h-10 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm gap-2 shrink-0">
            <Send size={15} /> New Campaign
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Sent this month', value: '626' },
            { label: 'Avg. open rate', value: '68%' },
            { label: 'Active templates', value: '4' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Compose */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-sm font-bold text-slate-900 mb-5">Compose Message</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Recipients</label>
              <div className="flex gap-2 flex-wrap p-3 rounded-xl border border-slate-200 min-h-[44px] bg-slate-50">
                {['Frontend Applicants (48)', 'Shortlisted (12)'].map(g => (
                  <Badge key={g} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">{g}</Badge>
                ))}
                <button className="text-[10px] text-slate-400 hover:text-emerald-600 font-bold">+ Add group</button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                placeholder="Re: Your application for {{role}}"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400 resize-none"
                placeholder="Hi {{first_name}}, we're pleased to inform you..."
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400">Use <code className="bg-slate-100 px-1 rounded">{'{{first_name}}'}</code> and <code className="bg-slate-100 px-1 rounded">{'{{role}}'}</code> as merge fields</p>
              <Button size="sm" className="h-9 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs gap-1.5">
                <Send size={12} /> Send
              </Button>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Message Templates</p>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-bold text-emerald-600 gap-1">
              <Plus size={12} /> New
            </Button>
          </div>
          <div className="space-y-3">
            {TEMPLATES.map((t, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-sky-100 transition-all">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-sky-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.type} · Used {t.sent} times</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-bold border-slate-200">Use</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default BulkMessaging;
