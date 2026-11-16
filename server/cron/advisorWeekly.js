const { runAdvisor } = require('../utils/advisorService');

// Monday 08:00 India time. Off unless ADVISOR_ENABLED=true. Needs the AI key; without it the numbers are still saved.
const runWeeklyAdvisor = async ({ deps, callAI, env = process.env, now = new Date(), mailer } = {}) => {
  if (env.ADVISOR_ENABLED !== 'true') return { skipped: true };
  const d = deps || require('../controllers/advisorController').deps;
  const ai = callAI || require('../controllers/advisorController').callAI;
  try {
    const r = await runAdvisor({ deps: d, callAI: ai, now, env });
    // The note is also emailed to the Super Admin(s). A mail problem never fails the run.
    const mail = await (mailer || require('../utils/advisorMail').emailAdvisorNote)(r.report, { env }).catch((e) => { console.error('[Advisor] note email failed:', e.message); return null; });
    return { id: String(r.report._id), capped: r.capped, emailed: mail?.sent || 0 };
  }
  catch (e) { console.error('[Advisor] weekly run failed:', e.message); return { error: true }; }
};

module.exports = runWeeklyAdvisor;
