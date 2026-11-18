const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

test('admin Companies page is routed, admin only, and linked in the sidebar', () => {
  const routes = read('client/src/routes/AppRoutes.jsx');
  assert.match(routes, /page\('admin\/ManageCompanies'\)/);
  assert.match(routes, /path="\/admin\/companies"\s+element=\{\s*<PrivateRoute roles=\{\['admin'\]\}>\s*<ManageCompanies \/>/);
  assert.match(read('client/src/components/common/Sidebar.jsx'), /path: '\/admin\/companies'/);
});

test('company verify route stays below the admin-only gate', () => {
  const src = read('server/routes/adminRoutes.js');
  assert.ok(src.indexOf("authorizeRoles('admin')") < src.indexOf("'/companies/:id/verify'"));
});
