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

const { isConnectionFailure } = require('../../utils/sendEmail');

test('mail connections give up quickly instead of hanging for minutes', () => {
  for (const env of [{ EMAIL_HOST: 'smtp.gmail.com' }, { EMAIL_HOST: 'smtp.hostinger.com' }]) {
    const cfg = buildTransportConfig(env);
    assert.equal(cfg.connectionTimeout, 8000);
    assert.equal(cfg.greetingTimeout, 8000);
    assert.equal(cfg.socketTimeout, 15000);
  }
  assert.equal(buildTransportConfig({ EMAIL_HOST: 'x', SMTP_CONNECT_TIMEOUT_MS: '3000' }).connectionTimeout, 3000);
});

test('only a failed connection is retried, never a message the server may already have accepted', () => {
  assert.equal(isConnectionFailure({ code: 'ECONNECTION' }), true);
  assert.equal(isConnectionFailure({ code: 'ECONNREFUSED' }), true);
  assert.equal(isConnectionFailure({ code: 'ETIMEDOUT', command: 'CONN' }), true);
  assert.equal(isConnectionFailure({ code: 'ETIMEDOUT', command: 'DATA' }), false);
  assert.equal(isConnectionFailure({ code: 'ESOCKET' }), false);
  assert.equal(isConnectionFailure({ code: 'EAUTH' }), false);
  assert.equal(isConnectionFailure(null), false);
});
