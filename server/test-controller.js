const mongoose = require('mongoose');
const PayPerFeature = require('./models/PayPerFeature');
const Settings = require('./models/Settings');
const razorpay = require('./config/razorpay');

const fetchGstPercentage = async () => {
  const settings = await Settings.findOne({ key: 'global' });
  return settings?.gstPercentage || 0;
};

const getPricingOption = (feature, quantity) => {
  if (feature.pricingOptions && feature.pricingOptions.length > 0) {
    const opt = feature.pricingOptions.find(o => o.quantity === quantity);
    if (opt) {
      return opt.price;
    }
  }
  const basePerUnit = feature.cost || 0;
  const baseTotal = basePerUnit * quantity;
  let discountPercentage = 0;
  if (quantity >= 12) discountPercentage = 20;
  else if (quantity >= 6) discountPercentage = 10;
  else if (quantity >= 3) discountPercentage = 5;
  const discountAmount = Math.round(baseTotal * discountPercentage) / 100;
  return baseTotal - discountAmount;
};

async function test() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const feature = await PayPerFeature.findOne({ isActive: true });
  if (!feature) {
    console.log('No active feature found');
    process.exit(1);
  }
  console.log('Found feature:', feature.name, feature._id);

  const quantity = 3;
  const baseAmount = getPricingOption(feature, quantity);
  console.log('baseAmount:', baseAmount);

  const gstPercentage = await fetchGstPercentage();
  const gstAmount = Math.round(baseAmount * gstPercentage) / 100;
  const totalAmount = baseAmount + gstAmount;
  const amountInPaise = Math.round(totalAmount * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `payper_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log('ORDER SUCCESS:', order);
  } catch (err) {
    console.error('ORDER ERROR:', err);
  }
  process.exit(0);
}

test();
