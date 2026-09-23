const Settings = require('../models/Settings');

const fetchGstPercentage = async () => {
  const settings = await Settings.findOne({ key: 'global' });
  return settings?.gstPercentage || 0;
};

// Price for `quantity` units of a plan or pay-per feature (the base price is `price` on a plan and
// `cost` on a feature): an admin-configured pricing option if there is one, else the per-unit price
// less a volume discount.
const getPricingOption = (item, quantity) => {
  if (item.pricingOptions && item.pricingOptions.length > 0) {
    const opt = item.pricingOptions.find(o => o.quantity === quantity);
    if (opt) {
      return opt.price;
    }
  }

  // Default fallback calculation:
  const basePerUnit = item.price || item.cost || 0;
  const baseTotal = basePerUnit * quantity;
  let discountPercentage = 0;
  if (quantity >= 12) discountPercentage = 20;
  else if (quantity >= 6) discountPercentage = 10;
  else if (quantity >= 3) discountPercentage = 5;
  const discountAmount = Math.round(baseTotal * discountPercentage) / 100;
  return baseTotal - discountAmount;
};

// When a one-time plan bought for `quantity` billing periods runs out.
const computeExpiry = (plan, quantity) => {
  const expiryDate = new Date();
  if (plan.duration === 'Monthly') {
    expiryDate.setMonth(expiryDate.getMonth() + quantity);
  } else if (plan.duration === 'Quarterly') {
    expiryDate.setMonth(expiryDate.getMonth() + (3 * quantity));
  } else if (plan.duration === 'Yearly') {
    expiryDate.setFullYear(expiryDate.getFullYear() + quantity);
  } else if (plan.duration === 'Lifetime') {
    expiryDate.setFullYear(expiryDate.getFullYear() + 100);
  }
  return expiryDate;
};

// Next charge date of a recurring (auto-renewing) plan.
const computeNextRenewalDate = (duration, from = new Date()) => {
  const d = new Date(from);
  if (duration === 'Monthly') d.setMonth(d.getMonth() + 1);
  else if (duration === 'Quarterly') d.setMonth(d.getMonth() + 3);
  else if (duration === 'Yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setFullYear(d.getFullYear() + 100);
  return d;
};

module.exports = { fetchGstPercentage, getPricingOption, computeExpiry, computeNextRenewalDate };
