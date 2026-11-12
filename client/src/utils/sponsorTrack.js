// Counts a sponsored job card being shown or clicked, for the company's Sponsored results report.
// Once per browser session per job and event (sessionStorage). Fire-and-forget: it never throws and never blocks the page.
const API = import.meta.env.VITE_API_BASE_URL;

export const trackSponsor = (jobId, event) => {
  try {
    if (!jobId || (event !== 'view' && event !== 'click')) return;
    const key = `vv_sp_${event}_${jobId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage blocked: the server rate limit still protects the counter */ }
    fetch(`${API}/jobs/${jobId}/sponsor-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* counting must never break a page */ }
};
