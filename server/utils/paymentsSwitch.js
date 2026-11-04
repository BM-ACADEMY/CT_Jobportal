// Master switch for taking money. OFF until PAYMENTS_ENABLED=true is set on the server (after Razorpay
// approves the live account). While off: paid plans and pay-per add-ons cannot be ordered (503), the
// plan pages show "opening soon" instead of a pay button, and free plans can still be chosen.
const paymentsOpen = () => process.env.PAYMENTS_ENABLED === 'true';

const PAYMENTS_CLOSED_MSG = 'Online payments are not open yet. Free plans can still be chosen; paid plans open soon.';

// Express middleware form, for the order-creation routes.
const requirePaymentsOpen = (req, res, next) => {
  if (!paymentsOpen()) return res.status(503).json({ msg: PAYMENTS_CLOSED_MSG, paymentsEnabled: false });
  next();
};

module.exports = { paymentsOpen, requirePaymentsOpen, PAYMENTS_CLOSED_MSG };
