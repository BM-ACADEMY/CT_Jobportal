import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const cell = (v) => (v === null || v === undefined ? 'n/a' : v);

// Admin: automatic mails sent in the last 7 and 30 days, by mail type. Failed and opened are shown as n/a because they are not recorded.
const EmailReportCard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let live = true;
    axios.get(`${API}/admin/email-report/by-type`).then((res) => { if (live) setData(res.data); }).catch(() => { if (live) setData(false); });
    return () => { live = false; };
  }, []);

  if (data === false) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div>
        <p className="text-sm font-black text-slate-900">Automatic mails</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {!data ? 'Loading...' : data.enabled ? 'Sending is on.' : 'Sending is off (LIFECYCLE_EMAILS_ENABLED is not true).'}
          {data ? ` ${data.totals.sent7} sent in 7 days, ${data.totals.sent30} in 30 days. Failed and opened are not recorded (n/a).` : ''}
        </p>
      </div>
      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-3 font-bold">Mail type</th>
                <th className="py-1 px-2 font-bold">Sent 7d</th><th className="py-1 px-2 font-bold">Sent 30d</th>
                <th className="py-1 px-2 font-bold">Failed 7d / 30d</th><th className="py-1 px-2 font-bold">Opened 7d / 30d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((r) => (
                <tr key={r.kind}>
                  <td className="py-1.5 pr-3 font-bold text-slate-800">{r.kind}</td>
                  <td className="py-1.5 px-2">{r.sent7}</td><td className="py-1.5 px-2">{r.sent30}</td>
                  <td className="py-1.5 px-2 text-slate-400">{cell(r.failed7)} / {cell(r.failed30)}</td>
                  <td className="py-1.5 px-2 text-slate-400">{cell(r.opened7)} / {cell(r.opened30)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailReportCard;
