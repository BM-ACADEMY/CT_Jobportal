// "Jobs for you": loads a pool of open jobs, drops what the person must not see, and ranks it with the relevance engine.
// Output is an array of plain job objects (same shape the clients already read) plus `relevance: { score, reasons, priority }`.
const { rankJobsForSeeker, isThinProfile, rankCandidatesForJob } = require('./relevance');
const checkPriorityBadge = require('./checkPriorityBadge');

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

// Ranks candidates for one job: loads certificates and priority badges for the pool, then scores.
const rankPoolForJob = async (candidates, job, { User, SkillTestResult }) => {
  const ids = candidates.map((c) => c._id);
  const [certified, subs] = await Promise.all([
    SkillTestResult.distinct('user', { passed: true, user: { $in: ids } }),
    User.find({ _id: { $in: ids } }).select('subscription subscriptionDetails subscriptionExpiry purchasedFeatures priorityApplicationsUsed').populate('subscription').lean(),
  ]);
  const subById = new Map(subs.map((u) => [String(u._id), u]));
  const withBadge = candidates.map((c) => ({ ...c, isPriority: checkPriorityBadge({ ...c, ...subById.get(String(c._id)) }) }));
  return rankCandidatesForJob(withBadge, job, { certifiedIds: new Set(certified.map(String)) });
};

// Recruiter side: orders candidates by fit to the recruiter's most recent open job (their own jobs, or their company's),
// then by profile completeness. Returns [{ candidate, score, reasons, priority }]. With no open job it is completeness only.
const rankCandidatesByRelevance = async (candidates, recruiter, { Job, User, SkillTestResult }) => {
  const owner = [{ recruiter: recruiter._id }, ...(recruiter.company ? [{ company: recruiter.company }] : [])];
  const job = await Job.findOne({ status: 'active', $or: owner }).sort({ createdAt: -1 }).lean();
  return rankPoolForJob(candidates, job, { User, SkillTestResult });
};

const TOP_MIN_SCORE = 25; // a "top candidate" must actually fit the job
const CANDIDATE_FIELDS = 'name avatar profile.headline profile.skills profile.location profile.preferredRole profile.experience profile.qualification profile.profileCompletion blockedEntities';

// "Top candidates for this job". Public shape only: name, headline, role, city, up to 5 skills, why-lines. No email or phone.
const getTopCandidatesForJob = async (job, { User, Role, SkillTestResult }, { limit = 5 } = {}) => {
  const seekerRole = await Role.findOne({ name: 'jobseeker' });
  if (!seekerRole) return [];
  const pool = await User.find({ role: seekerRole._id, isAdminBlocked: { $ne: true } }).select(CANDIDATE_FIELDS).lean();
  const owners = [job.company?._id || job.company, job.recruiter?._id || job.recruiter].filter(Boolean).map(String);
  const eligible = pool.filter((c) => !(c.blockedEntities || []).some((b) => owners.includes(String(b))));

  const ranked = await rankPoolForJob(eligible, job, { User, SkillTestResult });
  return ranked
    .filter((r) => r.score >= TOP_MIN_SCORE)
    .slice(0, limit)
    .map(({ candidate, score, reasons, priority }) => ({
      _id: candidate._id,
      name: candidate.name,
      avatar: candidate.avatar || '',
      profile: {
        headline: candidate.profile?.headline || '',
        preferredRole: candidate.profile?.preferredRole || '',
        location: candidate.profile?.location || '',
        skills: (candidate.profile?.skills || []).slice(0, 5),
      },
      isPriority: priority,
      relevance: { score, reasons, priority },
    }));
};

module.exports = { getRankedMatches, rankCandidatesByRelevance, getTopCandidatesForJob, engineEnabled, POOL_SIZE, MIN_SCORE, TOP_MIN_SCORE };
