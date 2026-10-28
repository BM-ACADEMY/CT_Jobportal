const RecommendationEvent = require('../models/RecommendationEvent');
const { engineEnabled } = require('../utils/matchingJobs');
const { recordClientEvents, summarise } = require('../utils/recommendationEvents');

const SEEKER_ROLES = ['jobseeker'];
const RECRUITER_ROLES = ['recruiter', 'company', 'org_employee'];

// @route POST /api/recommendations/events   Body: { events: [{ event: 'shown'|'clicked', surface, jobId?, candidateId?, score? }] }
// Fire-and-forget from the browser. Nothing is stored while the relevance engine is off.
const postEvents = async (req, res) => {
  try {
    if (!engineEnabled()) return res.sendStatus(204);
    const role = req.user.role;
    const side = SEEKER_ROLES.includes(role) ? 'seeker' : RECRUITER_ROLES.includes(role) ? 'recruiter' : null;
    if (!side) return res.sendStatus(204);
    await recordClientEvents(RecommendationEvent, req.user.id, side, req.body?.events);
    res.sendStatus(204);
  } catch (err) {
    console.error('Recommendation events error:', err.message);
    res.sendStatus(204); // measuring must never break a page
  }
};

// @route GET /api/admin/recommendations/summary?days=30   (admin only)
const getSummary = async (req, res) => {
  try {
    const days = Math.min(180, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 86400000);
    const rows = await RecommendationEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { side: '$side', surface: '$surface', event: '$event' }, count: { $sum: 1 } } },
    ]);
    res.json({ days, engineEnabled: engineEnabled(), surfaces: summarise(rows) });
  } catch (err) {
    console.error('Recommendation summary error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { postEvents, getSummary };
