const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({
        key: 'global',
        gstPercentage: 18,
        gstNumber: '33AAECV1209F1Z4',
        address: '12, MG Road, Shastri Nagar, Adyar, Chennai, Tamil Nadu',
        pincode: '600020',
        email: 'support@velaivaaipu.com',
        phone: '+91 44 1234 5678',
        billingName: 'Velaivaaipu Tech Private Limited'
      });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { gstPercentage, gstNumber, address, pincode, email, phone, billingName } = req.body;
    if (gstPercentage !== undefined && (gstPercentage < 0 || gstPercentage > 100)) {
      return res.status(400).json({ msg: 'gstPercentage must be between 0 and 100' });
    }
    
    const updateData = {};
    if (gstPercentage !== undefined) updateData.gstPercentage = gstPercentage;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (billingName !== undefined) updateData.billingName = billingName;

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      updateData,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getSettings, updateSettings };
