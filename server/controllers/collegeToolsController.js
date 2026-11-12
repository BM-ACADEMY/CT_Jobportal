// Endpoints for college tools: milestones, send-to-principal, one-page PDF, what-you-get.
// Models are required lazily so this file loads in tests.
const tools = require('../utils/collegeTools');

const collegeFor = async (req) => require('./collegeController').getCollegeForTPO(req.user.id);
const fail = (res, err) => {
  if (err && String(err.message).startsWith('NO_COLLEGE')) return res.status(404).json({ msg: 'No college linked to your account' });
  console.error('College tools error:', err && err.message);
  return res.status(500).json({ msg: 'Server Error' });
};

// GET /api/college/milestones
const getMilestones = async (req, res) => {
  try {
    const college = await collegeFor(req);
    const stats = await tools.computeCollegeStats(college);
    const studentCount = await require('../models/CollegeStudent').countDocuments({ college: college._id });
    res.json(tools.computeMilestones({ driveCount: stats.driveCount, studentCount, offerCount: stats.offerCount }));
  } catch (err) { fail(res, err); }
};

// POST /api/college/reports/send-to-principal  (manual one-tap; needs a stored principal email)
const sendReportToPrincipal = async (req, res) => {
  try {
    const college = await collegeFor(req);
    const r = await tools.sendPrincipalSummary(college, {
      sendEmailFn: require('../utils/sendEmail'),
      wrap: require('../utils/emailTemplates').emailWrapper,
    });
    if (!r.sent && r.reason === 'NO_PRINCIPAL_EMAIL') return res.status(400).json({ msg: 'Add the principal email in Settings first.' });
    if (!r.sent) return res.status(502).json({ msg: 'Could not send the email right now. Please try again.' });
    college.principalReportLastSentAt = new Date();
    await college.save();
    res.json({ msg: `Report sent to ${r.to}` });
  } catch (err) { fail(res, err); }
};

// GET /api/college/reports/one-page-pdf
const downloadOnePagePdf = async (req, res) => {
  try {
    const college = await collegeFor(req);
    const stats = await tools.computeCollegeStats(college);
    const pdf = await tools.generateOnePagePdf(college, stats);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="placement-summary.pdf"');
    res.send(pdf);
  } catch (err) { fail(res, err); }
};

// GET /api/college/what-you-get  (read-only view of existing plan config)
const getWhatYouGet = async (req, res) => {
  try {
    const college = await collegeFor(req);
    const plans = await require('../models/Subscription').find({ role: 'college', isActive: true }).lean();
    res.json(tools.summarizeFeatures(plans, college.subscriptionTier));
  } catch (err) { fail(res, err); }
};

module.exports = { getMilestones, sendReportToPrincipal, downloadOnePagePdf, getWhatYouGet };
