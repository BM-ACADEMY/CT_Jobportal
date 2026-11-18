const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const u = require('../utils/jobFairs');
const read = (p) => fs.readFileSync(require.resolve(p), 'utf8');
const good = { title: 'Mega Private Job Camp', kind: 'government', organiserName: 'District Employment Office, Villupuram', date: '2026-12-05', officialUrl: 'https://example.gov.in/camp', venue: { city: 'Villupuram' }, documents: 'Resume, Aadhaar copy' };

test('a government fair needs a title, a date, the department and an official https link', () => {
  assert.ok(u.cleanFairInput(good).data);
  assert.ok(u.cleanFairInput({ ...good, title: 'Fair' }).error);
  assert.ok(u.cleanFairInput({ ...good, date: 'nope' }).error);
  assert.ok(u.cleanFairInput({ ...good, officialUrl: '' }).error);
  assert.ok(u.cleanFairInput({ ...good, officialUrl: 'http://example.gov.in' }).error);
  assert.ok(u.cleanFairInput({ ...good, officialUrl: 'javascript:alert(1)' }).error);
  assert.ok(u.cleanFairInput({ ...good, organiserName: '' }).error);
  assert.ok(u.cleanFairInput({ ...good, endDate: '2026-12-01' }).error);
});
test('our own fair does not need an official link; documents become a clean list', () => {
  const r = u.cleanFairInput({ ...good, kind: 'own', officialUrl: '', organiserName: '' });
  assert.ok(r.data);
  assert.deepStrictEqual(u.cleanFairInput(good).data.documents, ['Resume', 'Aadhaar copy']);
});
test('only live fairs that are not over are upcoming', () => {
  const now = new Date('2026-12-05T10:00:00+05:30');
  assert.strictEqual(u.isUpcoming({ status: 'published', date: new Date('2026-12-05T04:00:00+05:30') }, now), true);
  assert.strictEqual(u.isUpcoming({ status: 'published', date: new Date('2026-12-04T10:00:00+05:30') }, now), false);
  assert.strictEqual(u.isUpcoming({ status: 'draft', date: new Date('2026-12-20') }, now), false);
  assert.strictEqual(u.isUpcoming({ status: 'published', date: new Date('2026-12-01'), endDate: new Date('2026-12-06') }, now), true);
});
test('poster card has our name and the organiser, never says the government endorses us, and escapes text', () => {
  const svg = u.fairCardSvg({ ...good, date: new Date('2026-12-05'), title: 'Camp <script>', venue: { name: 'Hall', city: 'Villupuram' }, documents: ['Resume'], supportedByUs: true });
  assert.match(svg, /Supported by Velaivaaipu/);
  assert.match(svg, /Organised by District Employment Office/);
  assert.ok(!/<script>/.test(svg));
  assert.ok(!/endorse|approved by|official partner/i.test(svg));
  const plain = u.fairCardSvg({ ...good, date: new Date('2026-12-05'), venue: {}, supportedByUs: false });
  assert.ok(!/Supported by/.test(plain));
});
test('public shape leaves out admin fields', () => {
  const p = u.publicFair({ ...good, slug: 's', status: 'published', createdBy: 'x', supportedByUs: true, _id: 'id' }, { going: 3 });
  assert.strictEqual(p.going, 3);
  assert.ok(!('createdBy' in p) && !('status' in p) && !('_id' in p));
});
test('routes: admin paths are admin only, going needs sign-in, nothing touches money', () => {
  const r = read('../routes/jobFairs.js');
  assert.match(r, /'\/admin\/all', verifyToken, authorizeRoles\('admin'\)/);
  assert.match(r, /router\.post\('\/admin', verifyToken, authorizeRoles\('admin'\)/);
  assert.match(r, /router\.patch\('\/admin\/:id', verifyToken, authorizeRoles\('admin'\)/);
  assert.match(r, /'\/:slug\/going', verifyToken/);
  assert.ok(r.indexOf("'/admin/all'") < r.indexOf("'/:slug'"));
  assert.match(read('../index.js'), /app\.use\('\/api\/job-fairs'/);
  const code = (read('../controllers/jobFairController.js') + read('../utils/jobFairs.js')).replace(/\/\/.*$/gm, '');
  assert.ok(!/razorpay|\bgst\b|price/i.test(code));
});
test('client: pages, routes and sidebar are wired, admin page is admin only', () => {
  const routes = fs.readFileSync(require.resolve('../../client/src/routes/AppRoutes.jsx'), 'utf8');
  assert.match(routes, /path="\/job-fairs" element=\{<PublicJobFairs \/>\}/);
  assert.match(routes, /path="\/job-fairs\/:slug"/);
  assert.match(routes, /path="\/admin\/job-fairs"[\s\S]{0,120}roles=\{\['admin'\]\}[\s\S]{0,60}<AdminJobFairs/);
  assert.match(fs.readFileSync(require.resolve('../../client/src/components/common/Sidebar.jsx'), 'utf8'), /path: '\/admin\/job-fairs'/);
  const detail = fs.readFileSync(require.resolve('../../client/src/pages/fairs/JobFairDetail.jsx'), 'utf8');
  assert.match(detail, /Supported by Velaivaaipu/);
  assert.match(detail, /rel="noopener noreferrer"/);
});
