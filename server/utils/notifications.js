/**
 * Thin wrapper around an n8n webhook for outbound WhatsApp messages.
 * n8n owns the actual WhatsApp Business API/provider integration (per spec 8.3/8.6/9.2) —
 * this repo only needs to POST the message intent to the configured webhook.
 * If no webhook URL is configured (e.g. local dev), calls are logged and skipped instead of throwing.
 */

const triggerN8nWebhook = async (webhookPath, payload) => {
  const baseUrl = process.env.N8N_BASE_URL;
  if (!baseUrl) {
    console.log(`[n8n] N8N_BASE_URL not configured, skipping webhook "${webhookPath}"`, payload);
    return { skipped: true };
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/${webhookPath.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error(`[n8n] Webhook "${webhookPath}" responded with status ${res.status}`);
      return { skipped: false, ok: false };
    }
    return { skipped: false, ok: true };
  } catch (err) {
    console.error(`[n8n] Webhook "${webhookPath}" call failed:`, err.message);
    return { skipped: false, ok: false, error: err.message };
  }
};

const sendWhatsAppMessage = async ({ to, template, variables = {}, message }) => {
  if (!to) return { skipped: true };
  return triggerN8nWebhook('whatsapp-send', { to, template, variables, message });
};

module.exports = { triggerN8nWebhook, sendWhatsAppMessage };
