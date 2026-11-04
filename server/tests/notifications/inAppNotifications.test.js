'use strict';
// Every in-app notification is also e-mailed to the recipient, unless the caller opts out.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SRV = path.join(__dirname, '..', '..');
process.env.FRONTEND_URL = 'https://app.example.com/';

const stub = (rel, exports) => {
  const file = require.resolve(path.join(SRV, rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

const emails = [];
let emailShouldFail = false;
stub('utils/sendEmail', async options => {
  if (emailShouldFail) throw new Error('smtp down');
  emails.push(options);
  return true;
});

const Notification = require(path.join(SRV, 'models/Notification'));
const User = require(path.join(SRV, 'models/User'));
const Role = require(path.join(SRV, 'models/Role'));
const Admin = require(path.join(SRV, 'models/Admin'));

const inserted = [];
Notification.insertMany = async docs => { inserted.push(...docs); return docs; };
const directory = {};
User.find = q => {
  const ids = (q._id?.$in || []).map(String);
  const roleIds = (q.role?.$in || []).map(String);
  const users = Object.values(directory).filter(u => (ids.length ? ids.includes(String(u._id)) : roleIds.includes(String(u.role))));
  return { select: async () => users };
};
const adminPanel = [];
Admin.find = q => {
  const ids = (q._id?.$in || []).map(String);
  const roles = q.role?.$in || [];
  const rows = adminPanel.filter(a => (ids.length ? ids.includes(String(a._id)) : roles.includes(a.role)));
  return { select: async () => rows };
};
Role.find = () => ({ select: async () => [{ _id: 'adminRole' }] });

const { notifyUser, notifyUsers, notifyRoles } = require(path.join(SRV, 'utils/inAppNotifications'));

// e-mails are sent in the background, so give them a moment.
const settle = () => new Promise(resolve => setTimeout(resolve, 20));

describe('in-app notifications also send email', () => {
  beforeEach(() => {
    emails.length = 0;
    inserted.length = 0;
    emailShouldFail = false;
    for (const k of Object.keys(directory)) delete directory[k];
    directory.recruiter = { _id: 'recruiter', name: 'Priya', email: 'priya@example.com', role: 'recruiterRole' };
    directory.seeker = { _id: 'seeker', name: 'Mano', email: 'mano@example.com', role: 'seekerRole' };
    directory.noMail = { _id: 'noMail', name: 'No Email', role: 'seekerRole' };
    directory.admin = { _id: 'admin', name: 'Admin', email: 'admin@example.com', role: 'adminRole' };
  });

  it('emails the recipient with the notification message and a link into the app', async () => {
    await notifyUser({
      recipientId: 'recruiter',
      title: 'New job application',
      message: 'Mano has applied for the job “Software Developer Intern” posted by you.',
      link: '/company/applicants/abc'
    });
    await settle();

    assert.equal(inserted.length, 1);
    assert.equal(emails.length, 1);
    assert.equal(emails[0].email, 'priya@example.com');
    assert.equal(emails[0].subject, 'New job application');
    assert.match(emails[0].html, /Hi Priya/);
    assert.match(emails[0].html, /Mano has applied for the job “Software Developer Intern” posted by you\./);
    assert.match(emails[0].html, /href="https:\/\/app\.example\.com\/company\/applicants\/abc"/);
  });

  it('uses a custom subject when one is given', async () => {
    await notifyUser({ recipientId: 'recruiter', title: 'T', message: 'm', emailSubject: 'New application — Developer' });
    await settle();
    assert.equal(emails[0].subject, 'New application — Developer');
  });

  it('does not email when the caller opts out (it sends its own email)', async () => {
    await notifyUser({ recipientId: 'recruiter', title: 'T', message: 'm', email: false });
    await settle();
    assert.equal(inserted.length, 1, 'the in-app notification is still created');
    assert.equal(emails.length, 0);
  });

  it('skips recipients who have no email address', async () => {
    await notifyUsers({ recipientIds: ['seeker', 'noMail'], title: 'T', message: 'm' });
    await settle();
    assert.equal(inserted.length, 2);
    assert.deepEqual(emails.map(e => e.email), ['mano@example.com']);
  });

  it('emails each recipient once, even if listed twice', async () => {
    await notifyUsers({ recipientIds: ['seeker', 'seeker', 'seeker'], title: 'T', message: 'm' });
    await settle();
    assert.equal(inserted.length, 1);
    assert.equal(emails.length, 1);
  });

  it('emails everyone holding a role', async () => {
    await notifyRoles({ roles: ['admin'], title: 'New user registered', message: 'Mano registered as jobseeker.' });
    await settle();
    assert.deepEqual(emails.map(e => e.email), ['admin@example.com']);
  });

  it('also alerts and emails admin-panel accounts (Admin collection)', async () => {
    adminPanel.push({ _id: 'panelAdmin', name: 'Kamar', email: 'kamar@example.com', role: 'admin' });
    try {
      await notifyRoles({ roles: ['admin', 'subadmin'], title: 'New counselling request', message: 'Booked.' });
      await settle();
      assert.ok(inserted.some(n => String(n.recipient) === 'panelAdmin'));
      assert.ok(emails.some(e => e.email === 'kamar@example.com'));
    } finally { adminPanel.length = 0; }
  });

  it('escapes HTML in user-supplied names and messages', async () => {
    directory.seeker.name = '<script>alert(1)</script>';
    await notifyUser({ recipientId: 'seeker', title: 'T', message: '<img src=x onerror=alert(1)>' });
    await settle();

    assert.doesNotMatch(emails[0].html, /<script>|<img/);
    assert.match(emails[0].html, /&lt;script&gt;/);
    assert.match(emails[0].html, /&lt;img src=x/);
  });

  it('does nothing when there are no recipients', async () => {
    const result = await notifyUsers({ recipientIds: [], title: 'T', message: 'm' });
    await settle();
    assert.deepEqual(result, []);
    assert.equal(inserted.length, 0);
    assert.equal(emails.length, 0);
  });

  it('still delivers the in-app notification when email sending fails', async () => {
    emailShouldFail = true;
    const result = await notifyUser({ recipientId: 'seeker', title: 'T', message: 'm' });
    await settle();
    assert.equal(result.length, 1);
    assert.equal(inserted.length, 1);
  });
});
