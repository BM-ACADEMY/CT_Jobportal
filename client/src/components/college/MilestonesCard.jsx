import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Small checklist card: milestones computed on the server from existing data.
const MilestonesCard = ({ token }) => {
  const [data, setData] = useState(null);
  const [locked, setLocked] = useState(0);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API}/college/milestones`, { headers }).then((r) => setData(r.data)).catch(() => {});
    axios.get(`${API}/college/what-you-get`, { headers }).then((r) => setLocked(r.data?.lockedCount || 0)).catch(() => {});
  }, [token]);

  if (!data) return null;
  return (
    <div className="bg-white p-5 border border-slate-200 shadow-sm rounded-none mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Getting started ({data.doneCount}/{data.total})</h3>
        <Link to="/college/what-you-get" className="text-xs font-bold text-[#34b678]">
          {locked > 0 ? `${locked} features locked - see what you get` : 'What you get'}
        </Link>
      </div>
      <ul className="space-y-2">
        {data.items.map((m) => (
          <li key={m.key} className="flex items-center gap-2 text-sm text-slate-700">
            {m.done ? <CheckCircle2 size={16} className="text-[#34b678]" /> : <Circle size={16} className="text-slate-300" />}
            <span className={m.done ? 'line-through text-slate-400' : ''}>{m.label}</span>
            {!m.done && m.progress && <span className="text-xs text-slate-400">({m.progress})</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MilestonesCard;
