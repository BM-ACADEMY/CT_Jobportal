const API_DOMAIN = String(import.meta.env.VITE_API_DOMAIN || '').replace(/\/$/, '');

export const mediaUrl = (src) => {
  if (typeof src !== 'string' || !src) return undefined;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;

  const normalized = src.startsWith('uploads/') ? `/${src}` : src;
  if (normalized.startsWith('/uploads/') && API_DOMAIN) return `${API_DOMAIN}${normalized}`;
  return normalized;
};

export const profileInitial = (name) => String(name || '').trim().charAt(0).toLocaleUpperCase() || 'U';
