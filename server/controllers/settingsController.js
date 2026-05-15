const Settings = require('../models/Settings');

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) {
      settings = await Settings.create({ key: 'global', gstPercentage: 0 });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { gstPercentage } = req.body;
    if (gstPercentage === undefined || gstPercentage < 0 || gstPercentage > 100) {
      return res.status(400).json({ msg: 'gstPercentage must be between 0 and 100' });
    }
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { gstPercentage },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getSettings, updateSettings };
