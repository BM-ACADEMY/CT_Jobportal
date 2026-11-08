const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const { istDayStart } = require('../utils/driveRules');

const mails = []; const regs = [];
const DAY = 86400000;
const now = new Date('2026-11-12T12:30:00Z'); // 18:00 IST on 12 Nov
const tomorrow = new Date(istDayStart(now).getTime() + DAY + 3600000);
const drives = [{ _id: 'd1', title: 'Drive', date: tomorrow, documents: ['Resume'], venue: { address: 'Main Rd' } }];
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/WalkInDrive') return { find: async (f) => drives.filter((d) => d.date >= f.date.$gte && d.date < f.date.$lt) };
  if (request === '../models/DriveRegistration') return { find: async (f) => regs.filter((r) => r.status === 'registered' && r.email && r[Object.keys(f).find((k) => k.startsWith('reminded'))] === false) };
  if (request === '../utils/sendEmail') return async (m) => { mails.push(m); };
  if (request === '../utils/emailTemplates') return { emailWrapper: (t, b) => `${t}|${b}` };
  return realLoad.call(this, request, ...rest);
};
const run = require('../cron/driveReminders');
const reg = (o) => ({ status: 'registered', remindedDayBefore: false, remindedMorning: false, email: 'a@x.in', name: 'A', slot: '10 AM', code: 'ABCDEFGH', save: async function () { return this; }, ...o });

test('off by default', async () => {
  delete process.env.DRIVE_REMINDERS_ENABLED;
  assert.deepEqual(await run('day_before', now), { skipped: true });
});

test('day-before mail goes once, to registered people with an email only', async () => {
  process.env.DRIVE_REMINDERS_ENABLED = 'true';
  regs.push(reg({}), reg({ email: '' }), reg({ status: 'checked_in' }));
  const a = await run('day_before', now);
  assert.equal(a.sent, 1); assert.match(mails[0].subject, /Tomorrow/); assert.match(mails[0].html, /Resume/);
  assert.equal((await run('day_before', now)).sent, 0);
  assert.equal((await run('morning', now)).sent, 0, 'drive is tomorrow, not today');
});
