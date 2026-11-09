import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Home page band for students: find an internship free. Always shown; lists up to three live internships when there are any.
const HomeInternships = () => {
  const [list, setList] = useState([]);
  useEffect(() => {
    axios.get(`${API}/jobs`).then((r) => {
      const all = Array.isArray(r.data) ? r.data : r.data.jobs || [];
      setList(all.filter((j) => j.jobType === 'Internship').slice(0, 3));
    }).catch(() => {});
  }, []);
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="rounded-3xl bg-emerald-600 text-white p-6 md:p-8">
        <h2 className="text-2xl font-black flex items-center gap-2"><GraduationCap size={24} /> Find your internship. Free.</h2>
        <p className="text-sm text-emerald-50 mt-2 max-w-xl">Real internships from verified companies. Paid and unpaid, with a certificate. You never pay to apply.</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/internships" className="bg-white text-emerald-700 font-black text-sm rounded-xl px-4 py-2.5">See internships</Link>
          <Link to="/register" className="border border-white/60 font-bold text-sm rounded-xl px-4 py-2.5">Hiring interns? Post free</Link>
        </div>
        {list.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3 mt-5">
            {list.map((j) => {
              const i = j.internship || {};
              return (
                <Link key={j._id} to={`/jobs/${j._id}`} className="block bg-white text-slate-900 rounded-2xl p-4">
                  <p className="font-black">{j.title}</p>
                  <p className="text-xs text-slate-500">{j.company?.name} · {j.location}</p>
                  <p className="text-sm mt-1">{i.durationMonths} {i.durationMonths === 1 ? 'month' : 'months'} · {i.stipendType === 'paid' ? `₹${Number(i.stipendAmount).toLocaleString('en-IN')}/month` : 'Unpaid'}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
export default HomeInternships;
