const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify, makeCode, cleanPhone, cleanEmail, cleanDriveInput, publicDrive, shareText, toCsv, summarise } = require('../utils/driveRules');

const NOW = new Date('2026-11-09T06:00:00Z');
const good = (over = {}) => ({
  title: 'Walk-in for Sales Executives', date: '2026-11-20', roles: [{ title: 'Sales Executive', vacancies: 10, pay: '15000' }],
  slots: [{ label: '10:00 AM', capacity: 40 }, { label: '2:00 PM', capacity: 40 }], venue: { address: '12 Main Road, Villupuram', city: 'Villupuram', mapUrl: 'https://maps.example/x' },
  documents: ['Resume', 'Aadhaar'], plan: 'plus', ...over,
});

test('phone numbers: Indian mobiles only, with or without +91 or 0', () => {
  assert.equal(cleanPhone('98765 43210'), '9876543210');
  assert.equal(cleanPhone('+91 98765-43210'), '9876543210');
  assert.equal(cleanPhone('09876543210'), '9876543210');
  assert.equal(cleanPhone('12345'), '');
  assert.equal(cleanPhone('5876543210'), '');
  assert.equal(cleanPhone(undefined), '');
});

test('codes are 8 easy characters and different each time', () => {
  const codes = new Set(Array.from({ length: 500 }, () => makeCode()));
  assert.equal(codes.size, 500);
  for (const c of codes) assert.match(c, /^[A-HJ-NP-Z2-9]{8}$/);
});

test('slugs are tidy and unique-looking', () => {
  assert.match(slugify('Walk-in @ Villupuram!!'), /^walk-in-villupuram-[0-9a-f]{6}$/);
  assert.equal(slugify('', () => 'abc'), 'drive-abc');
});

test('a good drive passes and is cleaned', () => {
  const r = cleanDriveInput(good({ title: '  Walk-in   for Sales Executives ' }), NOW);
  assert.ok(r.data);
  assert.equal(r.data.title, 'Walk-in for Sales Executives');
  assert.equal(r.data.plan, 'plus');
  assert.equal(r.data.slots.length, 2);
});

test('bad drives are refused with a plain reason', () => {
  assert.match(cleanDriveInput(good({ title: 'Hi' }), NOW).error, /title/i);
  assert.match(cleanDriveInput(good({ date: 'nope' }), NOW).error, /date/i);
  assert.match(cleanDriveInput(good({ date: '2026-11-01' }), NOW).error, /past/i);
  assert.match(cleanDriveInput(good({ date: '2027-06-01' }), NOW).error, /120 days/);
  assert.match(cleanDriveInput(good({ roles: [] }), NOW).error, /role/i);
  assert.match(cleanDriveInput(good({ slots: [] }), NOW).error, /slot/i);
  assert.match(cleanDriveInput(good({ slots: [{ label: 'A' }, { label: 'a' }] }), NOW).error, /different/i);
  assert.match(cleanDriveInput(good({ venue: { address: '' } }), NOW).error, /address/i);
});

test('today is allowed, an unknown plan falls back to free, a bad map link is dropped', () => {
  assert.ok(cleanDriveInput(good({ date: '2026-11-09' }), NOW).data);
  assert.equal(cleanDriveInput(good({ plan: 'gold' }), NOW).data.plan, 'free');
  assert.equal(cleanDriveInput(good({ venue: { address: 'x', mapUrl: 'javascript:alert(1)' } }), NOW).data.venue.mapUrl, '');
});

test('the public view shows spots left and never the organiser account', () => {
  const d = { slug: 's', title: 'T', roles: [], venue: {}, date: NOW, documents: [], screeningQuestions: [], status: 'published', organiser: 'secret', slots: [{ label: '10 AM', capacity: 5 }] };
  const p = publicDrive(d, { registered: 3, slotCounts: { '10 AM': 4 }, limits: { maxRegistrations: 50, homeSpotDays: 0 } });
  assert.equal(p.slots[0].left, 1);
  assert.equal(p.spotsLeft, 47);
  assert.equal(p.sponsored, false);
  assert.ok(!JSON.stringify(p).includes('secret'));
});

test('share text and csv', () => {
  const t = shareText({ title: 'Big Drive', date: new Date('2026-11-20T04:00:00Z'), roles: [{ title: 'Cashier' }], venue: { name: 'Hall', city: 'Pondy' } }, 'https://x/drives/a');
  assert.match(t, /Big Drive/); assert.match(t, /20 November 2026/); assert.match(t, /https:\/\/x\/drives\/a/);
  assert.equal(toCsv([['a', 'b,c'], ['d"e', 'f']]), 'a,"b,c"\n"d""e",f');
});

test('report counts: attended is anyone past check-in', () => {
  const regs = ['registered', 'checked_in', 'shortlisted', 'selected', 'selected', 'on_hold', 'not_selected'].map((status) => ({ status }));
  assert.deepEqual(summarise(regs), { registered: 7, attended: 6, noShow: 1, shortlisted: 1, selected: 2, onHold: 1, notSelected: 1 });
});
