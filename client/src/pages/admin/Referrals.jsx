import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const API = import.meta.env.VITE_API_BASE_URL;

// How many people each user has brought in with their referral code. Counts only; no rewards.
const Referrals = () => {
  const [rows, setRows] = useState(null);
  useEffect(() => { axios.get(`${API}/admin/referrals`).then((r) => setRows(r.data.referrers || [])).catch(() => setRows([])); }, []);
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Referrals</h1>
        <p className="text-sm text-slate-500 mt-1">People who signed up with someone's referral code. "Verified" counts accounts that confirmed their email.</p>
      </div>
      <Card className="p-4 md:p-6">
        {rows === null ? <Loader2 className="animate-spin text-slate-400" /> : rows.length === 0 ? <p className="text-sm text-slate-500">No referrals yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-slate-500"><th className="py-2 pr-3">Person</th><th className="py-2 pr-3">Referrals</th><th className="py-2">Verified</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.userId)} className="border-t border-slate-100">
                    <td className="py-2 pr-3"><span className="font-semibold text-slate-900">{r.name}</span><br /><span className="text-xs text-slate-500">{r.email}</span></td>
                    <td className="py-2 pr-3 font-bold">{r.referrals}</td>
                    <td className="py-2">{r.verified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Referrals;
