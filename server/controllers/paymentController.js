const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Settings = require('../models/Settings');
const College = require('../models/College');
const Company = require('../models/Company');
const RenewalLog = require('../models/RenewalLog');
const { generateMouPdf } = require('../utils/pdfGenerator');
const { saveBufferToUploads } = require('../utils/fileStorage');
const { sendWhatsAppMessage, triggerN8nWebhook } = require('../utils/notifications');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const Coupon = require('../models/Coupon');
const { reconcileTeamSeats } = require('../utils/teamMembership');
const { notifyUser, notifyRoles } = require('../utils/inAppNotifications');

const RECURRING_ROLES = ['college', 'company'];
const paymentHistoryLink = role => role === 'college'
  ? '/college/payment-history'
  : ['company', 'recruiter', 'org_employee'].includes(role)
    ? '/company/payment-history'
    : '/candidate/payment-history';
const STUDENT_LIMIT_UNLIMITED = 100000;
const COLLEGE_TIER_MAP = {
  'Campus Free': 'campus_free',
  'Campus Lite': 'campus_lite',
  'Campus Pro': 'campus_pro',
  'Campus Elite': 'campus_elite'
};
const MAX_RENEWAL_FAILURES = 3;

const computeNextRenewalDate = (duration, from = new Date()) => {
  const d = new Date(from);
  if (duration === 'Monthly') d.setMonth(d.getMonth() + 1);
  else if (duration === 'Quarterly') d.setMonth(d.getMonth() + 3);
  else if (duration === 'Yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setFullYear(d.getFullYear() + 100);
  return d;
};

const fetchGstPercentage = async () => {
  const settings = await Settings.findOne({ key: 'global' });
  return settings?.gstPercentage || 0;
};

const getPricingOption = (plan, quantity) => {
  if (plan.pricingOptions && plan.pricingOptions.length > 0) {
    const opt = plan.pricingOptions.find(o => o.quantity === quantity);
    if (opt) {
      return opt.price;
    }
  }
  
  // Default fallback calculation:
  const basePerUnit = plan.price || plan.cost || 0;
  const baseTotal = basePerUnit * quantity;
  let discountPercentage = 0;
  if (quantity >= 12) discountPercentage = 20;
  else if (quantity >= 6) discountPercentage = 10;
  else if (quantity >= 3) discountPercentage = 5;
  const discountAmount = Math.round(baseTotal * discountPercentage) / 100;
  return baseTotal - discountAmount;
};

// @desc    Create a Razorpay order
// @route   POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ msg: 'planId is required' });
    }

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({ msg: 'Subscription plan not found' });
    }

    // Razorpay doesn't allow 0 amount orders
    if (plan.price === 0) {
      return res.status(400).json({ msg: 'Free plans do not require a Razorpay order' });
    }

    // Block before money changes hands — a delegated team member paying for an org-tier plan
    // here would still get rejected at verifyPayment, but only after being charged with no refund.
    if (plan.role === 'company' && req.user.role === 'org_employee') {
      return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
    }
    if (plan.role === 'company') {
      const requestingUser = await User.findById(req.user.id).select('isTeamManaged');
      if (requestingUser?.isTeamManaged) {
        return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
      }
    }

    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);
    const { couponCode } = req.body;
    const gstPercentage = await fetchGstPercentage();
    
    // Look up pricing option configured by admin, with default fallback
    let baseAmount = getPricingOption(plan, quantity);
    const baseAmountPerUnit = plan.price || plan.cost || 0;

    let discountPercentage = 0;
    let couponApplied = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
        discountPercentage = coupon.percentage;
        couponApplied = coupon._id;
        const discountVal = (baseAmount * discountPercentage) / 100;
        baseAmount = baseAmount - discountVal;
      }
    }

    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(totalAmount * 100);
    const currency = 'INR';

    const options = {
      amount: amountInPaise,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planId: plan._id,
      quantity,
      baseAmountPerUnit,
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
      discountPercentage,
      couponApplied
    });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      isFree,
      couponCode
    } = req.body;
    const quantity = Math.max(1, parseInt(req.body.quantity) || 1);

    if (!isFree) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        return res.status(400).json({ msg: 'Invalid payment signature' });
      }
    }

    // Signature is valid, update user subscription
    const plan = await Subscription.findById(planId);
    if (!plan) {
      return res.status(404).json({ msg: 'Plan not found' });
    }

    // Calculate expiry date (multiplied by quantity)
    let expiryDate = new Date();
    if (plan.duration === 'Monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + quantity);
    } else if (plan.duration === 'Quarterly') {
      expiryDate.setMonth(expiryDate.getMonth() + (3 * quantity));
    } else if (plan.duration === 'Yearly') {
      expiryDate.setFullYear(expiryDate.getFullYear() + quantity);
    } else if (plan.duration === 'Lifetime') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    }

    const { autoRenew } = req.body;

    const user = await User.findById(req.user.id);

    // Only the actual org owner may purchase a company-tier plan — a delegated team member
    // (a recruiter added by the org admin, or an org_employee) manages recruiting only and
    // never billing, regardless of what the client UI shows/hides.
    if (plan.role === 'company' && (user.isTeamManaged || req.user.role === 'org_employee')) {
      return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
    }

    user.subscription = plan._id;
    user.subscriptionDetails = plan.toObject();
    user.subscriptionExpiry = expiryDate;
    if (autoRenew !== undefined) user.autoRenew = !!autoRenew;

    // Reset usage stats on new subscription
    user.downloadsUsed = 0;
    user.candidateDBExportsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;
    user.messagesUsed = 0;
    user.counsellingSessionsUsed = 0;

    await user.save();

    // This self-service (non-recurring) purchase path only updates the owner's own User doc.
    // For a company-tier plan, also sync the Company doc — team members resolve their effective
    // plan from Company.subscription (see authController.js), not the owner's User doc, so
    // without this a team member would never see a plan the owner just paid for.
    if (plan.role === 'company' && user.company) {
      await Company.findByIdAndUpdate(user.company, {
        subscription: plan._id,
        subscriptionExpiry: expiryDate
      }).catch(err => console.error('Company Subscription Sync Error:', err.message));
    }

    // Plan just changed (upgrade/downgrade) — trim any active team seats that now exceed
    // the new plan's limit. Upgrades are a no-op here since the count never exceeds a higher limit.
    await reconcileTeamSeats(user, plan).catch(err => console.error('Seat Reconciliation Error:', err.message));

    // Deactivate existing completed plans (supersede them)
    try {
      await Payment.updateMany(
        { user: req.user.id, status: 'completed' },
        { $set: { status: 'superseded' } }
      );
    } catch (deactivationErr) {
      console.error('Error deactivating old plans:', deactivationErr);
    }

    // Create payment record
    try {
      const gstPct = isFree ? 0 : await fetchGstPercentage();
      
      let baseAmt = 0;
      let appliedCouponId = null;
      if (!isFree) {
        baseAmt = getPricingOption(plan, quantity);
        if (couponCode) {
          const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
          if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
            const discountVal = (baseAmt * coupon.percentage) / 100;
            baseAmt = baseAmt - discountVal;
            appliedCouponId = coupon._id;
            
            // Increment coupon uses
            coupon.currentUses += 1;
            await coupon.save();
          }
        }
      }

      const gstAmt = isFree ? 0 : Math.round(baseAmt * gstPct) / 100;
      const totalAmt = baseAmt + gstAmt;

      const paymentRecord = new Payment({
        user: req.user.id,
        plan: plan._id,
        amount: totalAmt,
        baseAmount: baseAmt,
        gstPercentage: gstPct,
        gstAmount: gstAmt,
        quantity: isFree ? 1 : quantity,
        currency: plan.currency || 'INR',
        razorpay_order_id: razorpay_order_id || 'FREE_ORDER',
        razorpay_payment_id: razorpay_payment_id || 'FREE_PAYMENT',
        razorpay_signature: razorpay_signature || '',
        status: 'completed',
        paymentMethod: isFree ? 'None' : 'Razorpay',
        couponApplied: appliedCouponId
      });
      await paymentRecord.save();

      if (user.email && !isFree) {
        sendEmail({
          email: user.email,
          subject: `Payment Receipt — ${plan.name}`,
          html: emailWrapper('Payment Successful', `
            <p>Hi ${user.name || 'there'},</p>
            <p>Your payment for <strong>${plan.name}</strong> was successful.</p>
            <p>Amount Paid: <strong>Rs ${totalAmt.toLocaleString('en-IN')}</strong></p>
            <p>Valid Until: <strong>${plan.duration === 'Lifetime' ? 'Lifetime' : expiryDate.toLocaleDateString('en-IN')}</strong></p>
            <p>Payment ID: ${razorpay_payment_id || '—'}</p>
          `)
        }).catch(() => {});
      }
    } catch (paymentErr) {
      console.error('Error saving payment record:', paymentErr);
      // We don't return error here because the subscription was already updated
    }

    notifyRoles({
      io: req.io,
      roles: ['admin', 'subadmin'],
      title: 'Plan purchased',
      message: `${user.name || 'A user'} purchased the ${plan.name} plan.`,
      type: 'plan_purchased',
      link: '/admin/payment-history',
      metadata: { userId: user._id, planId: plan._id }
    }).catch(err => console.error('Plan purchase notification failed:', err.message));

    res.json({
      success: true, 
      msg: 'Payment verified and subscription updated',
      user: {
        subscription: plan,
        subscriptionExpiry: expiryDate
      }
    });
  } catch (err) {
    console.error('Verify Payment Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Create a recurring Razorpay subscription (mandate) for College/Company plans (spec 9.2)
// @route   POST /api/payments/create-subscription
const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, couponCode } = req.body;
    if (!planId) return res.status(400).json({ msg: 'planId is required' });

    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ msg: 'Subscription plan not found' });
    if (plan.price === 0) return res.status(400).json({ msg: 'Free plans do not require billing' });
    if (!RECURRING_ROLES.includes(plan.role)) {
      return res.status(400).json({ msg: 'Recurring subscriptions are only available for college and company plans' });
    }

    // Only the actual org owner may purchase a company-tier plan — same rule as the one-time
    // purchase path in verifyPayment.
    if (plan.role === 'company') {
      const requestingUser = await User.findById(req.user.id).select('isTeamManaged');
      if (requestingUser?.isTeamManaged || req.user.role === 'org_employee') {
        return res.status(403).json({ msg: 'Only your organization admin can change the organization plan.' });
      }
    }

    let baseAmount = plan.price;
    let discountPercentage = 0;
    let couponApplied = null;
    
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
        discountPercentage = coupon.percentage;
        couponApplied = coupon._id;
        const discountVal = (baseAmount * discountPercentage) / 100;
        baseAmount = baseAmount - discountVal;
      }
    }

    const gstPercentage = await fetchGstPercentage();
    const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
    const totalAmount = baseAmount + gstAmount;
    const amountInPaise = Math.round(totalAmount * 100);

    // Lazily create (and cache) the Razorpay recurring Plan backing this Subscription doc
    let razorpayPlanId = plan.razorpayPlanId;
    
    // If a coupon is applied, we must create a custom plan for this specific discounted price
    if (couponApplied || !razorpayPlanId) {
      const periodMap = {
        Monthly: { period: 'monthly', interval: 1 },
        Quarterly: { period: 'monthly', interval: 3 },
        Yearly: { period: 'yearly', interval: 1 }
      };
      const { period, interval } = periodMap[plan.duration] || { period: 'yearly', interval: 1 };

      const razorpayPlan = await razorpay.plans.create({
        period,
        interval,
        item: {
          name: `${plan.name} (${plan.role})`,
          amount: amountInPaise,
          currency: 'INR'
        }
      });
      razorpayPlanId = razorpayPlan.id;
      
      // Only cache the planId on the model if no coupon was applied
      if (!couponApplied) {
        plan.razorpayPlanId = razorpayPlanId;
        await plan.save();
      }
    }

    const totalCountMap = { Monthly: 240, Quarterly: 80, Yearly: 20 };
    const totalCount = totalCountMap[plan.duration] || 20;

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: totalCount,
      notes: { 
        planId: String(plan._id), 
        userId: String(req.user.id),
        couponCode: couponCode || ''
      }
    });

    res.json({
      subscriptionId: subscription.id,
      planId: plan._id,
      amount: amountInPaise,
      totalAmount,
      gstPercentage,
      gstAmount,
      discountPercentage,
      couponApplied,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Create Subscription Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Verify first charge of a recurring Razorpay subscription and complete registration (spec 8.7 / 9.2)
// @route   POST /api/payments/verify-subscription
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planId, couponCode } = req.body;
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !planId) {
      return res.status(400).json({ msg: 'Missing payment verification fields' });
    }

    const body = razorpay_payment_id + '|' + razorpay_subscription_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: 'Invalid payment signature' });
    }

    const plan = await Subscription.findById(planId);
    if (!plan) return res.status(404).json({ msg: 'Plan not found' });

    const nextRenewalDate = computeNextRenewalDate(plan.duration);

    const user = await User.findById(req.user.id);
    user.subscription = plan._id;
    user.subscriptionDetails = plan.toObject();
    user.subscriptionExpiry = nextRenewalDate;
    user.autoRenew = true;
    await user.save();

    await reconcileTeamSeats(user, plan).catch(err => console.error('Seat Reconciliation Error:', err.message));

    let record = null;

    if (plan.role === 'college') {
      const college = await College.findOne({ tpoUser: req.user.id })
        || (user.collegeProfile?.college && await College.findById(user.collegeProfile.college));

      if (college) {
        college.subscriptionTier = COLLEGE_TIER_MAP[plan.name] || college.subscriptionTier;
        college.subscription = plan._id;
        const studentLimitFeature = plan.features?.find(f => f.name === 'Student Capacity');
        if (studentLimitFeature) {
          college.studentLimit = studentLimitFeature.value > 0 ? studentLimitFeature.value : STUDENT_LIMIT_UNLIMITED;
        }
        college.razorpaySubscriptionId = razorpay_subscription_id;
        college.nextRenewalDate = nextRenewalDate;
        college.subscriptionExpiry = nextRenewalDate;
        college.autoRenewEnabled = true;
        college.renewalFailureCount = 0;

        // Automated MoU Generation is a Pro/Elite perk per the Campus plan matrix — checked
        // against the plan's own feature flag rather than a hardcoded tier list.
        const hasAutoMoU = plan.features?.find(f => f.name === 'Automated MoU Generation')?.isActive;
        if (hasAutoMoU) {
          try {
            const pdfBuffer = await generateMouPdf(college, plan);
            college.mouDocument = saveBufferToUploads(pdfBuffer, `mou-${college.code || 'campus'}`);
            college.mouSignedAt = new Date();
          } catch (mouErr) {
            console.error('MoU auto-generation failed:', mouErr.message);
          }
        }

        await college.save();
        record = college;
      }
    } else if (plan.role === 'company') {
      const company = user.company && await Company.findById(user.company);
      if (company) {
        company.subscription = plan._id;
        company.subscriptionExpiry = nextRenewalDate;
        company.nextRenewalDate = nextRenewalDate;
        company.razorpaySubscriptionId = razorpay_subscription_id;
        company.autoRenewEnabled = true;
        company.renewalFailureCount = 0;
        await company.save();
        record = company;
      }
    }

    try {
      let baseAmount = plan.price;
      let appliedCouponId = null;

      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (coupon && (coupon.totalUses === 0 || coupon.currentUses < coupon.totalUses)) {
          const discountVal = (baseAmount * coupon.percentage) / 100;
          baseAmount = baseAmount - discountVal;
          appliedCouponId = coupon._id;

          // Increment coupon uses
          coupon.currentUses += 1;
          await coupon.save();
        }
      }

      const gstPercentage = await fetchGstPercentage();
      const gstAmount = Math.round(baseAmount * gstPercentage) / 100;

      await Payment.create({
        user: req.user.id,
        plan: plan._id,
        amount: baseAmount + gstAmount,
        baseAmount: baseAmount,
        gstPercentage,
        gstAmount,
        quantity: 1,
        currency: plan.currency || 'INR',
        razorpay_order_id: razorpay_subscription_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        paymentMethod: 'Razorpay',
        couponApplied: appliedCouponId
      });
    } catch (paymentErr) {
      console.error('Error saving subscription payment record:', paymentErr.message);
    }

    notifyRoles({
      io: req.io,
      roles: ['admin', 'subadmin'],
      title: 'Plan purchased',
      message: `${record.name || 'An organization'} activated the ${plan.name} subscription.`,
      type: 'plan_purchased',
      link: '/admin/payment-history',
      metadata: { planId: plan._id, subscriberId: record._id }
    }).catch(err => console.error('Subscription notification failed:', err.message));

    res.json({ success: true, msg: 'Subscription active and registration completed', nextRenewalDate, record });
  } catch (err) {
    console.error('Verify Subscription Payment Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Get payment history for the logged-in user
// @route   GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('plan', 'name price duration')
      .populate('payPerFeature', 'name cost days usageCount')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get Payment History Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Get all payment history (Admin only)
// @route   GET /api/payments/admin/all
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email role')
      .populate('plan', 'name price duration')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    console.error('Get All Payments Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// @desc    Cancel current subscription and revert to free plan
// @route   POST /api/payments/cancel-plan
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    const userRole = user?.role?.name || 'jobseeker';

    const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: userRole });
    if (!freePlan) {
      return res.status(404).json({ msg: 'Free plan not found for this role' });
    }

    // Mark existing completed/active payments as cancelled
    await Payment.updateMany(
      { user: req.user.id, status: 'completed' },
      { $set: { status: 'cancelled' } }
    );

    // Downgrade to free plan
    user.subscription = freePlan._id;
    user.subscriptionDetails = freePlan.toObject();
    user.subscriptionExpiry = null;
    user.autoRenew = false;
    user.downloadsUsed = 0;
    user.searchUsed = 0;
    user.jobsUsed = 0;
    user.messagesUsed = 0;
    user.counsellingSessionsUsed = 0;
    await user.save();

    await reconcileTeamSeats(user, freePlan).catch(err => console.error('Seat Reconciliation Error:', err.message));

    res.json({ success: true, msg: 'Subscription cancelled. You are now on the Free plan.' });
  } catch (err) {
    console.error('Cancel Subscription Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getRenewals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const paidPlanIds = await Subscription.find({ price: { $gt: 0 } }).distinct('_id');
    const baseFilter = { subscription: { $in: paidPlanIds } };
    const filter = { ...baseFilter };

    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 86400000);
    if (status === 'expired') filter.subscriptionExpiry = { $lt: now };
    else if (status === 'expiring_soon') filter.subscriptionExpiry = { $gte: now, $lte: sevenDaysOut };
    else if (status === 'active') filter.subscriptionExpiry = { $gt: sevenDaysOut };

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingPlanIds = await Subscription.find({ name: regex }).distinct('_id');
      filter.$or = [{ name: regex }, { email: regex }, { subscription: { $in: matchingPlanIds } }];
    }

    const [renewals, total, activeCount, expiringCount, expiredCount, autoRenewCount] = await Promise.all([
      User.find(filter)
        .populate('subscription')
        .select('name email role subscription subscriptionExpiry autoRenew display_id')
        .sort({ subscriptionExpiry: 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(filter),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $gt: sevenDaysOut } }),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $gte: now, $lte: sevenDaysOut } }),
      User.countDocuments({ ...baseFilter, subscriptionExpiry: { $lt: now } }),
      User.countDocuments({ ...baseFilter, autoRenew: true })
    ]);

    res.json({
      renewals, total, page: parseInt(page), pages: Math.max(Math.ceil(total / parseInt(limit)), 1),
      stats: { active: activeCount, expiringSoon: expiringCount, expired: expiredCount, autoRenew: autoRenewCount }
    });
  } catch (err) {
    console.error('Get Renewals Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const requestRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findOne({ _id: paymentId, user: req.user.id });
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'completed') {
      return res.status(400).json({ msg: 'Only completed payments can be refunded' });
    }
    payment.status = 'refund_pending';
    await payment.save();
    notifyRoles({
      io: req.io,
      roles: ['admin', 'subadmin'],
      title: 'New refund request',
      message: `A refund was requested for payment ${payment._id}.`,
      type: 'refund_requested',
      link: '/admin/subscriptions/refunds',
      metadata: { paymentId: payment._id, userId: req.user.id }
    }).catch(err => console.error('Refund request notification failed:', err.message));
    res.json({ success: true, msg: 'Refund request submitted successfully' });
  } catch (err) {
    console.error('Request Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getRefunds = async (req, res) => {
  try {
    const payments = await Payment.find({ status: { $in: ['refund_pending', 'refunded'] } })
      .populate('user', 'name email role')
      .populate('plan', 'name price duration')
      .sort({ updatedAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error('Get Refunds Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const approveRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'refund_pending') {
      return res.status(400).json({ msg: 'Refund is not pending' });
    }

    payment.status = 'refunded';
    await payment.save();

    // Revoke the user's subscription
    const user = await User.findById(payment.user._id).populate('role');
    if (user) {
      const userRoleName = user.role?.name || 'jobseeker';
      const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: userRoleName });
      if (freePlan) {
        user.subscription = freePlan._id;
        user.subscriptionDetails = freePlan.toObject();
      } else {
        user.subscription = null;
        user.subscriptionDetails = null;
      }
      user.subscriptionExpiry = null;
      user.autoRenew = false;
      await user.save();

      if (freePlan) {
        await reconcileTeamSeats(user, freePlan).catch(err => console.error('Seat Reconciliation Error:', err.message));
      }
    }

    notifyUser({
      io: req.io,
      recipientId: payment.user._id,
      title: 'Refund approved',
      message: 'Your refund request was approved and your subscription was updated.',
      type: 'refund_status',
      link: paymentHistoryLink(user?.role?.name),
      metadata: { paymentId: payment._id, status: 'refunded' }
    }).catch(err => console.error('Refund approval notification failed:', err.message));

    res.json({ success: true, msg: 'Refund approved. Subscription revoked.' });
  } catch (err) {
    console.error('Approve Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const rejectRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId).populate({ path: 'user', populate: { path: 'role', select: 'name' } });
    if (!payment) {
      return res.status(404).json({ msg: 'Payment record not found' });
    }
    if (payment.status !== 'refund_pending') {
      return res.status(400).json({ msg: 'Refund is not pending' });
    }

    payment.status = 'completed';
    await payment.save();

    notifyUser({
      io: req.io,
      recipientId: payment.user,
      title: 'Refund request rejected',
      message: 'Your refund request was reviewed and rejected. The payment remains active.',
      type: 'refund_status',
      link: paymentHistoryLink(payment.user?.role?.name),
      metadata: { paymentId: payment._id, status: 'rejected' }
    }).catch(err => console.error('Refund rejection notification failed:', err.message));

    res.json({ success: true, msg: 'Refund request rejected' });
  } catch (err) {
    console.error('Reject Refund Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const pipeline = [
      { $match: { status: { $in: ['completed', 'superseded', 'refunded'] } } },
      // Sorted before $group so $first below reliably picks each buyer's most recent payment
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$user',
          totalSpent: { $sum: { $cond: [{ $in: ['$status', ['completed', 'superseded']] }, '$amount', 0] } },
          transactionsCount: { $sum: 1 },
          lastPurchase: { $first: '$$ROOT' }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $lookup: { from: 'roles', localField: 'user.role', foreignField: '_id', as: 'user.roleDoc' } },
      { $unwind: { path: '$user.roleDoc', preserveNullAndEmptyArrays: true } },
      { $addFields: { 'user.role': '$user.roleDoc.name' } },
      { $lookup: { from: 'subscriptions', localField: 'lastPurchase.plan', foreignField: '_id', as: 'lastPurchase.plan' } },
      { $unwind: { path: '$lastPurchase.plan', preserveNullAndEmptyArrays: true } }
    ];

    if (role && role !== 'all') {
      pipeline.push({ $match: { 'user.role': role === 'employer' ? { $in: ['recruiter', 'company'] } : role } });
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      pipeline.push({ $match: { $or: [{ 'user.name': regex }, { 'user.email': regex }, { 'user.display_id': regex }] } });
    }

    pipeline.push({
      $facet: {
        data: [
          { $sort: { 'lastPurchase.createdAt': -1 } },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          { $project: {
              _id: 0,
              user: { _id: 1, name: 1, email: 1, role: 1, avatar: 1, display_id: 1 },
              totalSpent: 1, transactionsCount: 1,
              lastPurchase: { _id: 1, createdAt: 1, paymentMethod: 1, razorpay_payment_id: 1, plan: { name: 1 } }
            }
          }
        ],
        summary: [{ $group: { _id: null, count: { $sum: 1 }, totalSpentAll: { $sum: '$totalSpent' } } }]
      }
    });

    const [result] = await Payment.aggregate(pipeline);
    const buyers = result.data;
    const total = result.summary[0]?.count || 0;
    const totalSpentAll = result.summary[0]?.totalSpentAll || 0;

    res.json({
      buyers, total, page: parseInt(page), pages: Math.max(Math.ceil(total / parseInt(limit)), 1),
      stats: { totalUniquePayers: total, totalSpentAll, avgOrderVal: total > 0 ? totalSpentAll / total : 0 }
    });
  } catch (err) {
    console.error('Get Buyers Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getBuyerDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('subscription')
      .select('name email role avatar display_id subscriptionExpiry autoRenew');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const payments = await Payment.find({ user: userId })
      .populate('plan')
      .sort({ createdAt: -1 });

    res.json({
      user,
      payments
    });
  } catch (err) {
    console.error('Get Buyer Details Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const sendRenewalReminder = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ msg: 'No users selected' });
    }

    const users = await User.find({ _id: { $in: userIds } }).populate('subscription');

    if (users.length === 0) {
      return res.status(404).json({ msg: 'Selected users not found' });
    }

    const emailPromises = users.map(async (user) => {
      const planName = user.subscription?.name || 'Premium';
      const expiryDate = user.subscriptionExpiry
        ? new Date(user.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'soon';

      if (user.email) {
        const htmlContent = `
          <div style="font-family: sans-serif; padding: 20px; color: #334155; line-height: 1.6;">
            <h2 style="color: #059669; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Subscription Renewal Reminder</h2>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>This is a friendly reminder that your active subscription plan <strong>${planName}</strong> is expiring on <strong>${expiryDate}</strong>.</p>
            <p>To continue enjoying uninterrupted access to premium resume templates, job search tools, bulk recruiter messaging, and other premium features, please renew your subscription package at your earliest convenience.</p>
            <p>If you have any questions or require support, please reply directly to this email.</p>
            <br/>
            <p>Warm regards,<br/><strong>Velaivaaipu Support Team</strong></p>
          </div>
        `;

        await sendEmail({
          email: user.email,
          subject: `[Velaivaaipu] Renew Your ${planName} Subscription`,
          html: htmlContent
        });
      }

      const userPhone = getUserPhone(user);
      if (userPhone) {
        sendWhatsAppTemplate({
          to: userPhone,
          template: 'auto_renewal_billing_reminder',
          params: [user.name || 'there', planName, expiryDate, planName, `${process.env.FRONTEND_URL}/jobseeker/settings`]
        }).catch(() => {});
      }
    });

    await Promise.all(emailPromises);

    res.json({ success: true, msg: `Sent reminders to ${users.length} users successfully.` });
  } catch (err) {
    console.error('Send Renewal Reminder Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Locates the College or Company doc holding this Razorpay subscription mandate
const findSubscriberBySubscriptionId = async (subscriptionId) => {
  const college = await College.findOne({ razorpaySubscriptionId: subscriptionId });
  if (college) return { subscriberModel: 'College', doc: college };
  const company = await Company.findOne({ razorpaySubscriptionId: subscriptionId });
  if (company) return { subscriberModel: 'Company', doc: company };
  return null;
};

const downgradeToFreePlan = async (subscriberModel, doc) => {
  const freePlan = await Subscription.findOne({ price: 0, isActive: true, role: subscriberModel === 'College' ? 'college' : 'company' });
  if (subscriberModel === 'College') {
    doc.subscriptionTier = 'campus_free';
    doc.studentLimit = 100; // matches the Campus Free plan's Student Capacity
  }
  if (freePlan) doc.subscription = freePlan._id;
  doc.autoRenewEnabled = false;
  doc.razorpaySubscriptionId = '';
  doc.nextRenewalDate = null;
};

// @desc    Razorpay recurring subscription webhook — success extends the period, repeated failure
//          auto-downgrades to the Free tier per spec 9.2 (graceful, not an abrupt cutoff)
// @route   POST /api/payments/razorpay/renewal-webhook
const handleRenewalWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) return res.status(400).send('Missing signature');

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(req.body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;
    const subscriptionEntity = payload.payload?.subscription?.entity;
    if (!subscriptionEntity) return res.json({ status: 'ignored' });

    const subscriptionId = subscriptionEntity.id;
    const found = await findSubscriberBySubscriptionId(subscriptionId);
    if (!found) {
      console.log(`[Webhook] No College/Company found for subscription ${subscriptionId}`);
      return res.json({ status: 'ok' });
    }

    const { subscriberModel, doc } = found;
    const plan = doc.subscription ? await Subscription.findById(doc.subscription) : null;
    const contactEmail = subscriberModel === 'College' ? doc.principalEmail : doc.admin_email;
    const notifyPhone = subscriberModel === 'College' ? null : null; // WhatsApp contact numbers aren't modeled on Company/College yet

    if (event === 'subscription.charged') {
      const paymentEntity = payload.payload?.payment?.entity;
      doc.nextRenewalDate = computeNextRenewalDate(plan?.duration || 'Yearly');
      doc.subscriptionExpiry = doc.nextRenewalDate;
      doc.renewalFailureCount = 0;
      await doc.save();

      await RenewalLog.create({
        subscriberModel,
        subscriber: doc._id,
        subscription: doc.subscription,
        razorpaySubscriptionId: subscriptionId,
        status: 'success',
        amount: paymentEntity ? paymentEntity.amount / 100 : 0
      });

      if (contactEmail) {
        sendEmail({
          email: contactEmail,
          subject: '[Velaivaaipu] Subscription renewed successfully',
          html: emailWrapper('Renewal Successful', `
            <p>Hi ${doc.principalName || doc.name || 'there'},</p>
            <p>Your subscription for <strong>${doc.name}</strong> was renewed successfully.</p>
            ${paymentEntity ? `<p>Amount Charged: <strong>Rs ${(paymentEntity.amount / 100).toLocaleString('en-IN')}</strong></p>` : ''}
            <p>Next Renewal Date: <strong>${doc.nextRenewalDate.toLocaleDateString('en-IN')}</strong></p>
          `)
        }).catch(() => {});
      }
      if (notifyPhone) sendWhatsAppMessage({ to: notifyPhone, template: 'renewal_success', variables: { name: doc.name } }).catch(() => {});
      console.log(`[Webhook] Subscription charged successfully for ${subscriptionId} (${subscriberModel} ${doc.name})`);
    } else if (event === 'subscription.halted' || event === 'subscription.pending') {
      doc.renewalFailureCount = (doc.renewalFailureCount || 0) + 1;

      await RenewalLog.create({
        subscriberModel,
        subscriber: doc._id,
        subscription: doc.subscription,
        razorpaySubscriptionId: subscriptionId,
        status: 'failed',
        failureReason: event,
        failureCountAtEvent: doc.renewalFailureCount
      });

      if (doc.renewalFailureCount >= MAX_RENEWAL_FAILURES && event === 'subscription.halted') {
        await downgradeToFreePlan(subscriberModel, doc);
        await doc.save();

        console.error(`[Webhook] ${subscriberModel} ${doc.name} downgraded to Free plan after ${MAX_RENEWAL_FAILURES} consecutive renewal failures — admin attention needed.`);
        if (contactEmail) {
          sendEmail({
            email: contactEmail,
            subject: '[Velaivaaipu] Your subscription has been downgraded to the Free plan',
            html: emailWrapper('Downgraded to Free Plan', `<p>We were unable to renew your subscription after ${MAX_RENEWAL_FAILURES} attempts, so your account has been moved to the Free plan. Please renew manually to restore full access.</p>`)
          }).catch(() => {});
        }
        triggerN8nWebhook('admin-subscription-alert', { subscriberModel, subscriberId: doc._id, name: doc.name, reason: 'max_renewal_failures' }).catch(() => {});
      } else {
        await doc.save();
        if (contactEmail) {
          sendEmail({
            email: contactEmail,
            subject: '[Velaivaaipu] Subscription renewal payment failed',
            html: emailWrapper('Renewal Payment Failed', `
              <p>Your latest renewal payment attempt failed (attempt ${doc.renewalFailureCount}/${MAX_RENEWAL_FAILURES}). Please update your payment method to avoid losing access.</p>
              <p><a href="${process.env.FRONTEND_URL}/${subscriberModel === 'College' ? 'college' : 'company'}/subscription" style="color:#059669;">Renew now</a></p>
            `)
          }).catch(() => {});
        }
        if (notifyPhone) sendWhatsAppMessage({ to: notifyPhone, template: 'renewal_failed', variables: { name: doc.name, attempt: doc.renewalFailureCount } }).catch(() => {});
      }

      console.log(`[Webhook] Subscription ${event} for ${subscriptionId} (${subscriberModel} ${doc.name}), failure count ${doc.renewalFailureCount}`);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(500).send('Webhook Error');
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getPaymentHistory,
  getAllPayments,
  cancelSubscription,
  getRenewals,
  requestRefund,
  getRefunds,
  approveRefund,
  rejectRefund,
  getBuyers,
  getBuyerDetails,
  sendRenewalReminder,
  handleRenewalWebhook
};
