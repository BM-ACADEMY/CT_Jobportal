import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
const src = (u) => (u && u.startsWith('/uploads/') ? `${API_DOMAIN}${u}` : u || '');

// The active banner for the top of the Home page. Renders nothing when there is none, while loading, or when anything fails.
const HomeBanner = () => {
  const [banner, setBanner] = useState(null);
  useEffect(() => {
    let alive = true;
    axios.get(`${API}/banners/active`, { params: { placement: 'home-top' } })
      .then((r) => { if (alive) setBanner(r.data?.banner || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!banner || !banner.imageUrl || !banner.linkUrl) return null;
  const image = <img src={src(banner.imageUrl)} alt={banner.altText || 'Announcement'} className="w-full h-auto rounded-xl object-cover" loading="eager" />;
  const internal = banner.linkUrl.startsWith('/');
  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-3">
      {internal
        ? <Link to={banner.linkUrl} className="block">{image}</Link>
        : <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer sponsored" className="block">{image}</a>}
    </div>
  );
};

export default HomeBanner;
