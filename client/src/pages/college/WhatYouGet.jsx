import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, CheckCircle2 } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Short plain-language tip per feature name (display text only; plans and prices come from the server).
const FEATURE_TIPS = {
  'Student Capacity': 'How many students you can add.',
  'CSV Bulk Student Upload': 'Add a whole class at once from a spreadsheet.',
  'Auto Candidate Account Creation': 'Students get their accounts without signing up one by one.',
  'Co-Branded Certificates': 'Certificates carry your college name.',
  'Automated MoU Generation': 'Get a ready MoU for company tie-ups.',
  'WhatsApp Interview Invites': 'Tell students about interviews on WhatsApp.',
  'Scheduled Placement Reports': 'Regular reports for your principal.',
  'ID Verification Badges': 'Mark students whose ID you have checked.',
  'Razorpay Auto-Renewal': 'Your plan renews on its own.',
  'Company Drive Invites': 'Invite companies to your drives.',
};

const formatPrice = (p) => (p ? `${p.currency === 'INR' || !p.currency ? 'Rs ' : `${p.currency} `}${Number(p.price).toLocaleString('en-IN')} / ${String(p.duration || '').toLowerCase()}` : '');

const WhatYouGet = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    axios.get(`${API}/college/what-you-get`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setData(r.data)).catch(() => setData({ features: [], lockedCount: 0 }));
  }, [token]);

  if (!data) return <div className="p-8 text-sm text-slate-500">Loading...</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">What you get</h1>
        {data.currentPlan && <p className="text-xs text-slate-500 mt-1">Your plan: {data.currentPlan.name}{data.lockedCount > 0 ? ` - ${data.lockedCount} features locked` : ''}</p>}
      </div>
      <div className="bg-white border border-slate-200 divide-y divide-slate-100">
        {data.features.map((f) => (
          <div key={f.name} className="p-4">
            <button
              type="button"
              onClick={() => f.locked && setOpen(open === f.name ? null : f.name)}
              className="w-full flex items-start justify-between gap-3 text-left bg-transparent border-none cursor-pointer"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-800">{f.name}</span>
                <span className="block text-xs text-slate-500">{FEATURE_TIPS[f.name] || ''}</span>
              </span>
              {f.locked ? <Lock size={16} className="text-slate-400 shrink-0" /> : <CheckCircle2 size={16} className="text-[#34b678] shrink-0" />}
            </button>
            {f.locked && open === f.name && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 text-sm text-slate-700">
                {f.unlockedBy ? (
                  <>
                    <p>Available on <strong>{f.unlockedBy.plan}</strong> ({formatPrice(f.unlockedBy)}).</p>
                    <button type="button" onClick={() => navigate('/college/subscription')} className="mt-2 px-4 py-2 text-xs font-bold text-white bg-[#34b678] border-none cursor-pointer">Upgrade</button>
                  </>
                ) : (
                  <p>Not available on any plan right now.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhatYouGet;
