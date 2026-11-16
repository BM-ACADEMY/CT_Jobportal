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

const { buildBackupConfig } = require('../../utils/sendEmail');

test('the backup sender is off unless host and user are set', () => {
  assert.equal(buildBackupConfig({}), null);
  assert.equal(buildBackupConfig({ BACKUP_EMAIL_HOST: 'smtp.hostinger.com' }), null);
});

test('the backup sender uses its own host, port and login, not the main ones', () => {
  const cfg = buildBackupConfig({ EMAIL_HOST: 'smtp-relay.brevo.com', EMAIL_PORT: '587', USER_EMAIL: 'main', USER_PASS: 'm',
    BACKUP_EMAIL_HOST: 'smtp.hostinger.com', BACKUP_EMAIL_PORT: '465', BACKUP_USER_EMAIL: 'hello@velaivaaipu.in', BACKUP_USER_PASS: 'b' });
  assert.equal(cfg.host, 'smtp.hostinger.com');
  assert.equal(cfg.port, 465);
  assert.equal(cfg.secure, true);
  assert.deepEqual(cfg.auth, { user: 'hello@velaivaaipu.in', pass: 'b' });
  assert.equal(cfg.tls.rejectUnauthorized, true);
});

test('a failed main send goes out once through the backup (sendEmail wiring)', async () => {
  const Module = require('module');
  const sent = { main: 0, backup: [] };
  const real = Module._load;
  Module._load = function (request, ...rest) {
    if (request === 'nodemailer') {
      return { createTransport: (cfg) => ({ sendMail: async (m) => {
        if (cfg.host === 'smtp.hostinger.com') { sent.backup.push(m); return { messageId: 'b1' }; }
        sent.main++; const e = new Error('refused'); e.code = 'EAUTH'; throw e;
      } }) };
    }
    return real.call(this, request, ...rest);
  };
  const saved = { ...process.env };
  Object.assign(process.env, { EMAIL_HOST: 'smtp-relay.brevo.com', EMAIL_PORT: '587', USER_EMAIL: 'x', USER_PASS: 'y', MAIL_FROM: '"V" <hello@velaivaaipu.in>',
    BACKUP_EMAIL_HOST: 'smtp.hostinger.com', BACKUP_EMAIL_PORT: '465', BACKUP_USER_EMAIL: 'hello@velaivaaipu.in', BACKUP_USER_PASS: 'z' });
  delete require.cache[require.resolve('../../utils/sendEmail')];
  try {
    const send = require('../../utils/sendEmail');
    assert.equal(await send({ email: 'a@gmail.com', subject: 's', html: 'h' }), true);
    assert.equal(sent.main, 1);
    assert.equal(sent.backup.length, 1);
    assert.equal(sent.backup[0].to, 'a@gmail.com');
    assert.match(sent.backup[0].from, /hello@velaivaaipu\.in/);
  } finally {
    Module._load = real;
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
    Object.assign(process.env, saved);
    delete require.cache[require.resolve('../../utils/sendEmail')];
  }
});
