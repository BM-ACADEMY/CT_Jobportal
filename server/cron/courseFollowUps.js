const CollegeStudent = require('../models/CollegeStudent');
const { sendWhatsAppTemplate } = require('../utils/whatsapp');
const { getCategory, offerText, isSendWindow } = require('../config/courseMap');

const DELAY_MINUTES = Number(process.env.WHATSAPP_FOLLOWUP_DELAY_MIN || 30);
const BATCH = 40;

// One WhatsApp message to students who opted in and scored below the pass mark.
// Off unless WHATSAPP_FOLLOWUP_ENABLED=true AND the Meta template is approved.
const runCourseFollowUps = async () => {
  if (process.env.WHATSAPP_FOLLOWUP_ENABLED !== 'true') return;
  const template = process.env.WA_TEMPLATE_COURSE_FOLLOWUP;
  const link = process.env.COURSE_PAGE_URL;
  if (!template || !link || !isSendWindow()) return;

  try {
    const due = await CollegeStudent.find({
      'followUp.status': 'queued',
      'followUp.queuedAt': { $lte: new Date(Date.now() - DELAY_MINUTES * 60 * 1000) },
    }).populate('user', 'name').limit(BATCH);

    for (const s of due) {
      const cat = getCategory(s.followUp.category);
      if (!s.whatsappConsent?.given || s.whatsappOptOut || !cat || !s.whatsappNumber) {
        s.followUp.status = 'skipped';
        await s.save();
        continue;
      }
      const r = await sendWhatsAppTemplate({
        to: s.whatsappNumber,
        template,
        params: [s.user?.name || 'there', cat.label, cat.course, offerText(), link],
      });
      s.followUp.status = r.ok ? 'sent' : 'failed';
      s.followUp.sentAt = new Date();
      await s.save();
    }
  } catch (err) {
    console.error('[Cron] Course follow-ups failed:', err.message);
  }
};

module.exports = runCourseFollowUps;
