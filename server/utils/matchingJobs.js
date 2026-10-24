// "Jobs for you": loads a pool of open jobs, drops what the person must not see, and ranks it with the relevance engine.
// Output is an array of plain job objects (same shape the clients already read) plus `relevance: { score, reasons, priority }`.
const { rankJobsForSeeker, isThinProfile } = require('./relevance');

const POOL_SIZE = 500; // newest open jobs considered per request
const MIN_SCORE = 15; // below this a job does not match the person's profile and is not shown as "for you"

const engineEnabled = (env = process.env) => env.RELEVANCE_ENGINE_ENABLED === 'true';

/**
 * @param {object} user   User document (needs profile, blockedEntities, hiddenJobs)
 * @param {object} deps   { Job, User, Application } models, injected for tests
 * @param {{limit?:number, now?:Date}} opts
 */
const getRankedMatches = async (user, { Job, User, Application }, { limit = 20, now = new Date() } = {}) => {
  const adminBlocked = (await User.find({ isAdminBlocked: true }).select('_id')).map((u) => String(u._id));
  const blockedIds = [...new Set([...adminBlocked, ...(user.blockedEntities || []).map(String)])];
  const appliedJobIds = (await Application.find({ applicant: user._id }).select('job')).map((a) => String(a.job));

  const query = {
    status: 'active',
    validThrough: { $gt: now },
    recruiter: { $nin: blockedIds },
    company: { $nin: blockedIds },
  };
  if ((user.hiddenJobs || []).length) query._id = { $nin: user.hiddenJobs };

  const pool = await Job.find(query)
    .populate('company', 'name logo location website')
    .populate({ path: 'recruiter', select: 'subscription', populate: { path: 'subscription', select: 'hasPriorityListing' } })
    .sort({ createdAt: -1 })
    .limit(POOL_SIZE);

  const prepared = pool.map((doc) => {
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    const recruiter = plain.recruiter;
    plain.isPriority = Boolean(recruiter?.subscription?.hasPriorityListing);
    plain.recruiter = recruiter?._id || recruiter; // clients expect the id, as before
    return plain;
  });

  const thin = isThinProfile(user);
  const ranked = rankJobsForSeeker(user, prepared, { limit, minScore: thin ? 0 : MIN_SCORE, appliedJobIds, now });
  return ranked.map(({ job, score, reasons, priority, thin: isThin }) => ({
    ...job,
    relevance: { score, reasons, priority, ...(isThin ? { thin: true } : {}) },
  }));
};

module.exports = { getRankedMatches, engineEnabled, POOL_SIZE, MIN_SCORE };
