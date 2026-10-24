// Tells the server which suggestions were shown or opened, so suggestion quality can be measured.
// Fire-and-forget: a failure is ignored and never shown. The server stores nothing while the relevance engine is off,
// and the pages only call this for items that carry a `relevance` field (which only exists when the engine is on).
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const sentShown = new Set(); // one "shown" per item per page load; the server also counts once per day

const post = (events) => {
  if (!events.length) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  axios.post(`${API}/recommendations/events`, { events }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
};

// items: [{ jobId?, candidateId?, score? }]
export const trackShown = (surface, items) => {
  const fresh = (items || []).filter((i) => {
    const key = `${surface}|${i.jobId || ''}|${i.candidateId || ''}`;
    if (sentShown.has(key)) return false;
    sentShown.add(key);
    return true;
  }).slice(0, 50);
  post(fresh.map((i) => ({ event: 'shown', surface, jobId: i.jobId, candidateId: i.candidateId, score: i.score })));
};

export const trackClick = (surface, item) => post([{ event: 'clicked', surface, jobId: item.jobId, candidateId: item.candidateId, score: item.score }]);
