const WalkInDrive = require('../models/WalkInDrive');
const DriveRegistration = require('../models/DriveRegistration');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { istDayStart } = require('../utils/driveRules');

const DAY = 86400000;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Emails registered people about their drive. `when` is 'day_before' (run in the evening, drives tomorrow) or 'morning' (drives today).
// Each person is mailed once per kind (flag on the registration), so a re-run never repeats a mail.
const runDriveReminders = async (when, now = new Date()) => {
  if (process.env.DRIVE_REMINDERS_ENABLED !== 'true') return { skipped: true };
  const start = new Date(istDayStart(now).getTime() + (when === 'day_before' ? DAY : 0));
  const flag = when === 'day_before' ? 'remindedDayBefore' : 'remindedMorning';
  let sent = 0;
  const drives = await WalkInDrive.find({ status: 'published', date: { $gte: start, $lt: new Date(start.getTime() + DAY) } });
  for (const d of drives) {
    const regs = await DriveRegistration.find({ drive: d._id, status: 'registered', [flag]: false, email: { $ne: '' } });
    for (const r of regs) {
      try {
        const docs = d.documents.length ? `<p>Bring: ${d.documents.map(esc).join(', ')}</p>` : '';
        await sendEmail({ email: r.email, subject: `${when === 'day_before' ? 'Tomorrow' : 'Today'}: ${d.title}`, html: emailWrapper(when === 'day_before' ? 'Your drive is tomorrow' : 'Your drive is today',
          `<p>Hi ${esc(r.name)}, <b>${esc(d.title)}</b> is ${when === 'day_before' ? 'tomorrow' : 'today'}.</p><p>Slot: ${esc(r.slot)}<br>Venue: ${esc(d.venue.address)}</p>${docs}<p>Your check-in code: <b>${r.code}</b></p>`) });
        r[flag] = true; await r.save(); sent++;
      } catch (e) { console.error('Drive reminder:', e.message); }
    }
  }
  return { sent };
};

module.exports = runDriveReminders;
