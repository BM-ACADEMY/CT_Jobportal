import { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || '';

// Posts written in the admin panel, shaped like the older code-based posts so the same cards can show both.
// If the server cannot be reached the list is simply empty and the older posts still show.
export const useAdminBlogCards = () => {
  const [cards, setCards] = useState([]);
  useEffect(() => {
    let live = true;
    axios.get(`${API}/blogs`).then((r) => {
      if (!live) return;
      setCards((r.data.posts || []).map((p) => ({
        slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
        readTime: `${p.readMinutes || 1} min read`, author: p.authorName,
        image: p.coverImage ? (p.coverImage.startsWith('/uploads/') ? `${API_DOMAIN}${p.coverImage}` : p.coverImage) : '/og-default.png',
        imageAlt: p.coverAlt || '',
        date: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : ''
      })));
    }).catch(() => {});
    return () => { live = false; };
  }, []);
  return cards;
};
