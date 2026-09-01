const Razorpay = require('razorpay');

let _razorpay = null;

function getRazorpay() {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error('Razorpay keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not set in .env');
    }
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

module.exports = getRazorpay;
