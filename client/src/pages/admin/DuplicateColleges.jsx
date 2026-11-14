import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// Likely duplicate colleges (same name and city, or same email domain). "Merge into this one" keeps that college and
// moves the other one's students, drives and history across; the other is marked merged, never deleted.
const DuplicateColleges = () => {
  const [groups, setGroups] = useState(null);
  const [confirm, setConfirm] = useState(null); // { source, target }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    axios.get(`${API}/admin/college-duplicates`, auth())
      .then((r) => setGroups(r.data.groups || []))
      .catch((e) => { setGroups([]); toast.error(e.response?.data?.msg || 'Could not load duplicate colleges'); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const doMerge = async () => {
    setBusy(true);
    try {
      const r = await axios.post(`${API}/admin/colleges/merge`, { sourceId: confirm.source.id, targetId: confirm.target.id }, auth());
      toast.success(r.data.msg || 'Merged');
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.msg || 'Could not merge');
    } finally {
      setBusy(false);
    }
  };

  if (groups === null) return <div className="p-8 text-sm text-slate-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-6 h-6 text-[#1b496d]" />
        <div>
          <h1 className="text-xl font-black text-slate-900 m-0">Duplicate colleges</h1>
          <p className="text-xs text-slate-500 m-0">Check each pair before you merge. A merge moves students, drives and history to the college you keep. It cannot be undone from here.</p>
        </div>
      </div>

      {groups.length === 0 && <p className="text-sm text-slate-500">No likely duplicates found.</p>}

      {groups.map((g, i) => (
        <div key={i} className="border border-slate-200 bg-white">
          <p className="m-0 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">{g.reason}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <tbody>
                {g.colleges.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="py-2 px-4">
                      <p className="m-0 font-bold text-slate-900">{c.name}</p>
                      <p className="m-0 text-xs text-slate-500">{[c.city, c.email].filter(Boolean).join(' · ') || '—'}</p>
                    </td>
                    <td className="py-2 px-4 text-xs text-slate-600">{c.students} students<br />{c.status}</td>
                    <td className="py-2 px-4 text-right">
                      {g.colleges.filter((o) => o.id !== c.id).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setConfirm({ target: c, source: g.colleges.find((o) => o.id !== c.id), options: g.colleges.filter((o) => o.id !== c.id) })}
                          className="h-8 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Merge into this one
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Confirm merge">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 space-y-4">
            <h2 className="m-0 text-sm font-black text-slate-900">Merge duplicate college?</h2>
            <label className="block text-xs font-bold text-slate-600">
              College to merge away
              <select
                value={confirm.source.id}
                onChange={(e) => setConfirm({ ...confirm, source: confirm.options.find((o) => o.id === e.target.value) })}
                className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-2 text-sm font-normal text-slate-800"
              >
                {confirm.options.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.students} students)</option>)}
              </select>
            </label>
            <p className="m-0 text-sm text-slate-700">
              Everything of <strong>{confirm.source.name}</strong> moves into <strong>{confirm.target.name}</strong>, which is kept. {confirm.source.name} is then switched off and marked merged.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">Cancel</button>
              <button type="button" disabled={busy} onClick={doMerge} className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60">
                {busy ? 'Merging...' : 'Yes, merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuplicateColleges;
