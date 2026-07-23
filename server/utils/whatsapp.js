/**
 * Direct Meta WhatsApp Cloud API client for outbound template messages.
 * Every send is template-based because Meta only allows business-initiated
 * messages via pre-approved templates outside the 24h customer-service window.
 */

const GRAPH_VERSION = 'v21.0';

const normalizePhone = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`; // default +91 (India) when no country code present
  return digits;
};

// Confirmed via live test against Meta: the approved templates are registered under 'en',
// not 'en_US' (en_US previously failed with error 132001 "template does not exist in the translation").
const sendWhatsAppTemplate = async ({ to, template, params = [], languageCode = 'en' }) => {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const toNumber = normalizePhone(to);
  if (!toNumber) return { skipped: true, reason: 'no_phone' };
  if (!phoneNumberId || !token) {
    console.log(`[WhatsApp] Not configured, skipping template "${template}" to ${toNumber}`);
    return { skipped: true, reason: 'not_configured' };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'template',
        template: {
          name: template,
          language: { code: languageCode },
          components: params.length
            ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: String(p ?? '') })) }]
            : []
        }
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[WhatsApp] Template "${template}" to ${toNumber} failed:`, JSON.stringify(data));
      return { ok: false, error: data };
    }
    return { ok: true, data };
  } catch (err) {
    console.error(`[WhatsApp] Template "${template}" send error:`, err.message);
    return { ok: false, error: err.message };
  }
};

// User has no top-level `phone` field — only role-specific sub-objects carry one
// (profile.phone for jobseekers, recruiterProfile.phone / companyProfile.phone for
// recruiters and company owners). Only one is ever populated per account, so chaining
// all three is safe regardless of the caller's role.
const getUserPhone = (user) => user?.profile?.phone || user?.recruiterProfile?.phone || user?.companyProfile?.phone || '';

module.exports = { sendWhatsAppTemplate, normalizePhone, getUserPhone };
