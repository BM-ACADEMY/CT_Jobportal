import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ListChecks, Loader2, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const ageText = (hours) => {
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${d}d ${h}h` : `${d}d`;
};

const LEVEL_STYLE = {
  overdue: 'bg-red-50 text-red-700 border-red-100',
  late: 'bg-amber-50 text-amber-700 border-amber-100',
  ok: 'bg-slate-100 text-slate-500 border-slate-200',
};

const RULE_LABELS = {
  college: 'College verifications', ticket: 'Support tickets', message: 'Contact messages',
  review: 'Reviews', request: 'Requests', whatsapp: 'WhatsApp messages', job: 'Jobs to review',
};

const NeedsAction = () => {
  const [data, setData] = useState({ items: [], summary: { total: 0, overdue: 0, late: 0, unassigned: 0 }, owners: [], rules: [] });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/needs-action`);
      setData(res.data);
    } catch {
      toast.error('Failed to load the list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const assign = async (item, ownerId) => {
    const owner = data.owners.find((o) => o.id === ownerId);
    setSavingId(item.id);
    try {
      await axios.put(`${API}/admin/needs-action/assign`, { kind: item.kind, id: item.id, ownerId: owner ? owner.id : null, ownerName: owner ? owner.name : '' });
      toast.success(owner ? `Assigned to ${owner.name}` : 'Owner removed');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to assign');
    } finally {
      setSavingId(null);
    }
  };

  const setRule = async (kind, ownerId) => {
    const owner = data.owners.find((o) => o.id === ownerId);
    try {
      await axios.put(`${API}/admin/needs-action/rules`, { kind, ownerId: owner ? owner.id : null, ownerName: owner ? owner.name : '' });
      toast.success(owner ? `New ${RULE_LABELS[kind].toLowerCase()} go to ${owner.name}` : 'Rule removed');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save the rule');
    }
  };

  const shown = data.items.filter((i) => (filter === 'all' ? true : filter === 'unassigned' ? !i.owner : i.level === filter));
  const { summary } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ListChecks size={20} className="text-emerald-600" /> Needs action
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Everything waiting for an admin, oldest first. Late after 24 hours, overdue after 48 hours.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Waiting', value: summary.total },
          { key: 'overdue', label: 'Overdue', value: summary.overdue },
          { key: 'late', label: 'Late', value: summary.late },
          { key: 'unassigned', label: 'No owner', value: summary.unassigned },
        ].map((c) => (
          <button key={c.key} type="button" onClick={() => setFilter(c.key)}
            className={`text-left p-4 rounded-2xl border shadow-sm bg-white transition ${filter === c.key ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-100'}`}>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{loading ? '...' : c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{c.label}</p>
          </button>
        ))}
      </div>

      <details className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <summary className="cursor-pointer select-none p-4 text-sm font-bold text-slate-700">
          Auto-assign: who gets each new item
        </summary>
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(RULE_LABELS).map(([kind, label]) => (
            <label key={kind} className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
              {label}
              <select
                value={data.rules?.find((r) => r.kind === kind)?.ownerId || ''}
                onChange={(e) => setRule(kind, e.target.value)}
                className="h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 px-2 bg-white"
              >
                <option value="">Nobody (I assign)</option>
                {data.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          ))}
          <p className="sm:col-span-2 text-[11px] text-slate-400 font-medium">
            The system checks every 15 minutes. Owners are reminded after 24 hours. After 48 hours you get an email. A daily summary arrives at 9 am.
          </p>
        </div>
      </details>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-sm font-bold text-slate-500">Nothing waiting here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {shown.map((item) => (
            <div key={`${item.kind}-${item.id}`} className="flex flex-col md:flex-row md:items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{item.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_STYLE[item.level]}`}>{ageText(item.ageHours)}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 truncate capitalize">{item.title}</p>
                {item.detail && <p className="text-xs text-slate-400 truncate">{item.detail}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={item.owner?.id || ''}
                  disabled={savingId === item.id}
                  onChange={(e) => assign(item, e.target.value)}
                  className="h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 px-2 bg-white"
                  aria-label="Owner"
                >
                  <option value="">No owner</option>
                  {item.owner && !data.owners.some((o) => o.id === item.owner.id) && <option value={item.owner.id}>{item.owner.name}</option>}
                  {data.owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <Link to={item.link} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50">
                  Open <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NeedsAction;
