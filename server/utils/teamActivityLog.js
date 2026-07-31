const TeamActivityLog = require('../models/TeamActivityLog');

// Only records activity for delegated team members (recruiters brought in via the
// Add Team Member flow) — the company owner's own actions and solo recruiters
// (no company) are intentionally never logged, since there's no admin who'd need
// visibility into their own actions or into an unaffiliated recruiter's actions.
const logTeamActivity = async ({ actor, action, description, entity, entityModel }) => {
  try {
    if (!actor || actor.role !== 'recruiter' || !actor.company) return;
    await TeamActivityLog.create({
      company: actor.company,
      actor: actor._id,
      actorName: actor.name,
      action,
      description,
      entity,
      entityModel
    });
  } catch (err) {
    console.error('logTeamActivity error:', err.message);
  }
};

module.exports = { logTeamActivity };
