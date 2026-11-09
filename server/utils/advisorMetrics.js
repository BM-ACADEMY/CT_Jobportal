// Business advisor: the health numbers are worked out here by code. The AI only explains them (see buildPrompt, parseAdvice).
// Pure functions: no database, so they are easy to test.
const GREEN = 'green'; const AMBER = 'amber'; const RED = 'red';

// grow: more is better, judged against last week. cap: lower is better, judged against fixed limits (amber above, red above).
const METRICS = [
  { key: 'newJobSeekers', label: 'New job seekers', type: 'grow' },
  { key: 'newEmployers', label: 'New employers', type: 'grow' },
  { key: 'newJobs', label: 'New jobs posted', type: 'grow' },
  { key: 'applications', label: 'Applications', type: 'grow' },
  { key: 'paidPlans', label: 'Paid plans bought', type: 'grow' },
  { key: 'revenue', label: 'Revenue (₹, before GST)', type: 'grow' },
  { key: 'zeroApplicationJobs', label: 'Live jobs with no applications', type: 'cap', amber: 10, red: 30 },
  { key: 'failedPayments', label: 'Failed payments', type: 'cap', amber: 1, red: 4 },
  { key: 'ticketsWaiting', label: 'Support tickets waiting', type: 'cap', amber: 8, red: 20 },
  { key: 'collegesVerified', label: 'Colleges verified (total)', type: 'info' },
];

const rate = (def, value, previous) => {
  if (def.type === 'cap') return value >= def.red ? RED : value >= def.amber ? AMBER : GREEN;
  if (def.type === 'grow') {
    if (!previous) return value > 0 ? GREEN : AMBER;   // nothing last week: any activity is fine, none is a warning
    const change = (value - previous) / previous;
    return change <= -0.3 ? RED : change <= -0.1 ? AMBER : GREEN;
  }
  return GREEN;
};

const buildMetrics = (current = {}, previous = {}) => METRICS.map((def) => {
  const value = Number(current[def.key]) || 0;
  const prev = Number(previous[def.key]) || 0;
  return { key: def.key, label: def.label, value, previous: prev, status: rate(def, value, prev) };
});

const buildPrompt = (metrics, question) => {
  const table = metrics.map((m) => `${m.label}: ${m.value} (last week ${m.previous}, status ${m.status})`).join('\n');
  const task = question
    ? `Answer this question from the owner using only the numbers above. If they cannot answer it, say so. Question: ${String(question).slice(0, 300)}\nReply as JSON: {"summary": "short answer quoting the numbers"}`
    : 'Write a weekly note. Reply as JSON: {"summary": "2 sentences", "good": ["up to 3 things going well"], "bad": ["up to 3 things not going well"], "ideas": [{"title": "action in under 12 words", "reason": "why", "numbers": "the exact numbers above that support it"}]} with at most 3 ideas.';
  return `You advise the owner of Velaivaaipu, a job portal in Tamil Nadu for blue-collar and entry-level jobs. These are this week's numbers (totals only, no personal data):\n${table}\n\nRules: use only these numbers, quote them, never invent figures, never suggest changing prices, plans, payments or settings. Keep it plain and short.\n${task}`;
};

const strs = (v, n, max) => (Array.isArray(v) ? v : []).map((x) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, max)).filter(Boolean).slice(0, n);

// Turns the AI's reply into safe fields. Ideas without a quoted number are dropped, so advice always shows its evidence.
const parseAdvice = (text) => {
  let raw;
  try { raw = JSON.parse(String(text).replace(/```json/g, '').replace(/```/g, '').trim()); } catch { return null; }
  if (!raw || typeof raw !== 'object') return null;
  const summary = String(raw.summary ?? '').replace(/\s+/g, ' ').trim().slice(0, 700);
  if (!summary) return null;
  const ideas = (Array.isArray(raw.ideas) ? raw.ideas : []).map((i) => ({
    title: String(i?.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
    reason: String(i?.reason ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
    numbers: String(i?.numbers ?? '').replace(/\s+/g, ' ').trim().slice(0, 150),
  })).filter((i) => i.title && /\d/.test(i.numbers)).slice(0, 3);
  return { summary, good: strs(raw.good, 3, 200), bad: strs(raw.bad, 3, 200), ideas };
};

const capReached = (usedThisMonth, cap) => usedThisMonth >= cap;
const monthlyCap = (env = process.env) => { const n = parseInt(env.ADVISOR_MONTHLY_AI_CAP, 10); return Number.isFinite(n) && n >= 0 ? n : 20; };

module.exports = { METRICS, rate, buildMetrics, buildPrompt, parseAdvice, capReached, monthlyCap };
