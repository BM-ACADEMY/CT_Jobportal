const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTransportConfig } = require('../../utils/sendEmail');

test('relay SMTP verifies the TLS certificate by default', () => {
  const cfg = buildTransportConfig({ EMAIL_HOST: 'smtp-relay.brevo.com', EMAIL_PORT: '587', USER_EMAIL: 'u', USER_PASS: 'p' });
  assert.equal(cfg.tls.rejectUnauthorized, true);
  assert.equal(cfg.port, 587);
  assert.equal(cfg.secure, false);
});

test('port 465 uses implicit TLS', () => {
  const cfg = buildTransportConfig({ EMAIL_HOST: 'smtp.hostinger.com', EMAIL_PORT: '465' });
  assert.equal(cfg.secure, true);
  assert.equal(cfg.tls.rejectUnauthorized, true);
});

test('SMTP_TLS_INSECURE=true is the only way to skip the certificate check', () => {
  assert.equal(buildTransportConfig({ EMAIL_HOST: 'x', SMTP_TLS_INSECURE: 'true' }).tls.rejectUnauthorized, false);
  assert.equal(buildTransportConfig({ EMAIL_HOST: 'x', SMTP_TLS_INSECURE: 'false' }).tls.rejectUnauthorized, true);
});

test('gmail host keeps the gmail service config', () => {
  assert.equal(buildTransportConfig({ EMAIL_HOST: 'smtp.gmail.com' }).service, 'gmail');
});
