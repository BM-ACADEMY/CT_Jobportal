require('dotenv').config();
const { sendWhatsAppTemplate } = require('../utils/whatsapp');

// Usage: node scratch/test_whatsapp.js <phone> [templateName] [param1,param2,...]
const [, , phone, templateName, paramsArg] = process.argv;

if (!phone) {
  console.error('Usage: node scratch/test_whatsapp.js <phone> [templateName] [param1,param2,...]');
  process.exit(1);
}

const template = templateName || 'verification_approval_notification';
const params = paramsArg
  ? paramsArg.split(',')
  : ['Test User', 'Test Item', 'Approved', 'N/A', 'https://example.com'];

console.log(`Sending "${template}" to ${phone} with params:`, params);

sendWhatsAppTemplate({ to: phone, template, params })
  .then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(result?.ok ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
