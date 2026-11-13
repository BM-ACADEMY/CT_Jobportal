export const API = import.meta.env.VITE_API_BASE_URL;
export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short', timeZone: 'Asia/Kolkata' });
export const STATUS_TEXT = { registered: 'Registered', checked_in: 'Attended', shortlisted: 'Shortlisted', selected: 'Selected', on_hold: 'On hold', not_selected: 'Not selected' };
export const DRIVE_STATUS = { pending_approval: 'Waiting for approval', published: 'Live', rejected: 'Not approved', closed: 'Closed' };
export const inputCls = 'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
