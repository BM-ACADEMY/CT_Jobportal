const test = require('node:test');
const assert = require('node:assert/strict');
const { computeResponseTime, formatResponseTime } = require('../../utils/recruiterResponse');
const { statusUpdateExtras, generateCertificateCode, isValidCode, buildCertificate } = require('../../utils/internshipCertificate');
const { cleanWalkIn } = require('../../utils/walkIn');
const { runRecruiterNudge, groupUnread } = require('../../cron/recruiterNudge');

const NOW = new Date('2026-11-20T10:00:00Z');
const H = 3600000;
const app = (receivedHoursAgo, respondedAfterHours) => ({
  createdAt: new Date(NOW - receivedHoursAgo * H),
  firstResponseAt: respondedAfterHours == null ? null : new Date(NOW - receivedHoursAgo * H + respondedAfterHours * H),
});

test('response time: fewer than 5 qualifying applications shows nothing', () => {
  assert.equal(computeResponseTime([app(100, 2), app(100, 3), app(100, 4), app(100, 5)], NOW), null);
  assert.equal(computeResponseTime([], NOW), null);
  assert.equal(computeResponseTime(undefined, NOW), null);
});

test('response time: median of at least 5, unanswered and old applications are ignored', () => {
  const apps = [app(100, 1), app(100, 2), app(100, 10), app(100, 30), app(100, 50), app(100, null), app(24 * 100, 1)];
  const r = computeResponseTime(apps, NOW);
  assert.equal(r.sample, 5);
  assert.equal(r.medianHours, 10);
});

test('response time: a negative interval is dropped, never shown', () => {
  const bad = { createdAt: new Date(NOW - 10 * H), firstResponseAt: new Date(NOW - 20 * H) };
  assert.equal(computeResponseTime([bad, bad, bad, bad, bad], NOW), null);
  const r = computeResponseTime([bad, app(50, 4), app(50, 4), app(50, 4), app(50, 4), app(50, 4)], NOW);
  assert.equal(r.sample, 5);
  assert.ok(r.medianHours >= 0);
});

test('response time wording rounds up and never goes negative', () => {
  assert.equal(formatResponseTime(0.2), 'within an hour');
  assert.equal(formatResponseTime(5.2), '6 hours');
  assert.equal(formatResponseTime(24), '1 day');
  assert.equal(formatResponseTime(49), '3 days');
  assert.equal(formatResponseTime(-3), '');
  assert.equal(formatResponseTime(NaN), '');
});

test('first response is recorded once, only from pending, never for withdrawn', () => {
  const existing = { status: 'pending', createdAt: new Date(NOW - 5 * H), firstResponseAt: null };
  assert.ok(statusUpdateExtras({ existing, job: {}, status: 'reviewed', now: NOW }).set.firstResponseAt);
  assert.ok(statusUpdateExtras({ existing, job: {}, status: 'rejected', now: NOW }).set.firstResponseAt);
  assert.equal(statusUpdateExtras({ existing, job: {}, status: 'withdrawn', now: NOW }).set.firstResponseAt, undefined);
  assert.equal(statusUpdateExtras({ existing: { ...existing, firstResponseAt: NOW }, job: {}, status: 'shortlisted', now: NOW }).set.firstResponseAt, undefined);
  assert.equal(statusUpdateExtras({ existing: { ...existing, status: 'reviewed' }, job: {}, status: 'shortlisted', now: NOW }).set.firstResponseAt, undefined);
  // a record dated in the future never produces a negative interval
  assert.equal(statusUpdateExtras({ existing: { ...existing, createdAt: new Date(NOW.getTime() + H) }, job: {}, status: 'reviewed', now: NOW }).set.firstResponseAt, undefined);
});

test('completed: internships only, accepted only, certificate code only when the posting offered one', () => {
  const accepted = { status: 'accepted', createdAt: new Date(NOW - 99 * H) };
  assert.match(statusUpdateExtras({ existing: accepted, job: { jobType: 'Full-time' }, status: 'completed' }).error, /internship/i);
  assert.ok(statusUpdateExtras({ existing: { ...accepted, status: 'pending' }, job: { jobType: 'Internship' }, status: 'completed' }).error);
  const withCert = statusUpdateExtras({ existing: accepted, job: { jobType: 'Internship', internship: { certificate: true } }, status: 'completed', now: NOW, makeCode: () => 'VV-ABCDEFGHJK' });
  assert.equal(withCert.set.certificateCode, 'VV-ABCDEFGHJK');
  assert.equal(withCert.set.completedAt, NOW);
  const noCert = statusUpdateExtras({ existing: accepted, job: { jobType: 'Internship', internship: { certificate: false } }, status: 'completed', now: NOW });
  assert.equal(noCert.set.certificateCode, undefined);
  assert.ok(noCert.set.completedAt);
  // an existing code is kept
  assert.equal(statusUpdateExtras({ existing: { ...accepted, certificateCode: 'VV-ABCDEFGHJK' }, job: { jobType: 'Internship', internship: { certificate: true } }, status: 'completed' }).set.certificateCode, undefined);
});

test('certificate codes are well-formed and verified by shape', () => {
  for (let i = 0; i < 50; i++) assert.ok(isValidCode(generateCertificateCode()));
  assert.equal(isValidCode('VV-0000000000'), false);
  assert.equal(isValidCode("x' OR 1=1"), false);
  assert.equal(isValidCode(undefined), false);
});

test('certificate says only what the data says; not issued until completed with a code', () => {
  const base = { certificateCode: 'VV-ABCDEFGHJK', status: 'completed', completedAt: new Date('2026-11-10'), createdAt: new Date('2026-08-01') };
  const c = buildCertificate({ application: base, applicant: { name: 'Asha' }, job: { title: 'Web Intern' }, company: { name: 'Acme' } });
  assert.deepEqual(c, { code: 'VV-ABCDEFGHJK', name: 'Asha', company: 'Acme', role: 'Web Intern', appliedOn: '2026-08-01', completedOn: '2026-11-10' });
  assert.equal(buildCertificate({ application: { ...base, status: 'accepted' }, applicant: {}, job: {}, company: {} }), null);
  assert.equal(buildCertificate({ application: { ...base, certificateCode: null }, applicant: {}, job: {}, company: {} }), null);
});

test('walk-in: optional, needs date and venue, not in the past', () => {
  assert.deepEqual(cleanWalkIn(undefined), { data: { enabled: false } });
  assert.deepEqual(cleanWalkIn({ enabled: false, venue: 'x' }), { data: { enabled: false } });
  assert.ok(cleanWalkIn({ enabled: true, venue: 'Hall' }, NOW).error);
  assert.ok(cleanWalkIn({ enabled: true, date: '2026-11-25' }, NOW).error);
  assert.ok(cleanWalkIn({ enabled: true, date: '2026-01-01', venue: 'Main Hall' }, NOW).error);
  const ok = cleanWalkIn({ enabled: true, date: '2026-11-25', venue: '  12 Main   Road, Puducherry ' }, NOW);
  assert.equal(ok.data.venue, '12 Main Road, Puducherry');
  assert.equal(ok.data.enabled, true);
});

test('nudge groups by company and ignores jobs whose applicant list was opened', () => {
  const jobs = [
    { _id: 'j1', company: 'c1', recruiter: 'u1', lastViewedApplicantsAt: null },
    { _id: 'j2', company: 'c1', recruiter: 'u2', lastViewedApplicantsAt: new Date('2026-11-19') },
    { _id: 'j3', company: null, recruiter: 'u3', lastViewedApplicantsAt: null },
  ];
  const apps = [
    { job: 'j1', createdAt: new Date('2026-11-01') }, { job: 'j1', createdAt: new Date('2026-11-02') },
    { job: 'j2', createdAt: new Date('2026-11-05') }, { job: 'j3', createdAt: new Date('2026-11-05') },
  ];
  const g = groupUnread(apps, jobs);
  assert.equal(g.length, 2);
  const c1 = g.find((x) => x.key === 'c:c1');
  assert.equal(c1.count, 2);
  assert.deepEqual(c1.recruiterIds, ['u1']);
  assert.ok(g.find((x) => x.key === 'r:u3'));
});

const fakes = (recent) => {
  const calls = [];
  return {
    calls,
    Application: { find: () => ({ select() { return this; }, limit() { return this; }, lean: async () => [{ job: 'j1', createdAt: new Date('2000-01-01') }] }) },
    Job: { find: () => ({ select() { return this; }, lean: async () => [{ _id: 'j1', company: 'c1', recruiter: 'u1', lastViewedApplicantsAt: null }] }) },
    User: { find: () => ({ select() { return this; }, lean: async () => [{ _id: 'u1', email: 'a@acme.com' }] }) },
    Notification: { exists: async () => recent },
    notifyUsers: async (x) => { calls.push(x); return []; },
  };
};

test('nudge is off unless RECRUITER_NUDGE_ENABLED=true', async () => {
  delete process.env.RECRUITER_NUDGE_ENABLED;
  const f = fakes(false);
  const r = await runRecruiterNudge(f, Date.now());
  assert.equal(r.skipped, 'disabled');
  assert.equal(f.calls.length, 0);
});

test('nudge sends once, and not again while the last one is under 3 days old', async () => {
  process.env.RECRUITER_NUDGE_ENABLED = 'true';
  try {
    const f1 = fakes(false);
    // applications are dated 2000, so the lookback window is the database's job; the fake returns them regardless
    const r1 = await runRecruiterNudge(f1, Date.now());
    assert.equal(r1.sent, 1);
    assert.equal(f1.calls.length, 1);
    assert.equal(f1.calls[0].type, 'recruiter_unread_nudge');
    assert.equal(f1.calls[0].metadata.groupKey, 'c:c1');
    const f2 = fakes(true);
    const r2 = await runRecruiterNudge(f2, Date.now());
    assert.equal(r2.sent, 0);
    assert.equal(f2.calls.length, 0);
  } finally { delete process.env.RECRUITER_NUDGE_ENABLED; }
});
