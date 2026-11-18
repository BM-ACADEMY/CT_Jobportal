// Decisions for the spike-alert job. Pure functions (no database, no clock besides the argument), so they can be tested.
const DEFAULTS = { signups: 30, otp: 60, reports: 10 };
const ENV_KEYS = { signups: 'SPIKE_SIGNUPS_PER_HOUR', otp: 'SPIKE_OTP_PER_HOUR', reports: 'SPIKE_REPORTS_PER_HOUR' };
const LABELS = { signups: 'sign-ups', otp: 'OTP requests', reports: 'job reports' };

const thresholds = (env = process.env) => {
  const out = {};
  for (const k of Object.keys(DEFAULTS)) {
    const n = Number(env[ENV_KEYS[k]]);
    out[k] = Number.isFinite(n) && n > 0 ? n : DEFAULTS[k];
  }
  return out;
};

// One key per kind per clock hour: the same spike is announced once, a new hour can announce again.
const hourKey = (now = new Date()) => new Date(now).toISOString().slice(0, 13);
const keyFor = (kind, now) => `spike:${kind}:${hourKey(now)}`;

// counts: { signups, otp, reports } for the last hour. sent: Set of keys already announced.
const planSpikes = (counts = {}, { env = process.env, now = new Date(), sent = new Set() } = {}) => {
  const limit = thresholds(env);
  return Object.keys(DEFAULTS)
    .filter((k) => Number(counts[k]) > limit[k] && !sent.has(keyFor(k, now)))
    .map((k) => ({ kind: k, label: LABELS[k], count: Number(counts[k]), limit: limit[k], key: keyFor(k, now) }));
};

const spikeMessage = (spikes) => spikes.map((s) => `${s.count} ${s.label} in the last hour (alert level ${s.limit})`).join('; ');

const enabled = (env = process.env) => env.SPIKE_ALERTS_ENABLED !== 'false';

module.exports = { DEFAULTS, thresholds, hourKey, keyFor, planSpikes, spikeMessage, enabled };
