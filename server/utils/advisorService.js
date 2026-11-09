// Collects the weekly numbers, asks the AI to explain them, saves the note. Dependencies are passed in so it can be tested.
const M = require('./advisorMetrics');
const { istMonthStart } = require('../config/driveConfig');
const { manualPaymentRows, sumRows } = require('./manualIncome');

const DAY = 86400000;

// Counts only. No names, emails or other personal details ever leave the database here.
const collectCounts = async ({ User, Role, Job, Application, Payment, Ticket, College, WalkInDrive }, now = new Date()) => {
  const w1 = new Date(now.getTime() - 7 * DAY); const w0 = new Date(now.getTime() - 14 * DAY);
  const between = (from, to) => ({ $gte: from, $lt: to });
  const [seeker, employers] = await Promise.all([Role.findOne({ name: 'jobseeker' }), Role.find({ name: { $in: ['recruiter', 'company'] } })]);
  const roleIds = employers.map((r) => r._id);
  // Money received by hand for walk-in drives (not a Razorpay payment). Skipped when the model is not passed in.
  const drives = WalkInDrive ? await WalkInDrive.find({ $or: [{ paid: true }, { 'addons.paid': true }] }).select('plan paid paidAt addons').lean().catch(() => []) : [];
  const byHand = (from, to) => sumRows(manualPaymentRows(drives, { from, to }));
  const window = async (from, to) => ({
    newJobSeekers: seeker ? await User.countDocuments({ role: seeker._id, createdAt: between(from, to) }) : 0,
    newEmployers: roleIds.length ? await User.countDocuments({ role: { $in: roleIds }, createdAt: between(from, to) }) : 0,
    newJobs: await Job.countDocuments({ createdAt: between(from, to) }),
    applications: await Application.countDocuments({ createdAt: between(from, to) }),
    paidPlans: (await Payment.countDocuments({ status: 'completed', amount: { $gt: 0 }, createdAt: between(from, to) })) + byHand(from, to).count,
    revenue: (((await Payment.aggregate([{ $match: { status: 'completed', amount: { $gt: 0 }, createdAt: between(from, to) } }, { $group: { _id: null, total: { $sum: '$amount' } } }]))[0]?.total) || 0) + byHand(from, to).total,
    failedPayments: await Payment.countDocuments({ status: 'failed', createdAt: between(from, to) }),
  });
  const [cur, prev] = [await window(w1, now), await window(w0, w1)];
  cur.zeroApplicationJobs = await Job.countDocuments({ status: 'active', applicantsCount: { $in: [0, null] } });
  cur.ticketsWaiting = await Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } });
  cur.collegesVerified = await College.countDocuments({ verificationStatus: 'verified', isTest: { $ne: true } });
  prev.collegesVerified = cur.collegesVerified;
  return { cur, prev };
};

const usedThisMonth = (AdvisorReport, now) => AdvisorReport.countDocuments({ aiUsed: true, createdAt: { $gte: istMonthStart(now) } });

// Builds and saves one note. `question` makes it an answer instead of the weekly report.
// Never throws for an AI problem: the numbers are saved either way and the error is recorded.
const runAdvisor = async ({ deps, callAI, question = '', now = new Date(), env = process.env }) => {
  const { AdvisorReport, AdvisorIdea } = deps;
  const { cur, prev } = await collectCounts(deps, now);
  const metrics = M.buildMetrics(cur, prev);
  const base = { kind: question ? 'question' : 'weekly', question, metrics };

  if (M.capReached(await usedThisMonth(AdvisorReport, now), M.monthlyCap(env))) {
    const report = await AdvisorReport.create({ ...base, aiError: 'Monthly AI limit reached. The numbers above are still correct.' });
    return { report, ideas: [], capped: true };
  }
  let advice = null; let aiError = '';
  try { advice = M.parseAdvice(await callAI(M.buildPrompt(metrics, question))); if (!advice) aiError = 'The AI reply could not be used.'; }
  catch (e) { aiError = `AI unavailable: ${String(e.message).slice(0, 100)}`; }

  const report = await AdvisorReport.create({ ...base, summary: advice?.summary || '', good: advice?.good || [], bad: advice?.bad || [], aiUsed: !!advice, aiError });
  const ideas = [];
  for (const i of advice?.ideas || []) ideas.push(await AdvisorIdea.create({ report: report._id, ...i }));
  return { report, ideas, capped: false };
};

module.exports = { collectCounts, runAdvisor };
