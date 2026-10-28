import axios from 'axios';
import { toast } from 'sonner';

// Documents under /uploads (resumes, MoUs, reports, KYC proofs) are opened through a short-lived signed link
// from the server, so the session token never appears in a URL. Images and skill certificates stay public.
const DOMAIN = import.meta.env.VITE_API_DOMAIN;
const BASE = import.meta.env.VITE_API_BASE_URL;
const PUBLIC_IMAGE = /\.(webp|png|jpe?g|gif)$/i;

export const needsSigning = (href) => {
  if (typeof href !== 'string' || !href.includes('/uploads/')) return false;
  const clean = href.split(/[?#]/)[0];
  return !PUBLIC_IMAGE.test(clean) && !/\/certificate-[^/]*$/.test(clean) && !/[?&]sig=/.test(href);
};

// Returns an absolute URL that can be fetched or opened. Pass { driveToken } on a company drive link page,
// where the visitor has no account.
export const signUploadUrl = async (href, { driveToken } = {}) => {
  if (!needsSigning(href)) return href;
  const endpoint = driveToken ? `${BASE}/college/public/company-drive/${driveToken}/sign-file` : `${BASE}/files/sign`;
  const { data } = await axios.post(endpoint, { url: href });
  return `${DOMAIN}${data.url}`;
};

export const openUploadedFile = async (href, opts) => {
  // Open the tab first, inside the click, so the browser does not block it as a popup.
  const win = window.open('', '_blank');
  try {
    const url = await signUploadUrl(href, opts);
    if (win) { win.opener = null; win.location.href = url; } else window.open(url, '_blank');
  } catch (err) {
    if (win) win.close();
    toast.error(err.response?.data?.msg || 'Could not open the file. Please sign in again.');
  }
};

// One listener covers every <a href=".../uploads/..."> in the app.
export const installUploadLinkGuard = () => {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!needsSigning(href)) return;
    e.preventDefault();
    openUploadedFile(href, { driveToken: a.dataset.driveToken });
  }, true);
};
