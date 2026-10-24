// Checks the DNS side of mail deliverability for a domain. Read-only, makes DNS lookups only.
// Usage: node scripts/checkMailDns.js [domain] [dkimSelector ...]
//   node scripts/checkMailDns.js velaivaaipu.in brevo1._domainkey brevo2._domainkey
// Pass the DKIM names your sending service gave you; without any, DKIM is skipped.
const dns = require('dns').promises;

const domain = process.argv[2] || 'velaivaaipu.in';
const dkimNames = process.argv.slice(3);
const SERVICE_INCLUDES = ['spf.brevo.com', 'amazonses.com'];
let problems = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const bad = (m) => { problems += 1; console.log(`  FAIL  ${m}`); };
const warn = (m) => console.log(`  WARN  ${m}`);
const txt = async (name) => {
  try { return (await dns.resolveTxt(name)).map((parts) => parts.join('')); } catch { return []; }
};

(async () => {
  console.log(`Mail DNS check for ${domain}\n`);

  console.log('MX');
  try {
    const mx = await dns.resolveMx(domain);
    mx.length ? ok(mx.map((m) => m.exchange).join(', ')) : bad('no MX records, replies to hello@ will not arrive');
  } catch { bad('no MX records, replies to hello@ will not arrive'); }

  console.log('SPF');
  const spf = (await txt(domain)).filter((r) => r.startsWith('v=spf1'));
  if (spf.length === 0) bad('no SPF record');
  else if (spf.length > 1) bad(`${spf.length} SPF records found; there must be exactly ONE (merge them)`);
  else {
    ok(spf[0]);
    if (!spf[0].includes('hostinger')) warn('Hostinger is not in the SPF record (needed if you still send from it)');
    SERVICE_INCLUDES.some((s) => spf[0].includes(s)) ? ok('sending service is included') : bad('the sending service (Brevo/SES) is not in SPF yet');
    if (/\s\+all|\s\?all/.test(spf[0])) bad('SPF ends in +all or ?all, which allows anyone to send');
  }

  console.log('DKIM');
  if (dkimNames.length === 0) warn('no DKIM names given, skipped');
  for (const name of dkimNames) {
    const fqdn = `${name}.${domain}`;
    let found = (await txt(fqdn)).some((r) => r.includes('p='));
    if (!found) { try { found = (await dns.resolveCname(fqdn)).length > 0; } catch { /* none */ } }
    found ? ok(fqdn) : bad(`${fqdn} not found (not added yet, or still propagating)`);
  }

  console.log('DMARC');
  const dmarc = (await txt(`_dmarc.${domain}`)).filter((r) => r.startsWith('v=DMARC1'));
  if (dmarc.length === 0) bad('no DMARC record');
  else {
    ok(dmarc[0]);
    if (!/rua=mailto:/.test(dmarc[0])) warn('no rua= address, so you receive no DMARC reports');
    const p = (dmarc[0].match(/\bp=(\w+)/) || [])[1];
    if (p === 'none') warn('policy is none (correct for the first 2 weeks; move to quarantine after clean reports)');
  }

  console.log(problems ? `\n${problems} problem(s) to fix.` : '\nAll checks passed.');
  process.exit(problems ? 1 : 0);
})();
