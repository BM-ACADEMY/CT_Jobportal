'use strict';
// Test harness for the payment code. It loads the REAL controllers and fulfillment logic, but swaps
// everything that touches the outside world for in-memory fakes: MongoDB (no connection is needed),
// the Razorpay API, e-mail and in-app notifications. Require this file BEFORE any controller — it
// installs the fakes into the module cache — and use one process per test file (`node --test` does).
const path = require('path');
const crypto = require('crypto');

const SRV = path.join(__dirname, '..', '..');
// Set explicitly (never left to the developer's .env, which dotenv would otherwise load later) and
// different from each other, since Razorpay signs checkouts and webhooks with different secrets.
const KEY_SECRET = 'test_key_secret';
const WEBHOOK_SECRET = 'test_webhook_secret';
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

const hmacWith = secret => payload => crypto.createHmac('sha256', secret).update(payload).digest('hex');
const hmac = hmacWith(KEY_SECRET);             // checkout signatures (order_id|payment_id)
const webhookHmac = hmacWith(WEBHOOK_SECRET);  // webhook body signatures
const sign = (first, second) => hmac(`${first}|${second}`);

const stub = (rel, exports) => {
  const file = require.resolve(path.join(SRV, rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

// ---- in-memory state ---------------------------------------------------------------------
const db = {
  payments: [],
  renewalLogs: [],
  users: {},
  colleges: {},      // razorpay subscription id -> College doc
  collegeByTpo: {},  // user id -> College doc
  coupons: {},
  couponUses: 0,
  saves: 0,
  roleName: 'jobseeker',
  emails: [],
  adminNotes: [],
  inAppNotes: []
};
const razorpay = { orders: {}, subscriptions: {}, createdOrders: [] };

// ---- outside-world fakes ------------------------------------------------------------------
stub('config/razorpay', () => ({
  orders: {
    fetch: async id => razorpay.orders[id],
    create: async options => {
      razorpay.createdOrders.push(options);
      return { id: `order_created_${razorpay.createdOrders.length}`, amount: options.amount, currency: options.currency };
    }
  },
  subscriptions: { fetch: async id => razorpay.subscriptions[id] }
}));
stub('utils/sendEmail', async options => { db.emails.push(options); return true; });
stub('utils/inAppNotifications', {
  notifyUser: async n => { db.inAppNotes.push(n); },
  notifyUsers: async n => { db.inAppNotes.push(n); },
  notifyRoles: async n => { db.adminNotes.push(n); }
});
stub('utils/teamMembership', { reconcileTeamSeats: async () => {} });
stub('utils/pdfGenerator', { generateMouPdf: async () => Buffer.from('') });
stub('utils/fileStorage', { saveBufferToUploads: () => 'mou.pdf' });

// ---- fake persistence ---------------------------------------------------------------------
const Payment = require(path.join(SRV, 'models/Payment'));
const User = require(path.join(SRV, 'models/User'));
const Role = require(path.join(SRV, 'models/Role'));
const Subscription = require(path.join(SRV, 'models/Subscription'));
const PayPerFeature = require(path.join(SRV, 'models/PayPerFeature'));
const Settings = require(path.join(SRV, 'models/Settings'));
const Coupon = require(path.join(SRV, 'models/Coupon'));
const College = require(path.join(SRV, 'models/College'));
const Company = require(path.join(SRV, 'models/Company'));
const RenewalLog = require(path.join(SRV, 'models/RenewalLog'));

const duplicateKey = () => Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
let nextPaymentId = 1;

// Stands in for the unique partial index on Payment.razorpay_payment_id (only for amount > 0).
Payment.create = async doc => {
  if (doc.amount > 0 && db.payments.some(p => p.amount > 0 && p.razorpay_payment_id === doc.razorpay_payment_id)) {
    throw duplicateKey();
  }
  const record = { _id: `pay${nextPaymentId++}`, paymentType: 'subscription', isRenewal: false, ...doc };
  db.payments.push(record);
  return record;
};
Payment.findOne = async q => db.payments.find(p => p.razorpay_payment_id === q.razorpay_payment_id) || null;
Payment.exists = async q => (db.payments.some(p =>
  p.razorpay_payment_id === q.razorpay_payment_id && (!q.isRenewal || p.isRenewal !== true)) ? { _id: 1 } : null);
Payment.deleteOne = async q => {
  const i = db.payments.findIndex(p => p._id === q._id);
  if (i !== -1) db.payments.splice(i, 1);
};
Payment.updateMany = async (q, update) => {
  db.payments
    .filter(p => p.user === q.user
      && p.status === q.status
      && (!q.paymentType || p.paymentType !== q.paymentType.$ne)
      && (!q._id || p._id !== q._id.$ne))
    .forEach(p => Object.assign(p, update.$set));
};

// Stands in for the unique index on RenewalLog.eventId.
RenewalLog.create = async doc => {
  if (doc.eventId && db.renewalLogs.some(l => l.eventId === doc.eventId)) throw duplicateKey();
  db.renewalLogs.push(doc);
  return doc;
};

Settings.findOne = async () => ({ gstPercentage: 18 });
Role.findById = () => ({ select: async () => ({ name: db.roleName }) });
Coupon.findOne = async q => {
  const coupon = db.coupons[q.code];
  return coupon && (q.isActive === undefined || coupon.isActive === q.isActive) ? coupon : null;
};
Coupon.updateOne = async () => { db.couponUses += 1; };

User.findById = async id => db.users[id] || null;
User.findOne = async q => Object.values(db.users).find(u => u.email === q.email) || null;
College.findOne = async q => (q.razorpaySubscriptionId
  ? db.colleges[q.razorpaySubscriptionId] || null
  : db.collegeByTpo[q.tpoUser] || null);
College.findById = async () => null;
Company.findOne = async () => null;
Company.findById = async () => null;

// ---- catalogue ----------------------------------------------------------------------------
const plan = (fields) => ({ features: [], toObject() { return { name: this.name }; }, ...fields });
const plans = {
  pro: plan({ _id: 'planPro', name: 'Pro', price: 1000, duration: 'Monthly', role: 'jobseeker' }),
  cheap: plan({ _id: 'planCheap', name: 'Cheap', price: 100, duration: 'Monthly', role: 'jobseeker' }),
  free: plan({ _id: 'planFree', name: 'Free', price: 0, duration: 'Lifetime', role: 'jobseeker' }),
  enterprise: plan({ _id: 'planEnterprise', name: 'Enterprise', price: 0, isCustomPrice: true, duration: 'Yearly', role: 'jobseeker' }),
  org: plan({ _id: 'planOrg', name: 'Org', price: 2000, duration: 'Monthly', role: 'company' }),
  campus: plan({ _id: 'planCampus', name: 'Campus Pro', price: 5000, duration: 'Yearly', role: 'college' })
};
Subscription.findById = async id => Object.values(plans).find(p => p._id === id) || null;

const feature = { _id: 'featBoost', name: 'Profile Boost', cost: 100, days: 7, usageCount: 5, featureKey: 'boost', isActive: true };
const otherFeature = { _id: 'featPremium', name: 'Premium Search', cost: 900, days: 30, usageCount: 50, featureKey: 'search', isActive: true };
PayPerFeature.findById = async id => [feature, otherFeature].find(f => f._id === id) || null;

// ---- fixtures -----------------------------------------------------------------------------
const makeUser = (id, extra = {}) => (db.users[id] = {
  _id: id,
  email: `${id}@example.com`,
  name: id,
  role: 'roleId',
  subscription: null,
  subscriptionExpiry: null,
  downloadsUsed: 7,
  purchasedFeatures: [],
  async save() { db.saves += 1; },
  ...extra
});

const makeCollege = tpoUser => (db.collegeByTpo[tpoUser] = {
  _id: 'college1',
  name: 'ABC College',
  tpoUser,
  principalEmail: 'principal@abc.edu',
  async save() {
    db.saves += 1;
    if (this.razorpaySubscriptionId) db.colleges[this.razorpaySubscriptionId] = this;
  }
});

const reset = () => {
  db.payments.length = 0;
  db.renewalLogs.length = 0;
  db.emails.length = 0;
  db.adminNotes.length = 0;
  db.inAppNotes.length = 0;
  db.saves = 0;
  db.couponUses = 0;
  db.roleName = 'jobseeker';
  db.coupons = { SAVE10: { _id: 'coupon1', code: 'SAVE10', percentage: 10, totalUses: 0, currentUses: 0, isActive: true } };
  for (const key of ['users', 'colleges', 'collegeByTpo']) {
    for (const k of Object.keys(db[key])) delete db[key][k];
  }
  razorpay.createdOrders.length = 0;
  for (const k of Object.keys(razorpay.orders)) delete razorpay.orders[k];
  for (const k of Object.keys(razorpay.subscriptions)) delete razorpay.subscriptions[k];
};

// ---- controllers under test (loaded after the fakes are in place) --------------------------
const paymentController = require(path.join(SRV, 'controllers/paymentController'));
const payPerController = require(path.join(SRV, 'controllers/payPerController'));

const mockRes = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; }
});

const invoke = async (handler, req) => {
  const res = mockRes();
  await handler({ io: null, ...req }, res);
  return res;
};
const asUser = (userId, role = 'jobseeker') => ({ id: userId, role });

const createOrder = (userId, body, role) => invoke(paymentController.createOrder, { user: asUser(userId, role), body });
const verifyPayment = (userId, body, role) => invoke(paymentController.verifyPayment, { user: asUser(userId, role), body });
const verifySubscription = (userId, body) => invoke(paymentController.verifySubscriptionPayment, { user: asUser(userId), body });
const payPerCreateOrder = (userId, body) => invoke(payPerController.purchaseCreateOrder, { user: asUser(userId), body });
const payPerVerify = (userId, body) => invoke(payPerController.purchaseVerify, { user: asUser(userId), body });

let eventCounter = 0;
// Delivers a signed Razorpay webhook. `signature`, `rawBody` and `omitSignature` can be used to test rejection.
const webhook = async (event, payload, { eventId = `evt_${++eventCounter}`, signature, rawBody, omitSignature = false } = {}) => {
  const raw = rawBody || Buffer.from(JSON.stringify({ event, payload }));
  const headers = { 'x-razorpay-event-id': eventId };
  if (!omitSignature) headers['x-razorpay-signature'] = signature || webhookHmac(raw.toString());
  return invoke(paymentController.handleRenewalWebhook, { headers, body: raw });
};

// ---- Razorpay payload builders ------------------------------------------------------------
const orderNotes = (userId, planId, quantity = 1, couponCode = '') => ({ userId, planId, quantity: String(quantity), couponCode });
const featureNotes = (userId, featureId, quantity = 1) => ({ userId, featureId, quantity: String(quantity), couponCode: '' });

// Registers a paid order with the fake Razorpay and returns the body a browser would send to verify it.
const paidOrder = ({ orderId, paymentId, planId, userId, amountRupees = 1180, notes }) => {
  razorpay.orders[orderId] = { id: orderId, amount: amountRupees * 100, notes: notes === undefined ? orderNotes(userId, planId) : notes };
  return { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sign(orderId, paymentId), planId };
};
const paidFeatureOrder = ({ orderId, paymentId, featureId = feature._id, userId, amountRupees = 118, quantity = 1 }) => {
  razorpay.orders[orderId] = { id: orderId, amount: amountRupees * 100, notes: featureNotes(userId, featureId, quantity) };
  return { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sign(orderId, paymentId), featureId };
};

const orderPaidPayload = (orderId, paymentId, notes, amountRupees) => ({
  payment: { entity: { id: paymentId, order_id: orderId, amount: amountRupees * 100 } },
  order: { entity: { id: orderId, amount: amountRupees * 100, amount_paid: amountRupees * 100, notes } }
});
const subscriptionChargedPayload = ({ subscriptionId = 'sub_1', paidCount, paymentId, amountRupees, notes }) => ({
  subscription: { entity: { id: subscriptionId, paid_count: paidCount, notes } },
  payment: { entity: { id: paymentId, amount: amountRupees * 100, currency: 'INR' } }
});

reset();

module.exports = {
  SRV, db, razorpay, plans, feature, otherFeature,
  hmac, webhookHmac, sign, reset, makeUser, makeCollege,
  createOrder, verifyPayment, verifySubscription, payPerCreateOrder, payPerVerify, webhook,
  paidOrder, paidFeatureOrder, orderNotes, featureNotes, orderPaidPayload, subscriptionChargedPayload,
  mockRes
};
