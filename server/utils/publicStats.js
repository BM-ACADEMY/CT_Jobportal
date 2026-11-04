// Public home-page numbers: open jobs, companies hiring, students.
// Test/demo accounts are left out, and the answer is cached in memory for ~10 minutes
// so a busy home page never turns into a database load.

const TTL_MS = 10 * 60 * 1000;

// Emails that belong to test, demo or QA accounts. Extra patterns can be added without a
// code change via STATS_EXCLUDE_EMAIL_REGEX (a single regular expression, case-insensitive).
const DEFAULT_TEST_EMAIL = '(@(example\\.(com|org|net)|test\\.[a-z]+|testing\\.[a-z]+|mailinator\\.com|yopmail\\.com|guerrillamail\\.com|tempmail\\.[a-z]+)$)|(\\+test[^@]*@)|(^(test|demo|dummy|qa|sample)([._\\-+0-9][^@]*)?@)';

const testEmailRegex = () => {
  let extra = '';
  try {
    if (process.env.STATS_EXCLUDE_EMAIL_REGEX) {
      new RegExp(process.env.STATS_EXCLUDE_EMAIL_REGEX); // validate before use
      extra = `|(${process.env.STATS_EXCLUDE_EMAIL_REGEX})`;
    }
  } catch (_) { /* a bad env pattern is ignored */ }
  return new RegExp(DEFAULT_TEST_EMAIL + extra, 'i');
};

const isTestEmail = (email) => typeof email === 'string' && testEmailRegex().test(email.trim());

// Counts are computed with the models passed in, so the logic can be tested without a database.
async function computeHeroStats({ User, Job, Role, now = new Date() }) {
  const emailRe = testEmailRegex();

  const [testUserIds, jobseekerRole] = await Promise.all([
    User.find({ email: emailRe }).select('_id').lean().then((rows) => rows.map((r) => r._id)),
    Role.findOne({ name: 'jobseeker' }).lean(),
  ]);

  const openJobFilter = {
    status: 'active',
    recruiter: { $nin: testUserIds },
    $or: [{ validThrough: { $gte: now } }, { validThrough: null }, { validThrough: { $exists: false } }],
  };

  const [openJobs, companyIds, students] = await Promise.all([
    Job.countDocuments(openJobFilter),
    Job.distinct('company', openJobFilter),
    jobseekerRole
      ? User.countDocuments({
        role: jobseekerRole._id,
        isDeleted: { $ne: true },
        isAdminBlocked: { $ne: true },
        _id: { $nin: testUserIds },
      })
      : 0,
  ]);

  return {
    openJobs,
    companiesHiring: companyIds.filter(Boolean).length,
    students,
  };
}

// A tiny single-value cache. Concurrent callers share one in-flight computation.
function createCache(ttlMs = TTL_MS, clock = () => Date.now()) {
  let value = null;
  let expiresAt = 0;
  let inflight = null;
  return {
    async get(load) {
      if (value && clock() < expiresAt) return value;
      if (inflight) return inflight;
      inflight = Promise.resolve()
        .then(load)
        .then((v) => { value = v; expiresAt = clock() + ttlMs; return v; })
        .finally(() => { inflight = null; });
      return inflight;
    },
    clear() { value = null; expiresAt = 0; },
  };
}

module.exports = { TTL_MS, isTestEmail, testEmailRegex, computeHeroStats, createCache };
