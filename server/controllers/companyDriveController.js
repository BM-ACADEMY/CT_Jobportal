const CampusDrive = require('../models/CampusDrive');
const College = require('../models/College');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');

const FRONTEND_URL = process.env.FRONTEND_URL;

// @desc    List campus drive participation requests sent to the calling company owner
// @route   GET /api/company/drive-requests
const getIncomingDriveRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('company');
    if (!user?.company) return res.json([]);

    const drives = await CampusDrive.find({ 'companies.company': user.company })
      .populate('college', 'name logo code')
      .sort({ createdAt: -1 });

    const requests = [];
    drives.forEach(drive => {
      drive.companies
        .filter(c => c.company && c.company.toString() === String(user.company))
        .forEach(c => {
          requests.push({
            driveId: drive._id,
            driveTitle: drive.title,
            batchYear: drive.batchYear,
            collegeName: drive.college?.name || '—',
            collegeLogo: drive.college?.logo || '',
            companyEntryId: c._id,
            requestStatus: c.requestStatus,
            requestedAt: c.requestedAt,
            respondedAt: c.respondedAt,
            conversation: c.conversation
          });
        });
    });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Accept or reject a campus drive participation request. On reject, `note` is an
//          optional message the company can choose to leave for the college — entirely up
//          to them to fill in or skip — delivered as a platform chat message, not email/WhatsApp.
// @route   POST /api/company/drive-requests/:driveId/:companyEntryId/respond
const respondToDriveRequest = async (req, res) => {
  try {
    const { action, note } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ msg: 'action must be accept or reject' });
    }

    const user = await User.findById(req.user.id).select('company name');
    if (!user?.company) return res.status(400).json({ msg: 'No company linked to this account' });

    const drive = await CampusDrive.findById(req.params.driveId).populate('college');
    if (!drive) return res.status(404).json({ msg: 'Drive not found' });

    const entry = drive.companies.id(req.params.companyEntryId);
    if (!entry) return res.status(404).json({ msg: 'Request not found' });
    if (!entry.company || entry.company.toString() !== String(user.company)) {
      return res.status(403).json({ msg: 'Not authorized to respond to this request' });
    }

    entry.requestStatus = action === 'accept' ? 'accepted' : 'rejected';
    entry.respondedAt = new Date();
    entry.respondedBy = req.user.id;
    await drive.save();

    const trimmedNote = (note || '').trim();
    if (action === 'reject' && trimmedNote && entry.conversation) {
      const chatMessage = new Message({ conversation: entry.conversation, sender: req.user.id, content: trimmedNote });
      await chatMessage.save();
      await Conversation.findByIdAndUpdate(entry.conversation, { lastMessage: chatMessage._id, updatedAt: Date.now() });
    }

    const college = drive.college;
    const tpo = college?.tpoUser ? await User.findById(college.tpoUser).select('name email profile.phone') : null;
    const recipientEmail = college?.principalEmail || tpo?.email;
    const approved = action === 'accept';
    const notesText = approved
      ? `${user.name || 'The company'} has accepted your invite for ${drive.title}.`
      : `${user.name || 'The company'} has declined your invite for ${drive.title}.`;

    if (recipientEmail) {
      sendEmail({
        email: recipientEmail,
        subject: `[Velaivaaipu] ${user.name || 'A company'} has ${approved ? 'accepted' : 'declined'} your drive invite`,
        html: emailWrapper('Campus Drive Response', `
          <p>Hi ${tpo?.name || college?.principalName || 'there'},</p>
          <p>${notesText}</p>
        `)
      }).catch(() => {});
    }

    const collegePhone = college?.collegePhone || getUserPhone(tpo);
    if (collegePhone) {
      sendWhatsAppTemplate({
        to: collegePhone,
        template: 'verification_approval_notification',
        params: [
          tpo?.name || college?.principalName || 'there',
          `${user.name || 'Company'} — Campus Drive Invite (${drive.title})`,
          approved ? 'Approved' : 'Rejected',
          notesText,
          `${FRONTEND_URL}/college/drives`
        ]
      }).catch(() => {});
    }

    res.json({ msg: 'Response recorded', company: entry });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

module.exports = { getIncomingDriveRequests, respondToDriveRequest };
