const College = require('../models/College');

// @route   PUT /api/college/admin/colleges/:collegeId/test
// Marks a college as a test or demo college (or back to real). Nothing is deleted.
const setCollegeTestFlag = async (req, res) => {
  try {
    const { collegeId } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(String(collegeId))) return res.status(400).json({ msg: 'Invalid college id' });
    if (typeof req.body?.isTest !== 'boolean') return res.status(400).json({ msg: 'isTest must be true or false' });
    const college = await College.findByIdAndUpdate(collegeId, { $set: { isTest: req.body.isTest } }, { new: true }).select('name code isTest');
    if (!college) return res.status(404).json({ msg: 'College not found' });
    res.json({ msg: req.body.isTest ? 'Marked as test college' : 'Marked as real college', college });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

module.exports = { setCollegeTestFlag };
