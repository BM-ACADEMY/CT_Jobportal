const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getJwtSecret } = require('../config/jwt');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/jobportal');

  const User = require('../models/User');
  const Role = require('../models/Role');
  const Subscription = require('../models/Subscription');
  const Payment = require('../models/Payment');

  // 1. Get or create a company user
  const companyRole = await Role.findOne({ name: 'company' });
  const adminRole = await Role.findOne({ name: 'admin' });

  let testCompany = await User.findOne({ email: 'smoketest_company@velaivaaipu.in' });
  if (!testCompany) {
    testCompany = await User.create({
      name: 'Smoke Test Employer',
      email: 'smoketest_company@velaivaaipu.in',
      password: 'Password@123',
      role: companyRole._id,
      isVerified: true,
      companyProfile: { phone: '9876543210', companyName: 'Smoke Test Tech' }
    });
  }

  let adminUser = await User.findOne({ email: 'admin@jobportal.com' });
  if (!adminUser) {
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@jobportal.com',
      password: 'Password@123',
      role: adminRole._id,
      isVerified: true
    });
  }

  const token = jwt.sign({ user: { id: testCompany._id.toString(), role: 'company' } }, getJwtSecret(), { expiresIn: '1h' });
  const adminToken = jwt.sign({ user: { id: adminUser._id.toString(), role: 'admin' } }, getJwtSecret(), { expiresIn: '1h' });

  // 2. Find or create a paid subscription plan (price > 0 so Razorpay order can be created)
  let plan = await Subscription.findOne({ role: 'company', price: { $gt: 0 }, isActive: true });
  if (!plan) {
    plan = await Subscription.create({
      name: 'Company Growth Plan',
      role: 'company',
      price: 999,
      duration: 'monthly',
      description: 'Growth plan for testing',
      features: [{ name: '5 job postings' }, { name: '50 candidate searches/day' }],
      activeJobPostings: 5,
      candidateSearchPerDay: 50,
      isActive: true
    });
  }

  console.log('Testing with plan:', plan.name, 'Price: ₹' + plan.price);

  // 3. Test Create Order
  const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId: plan._id.toString() })
  });
  const orderData = await orderRes.json();
  console.log('Create order status:', orderRes.status, 'Order details:', orderData.id ? `Razorpay order ID ${orderData.id}` : orderData);

  // 4. Simulate a completed payment inside 24 hours
  await Payment.deleteMany({ user: testCompany._id });

  const payment = await Payment.create({
    user: testCompany._id,
    plan: plan._id,
    amount: plan.price,
    currency: 'INR',
    razorpay_order_id: orderData.id || 'order_test_smoke_123',
    razorpay_payment_id: 'pay_test_smoke_123',
    status: 'completed',
    invoiceNumber: `INV-SMOKE-${Date.now()}`,
    createdAt: new Date() // Just created (inside 24h)
  });
  console.log('Completed payment created in DB:', payment._id.toString(), 'Status:', payment.status);

  // 5. Request refund within 24 hours
  const refundReqRes = await fetch(`http://localhost:5000/api/payments/${payment._id}/request-refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason: 'Accidental purchase during testing' })
  });
  const refundReqData = await refundReqRes.json();
  console.log('Request refund status:', refundReqRes.status, 'Response:', refundReqData);

  const updatedPayment = await Payment.findById(payment._id);
  console.log('Payment status after refund request:', updatedPayment.status, 'Reason:', updatedPayment.refundReason);

  // 6. Admin review and approve refund
  const approveRes = await fetch(`http://localhost:5000/api/payments/admin/refunds/${payment._id}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ adminNotes: 'Approved within 24h window test' })
  });
  const approveData = await approveRes.json();
  console.log('Admin approve refund status:', approveRes.status, 'Response:', approveData);

  const finalPayment = await Payment.findById(payment._id);
  console.log('Final Payment status:', finalPayment.status, 'Refund processed by:', finalPayment.refundProcessedBy);

  // 7. Verify that requesting refund again is rejected
  const repeatReqRes = await fetch(`http://localhost:5000/api/payments/${payment._id}/request-refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason: 'Try requesting again' })
  });
  const repeatData = await repeatReqRes.json();
  console.log('Repeat refund request status:', repeatReqRes.status, 'Code:', repeatData.code);

  await mongoose.disconnect();
})().catch(console.error);
