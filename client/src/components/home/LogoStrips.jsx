import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

const Strip = ({ title, items }) => (
  <div className="mb-8">
    <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{title}</p>
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
      {items.map((o) => {
        const img = <img src={`${API_DOMAIN}${o.logo}`} alt={o.name} title={o.name} loading="lazy" className="h-10 max-w-[120px] object-contain" />;
        return o.link ? <Link key={o.id} to={`${o.link}`}>{img}</Link> : <span key={o.id}>{img}</span>;
      })}
    </div>
  </div>
);

// Real, agreed and approved logos only. The server sends an empty list when fewer than 4 qualify, and then nothing shows.
const LogoStrips = () => {
  const [logos, setLogos] = useState({ hiring: [], colleges: [] });
  useEffect(() => { axios.get(`${API}/public/logos`).then((r) => setLogos(r.data)).catch(() => {}); }, []);
  if (!logos.hiring?.length && !logos.colleges?.length) return null;
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      {logos.hiring?.length > 0 && <Strip title="Hiring now" items={logos.hiring} />}
      {logos.colleges?.length > 0 && <Strip title="Partner colleges" items={logos.colleges} />}
    </section>
  );
};
export default LogoStrips;
