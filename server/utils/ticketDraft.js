// AI-drafted ticket replies. The AI only writes text for a person to read, edit and send. Nothing is sent or saved here.
const clip = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

// No email, phone, name or payment ids go to the AI: only the type of problem and what the person wrote.
const buildMessages = (ticket = {}) => {
  const d = ticket.diagnostics || {};
  const facts = [
    ['Category', ticket.category], ['Severity', ticket.severity], ['Role', ticket.userRole],
    ['Plan affected', d.impactedPlan], ['Feature', d.gatedFeature], ['Error', d.errorType],
    ['Payment mode', d.paymentMode], ['Payment state', d.transactionState], ['Requested action', d.requestedAction],
    ['Part of the site', d.impactedSubsystem], ['Area', d.areaOfConcern], ['Details', d.detailedDescription], ['Action affected', d.systemActionImpacted],
  ].filter(([, v]) => v).map(([k, v]) => `${k}: ${clip(v, 400)}`).join('\n');
  return [
    { role: 'system', content: 'You write short, polite support replies for Velaivaaipu, a job portal in India. A staff member will read and edit your reply before sending. Write 3 to 6 plain sentences in simple English. Do not promise refunds, dates, prices or fixes. Do not invent facts. If something is unclear, ask one clear question. Do not include a greeting name or a signature.' },
    { role: 'user', content: `Write a reply to this support ticket.\n${facts || 'No details given.'}` },
  ];
};

const cleanDraft = (text) => String(text || '').replace(/\r/g, '').trim().slice(0, 1500);
module.exports = { buildMessages, cleanDraft };
