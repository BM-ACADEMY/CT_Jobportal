const test = require('node:test');
const assert = require('node:assert/strict');
const { thresholds, planSpikes, keyFor } = require('../utils/spikeAlerts');
const runSpikeAlerts = require('../cron/spikeAlerts');

const now = new Date('2026-11-16T10:20:00Z');

test('defaults and env levels; bad values fall back', () => {
  assert.deepEqual(thresholds({}), { signups: 30, otp: 60, reports: 10 });
  assert.deepEqual(thresholds({ SPIKE_SIGNUPS_PER_HOUR: '5', SPIKE_OTP_PER_HOUR: 'x', SPIKE_REPORTS_PER_HOUR: '-1' }), { signups: 5, otp: 60, reports: 10 });
});

test('only counts over the level raise a spike, once per hour', () => {
  assert.deepEqual(planSpikes({ signups: 30, otp: 60, reports: 10 }, { env: {}, now }), []);
  const s = planSpikes({ signups: 31, otp: 5, reports: 11 }, { env: {}, now });
  assert.deepEqual(s.map((x) => x.kind), ['signups', 'reports']);
  assert.equal(s[0].key, keyFor('signups', now));
  assert.deepEqual(planSpikes({ signups: 99 }, { env: {}, now, sent: new Set([keyFor('signups', now)]) }), []);
  assert.equal(planSpikes({ signups: 99 }, { env: {}, now: new Date('2026-11-16T11:05:00Z'), sent: new Set([keyFor('signups', now)]) }).length, 1);
});

const fakeDeps = (counts, notes, logged = new Set()) => ({
  User: { countDocuments: async (q) => (q.otpExpiry ? counts.otp : counts.signups) },
  JobReport: { countDocuments: async () => counts.reports },
  AdminAlertLog: {
    find: () => ({ select: () => ({ lean: async () => [...logged].map((key) => ({ key })) }) }),
    create: async ({ key }) => { if (logged.has(key)) { const e = new Error('dup'); e.code = 11000; throw e; } logged.add(key); }
  },
  notifyRoles: async (n) => { notes.push(n); }
});

test('cron sends one notification, then nothing more in the same hour; off switch and failures are safe', async () => {
  const notes = []; const logged = new Set();
  const deps = fakeDeps({ signups: 40, otp: 1, reports: 0 }, notes, logged);
  assert.equal((await runSpikeAlerts({ deps, env: {}, now })).spikes, 1);
  assert.equal(notes.length, 1);
  assert.deepEqual(notes[0].roles, ['admin']);
  assert.match(notes[0].message, /40 sign-ups/);
  assert.equal((await runSpikeAlerts({ deps, env: {}, now })).spikes, 0);
  assert.equal(notes.length, 1);
  assert.deepEqual(await runSpikeAlerts({ deps, env: { SPIKE_ALERTS_ENABLED: 'false' }, now }), { skipped: true });
  assert.deepEqual(await runSpikeAlerts({ deps: { User: null }, env: {}, now }), { error: true });
});
