// Where each college is on the road from signup to paying, and how many are at each step.
const { levelFor } = require('./collegeLimit');

const STEPS = [
  { key: 'signedUp', label: 'Signed up' },
  { key: 'called', label: 'Called by our team' },
  { key: 'students', label: 'Students uploaded' },
  { key: 'drive', label: 'First drive created' },
  { key: 'report', label: 'First report made' },
  { key: 'nearLimit', label: 'Near student limit (70%+)' },
  { key: 'paid', label: 'Paid plan' },
];

const flagsFor = ({ students = 0, limit = 0, called = false, drive = false, report = false, tier = 'campus_free' }) => ({
  signedUp: true,
  called: !!called,
  students: students > 0,
  drive: !!drive,
  report: !!report,
  nearLimit: levelFor(students, limit) > 0,
  paid: !!tier && tier !== 'campus_free',
});

// The next thing a college has not done yet, in the order we want them to do it. Paid colleges have none.
const nextStep = (f) => (!f.called ? 'called' : !f.students ? 'students' : !f.drive ? 'drive' : !f.report ? 'report' : !f.paid ? 'paid' : null);

const summarise = (rows) => STEPS.map((s) => ({ ...s, count: rows.filter((r) => r.flags[s.key]).length }));

module.exports = { STEPS, flagsFor, nextStep, summarise };
