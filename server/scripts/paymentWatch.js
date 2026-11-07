// Watches every REAL payment shortly after it happens. Run by a timer on the server every 2 minutes.
//   node scripts/paymentWatch.js          check new payments (the normal run)
//   node scripts/paymentWatch.js --seed   mark every payment that exists now as already seen (run once at install)
//
// For each payment Razorpay captured in the last 6 hours (and older than 2 minutes) it checks, using utils/paymentCheck.js:
// the money is recorded, the plan is active, the invoice has 18% GST, and there is no subscription.
// If ANY check fails it switches payments OFF (removes PAYMENTS_ENABLED and restarts the API), writes the reason to the
// log and emails every admin. The first 5 good payments also get a short "checked OK" email.
// State is kept in a small JSON file so a payment is checked and reported once. Nothing here changes a payment record.
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const getRazorpay = require('../config/razorpay');
const sendEmail = require('../utils/sendEmail');
const { evaluatePayment } = require('../utils/paymentCheck');

const STATE_FILE = process.env.PAYMENT_WATCH_STATE || '/root/payment-watch-state.json';
const LOG_FILE = process.env.PAYMENT_WATCH_LOG || '/root/payment-watch.log';
const ENV_FILE = path.join(__dirname, '..', '.env');
const MIN_AGE_MS = 2 * 60 * 1000;
const LOOKBACK_MS = 6 * 3600 * 1000;
const OK_EMAILS = 5;

const log = (msg) => {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch { /* the console line is enough */ }
};
const readState = () => { try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { seen: {}, okEmails: 0 }; } };
const writeState = (s) => fs.writeFileSync(STATE_FILE, JSON.stringify(s));

const paymentsOff = () => {
  let env = fs.readFileSync(ENV_FILE, 'utf8');
  if (!/^PAYMENTS_ENABLED=/m.test(env)) return false;
  fs.writeFileSync(ENV_FILE, env.replace(/^PAYMENTS_ENABLED=.*\r?\n?/gm, ''));
  try { execSync('pm2 restart velaivaaipu-api', { stdio: 'ignore', env: { ...process.env, PATH: `${process.env.PATH}:/root/.nvm/versions/node/v22.21.1/bin` } }); } catch (e) { log(`could not restart the API: ${e.message}`); }
  return true;
};

const emailAdmins = async (subject, html) => {
  const admins = await Admin.find({}).select('email');
  for (const a of admins) if (a.email) { try { await sendEmail({ email: a.email, subject, html }); } catch (e) { log(`email to ${a.email} failed: ${e.message}`); } }
};

(async () => {
  const seedOnly = process.argv.includes('--seed');
  await mongoose.connect(process.env.MONGODB_URI);
  const state = readState();
  const now = Date.now();
  const razorpay = getRazorpay();
  const list = await razorpay.payments.all({ from: Math.floor((now - LOOKBACK_MS) / 1000), to: Math.floor(now / 1000), count: 100 });
  const captured = (list.items || []).filter((p) => p.status === 'captured');

  if (seedOnly) {
    captured.forEach((p) => { state.seen[p.id] = 'baseline'; });
    writeState(state);
    log(`seeded: ${captured.length} existing payment(s) marked as already seen`);
    return;
  }

  const settings = await Settings.findOne({ key: 'global' });
  const gstPercentage = Number(settings?.gstPercentage);
  let problemFound = false;

  for (const rzp of captured) {
    if (state.seen[rzp.id]) continue;
    if (now - rzp.created_at * 1000 < MIN_AGE_MS) continue; // give the site a moment to finish its own steps
    const record = await Payment.findOne({ razorpay_payment_id: rzp.id });
    const user = record ? await User.findById(record.user) : null;
    const plan = record?.plan ? await Subscription.findById(record.plan) : null;
    const result = evaluatePayment({ rzp, record, user, plan, gstPercentage, now });

    if (result.ok) {
      state.seen[rzp.id] = 'ok';
      const s = result.summary;
      log(`OK ${s.payment} order ${s.order} Rs ${s.amount} (base ${s.base} + ${s.gstPercentage}% GST) plan ${s.plan} status ${s.status} planActive ${s.planActive} subscription ${s.subscription}`);
      if (state.okEmails < OK_EMAILS) {
        state.okEmails += 1;
        await emailAdmins(`Payment checked OK: Rs ${s.amount} (${s.plan})`,
          `<p>A real payment was checked a few minutes after it happened. Everything is right.</p><ul><li>Payment: ${s.payment}</li><li>Order: ${s.order}</li><li>Plan: ${s.plan} (${s.planActive ? 'active' : s.status})</li><li>Amount: Rs ${s.amount} = Rs ${s.base} + ${s.gstPercentage}% GST</li><li>Subscription / auto-renewal: none</li></ul><p>${state.okEmails} of the first ${OK_EMAILS} payments checked.</p>`);
      }
    } else {
      state.seen[rzp.id] = 'PROBLEM';
      problemFound = true;
      const s = result.summary;
      log(`PROBLEM ${rzp.id} Rs ${rzp.amount / 100}: ${result.problems.join(' | ')}`);
      const switched = paymentsOff();
      log(switched ? 'payments switched OFF automatically' : 'payments were already off');
      await emailAdmins(`PAYMENTS SWITCHED OFF: a payment needs attention (${rzp.id})`,
        `<p><strong>Payments were switched off automatically</strong> because a real payment did not pass its check.</p><p>Payment: ${rzp.id}<br>Order: ${rzp.order_id || '-'}<br>Amount: Rs ${rzp.amount / 100}</p><p>What is wrong:</p><ul>${result.problems.map((x) => `<li>${x}</li>`).join('')}</ul><p>If a customer paid and did not get their plan, activate it or refund them in Razorpay. Then tell the dev team so payments can be switched on again.</p>`);
    }
  }
  writeState(state);
  if (!problemFound) log(`checked ${captured.length} captured payment(s) in the last 6 hours; nothing new needed attention`);
})().catch((e) => { log(`watcher error: ${e.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
