// Platform staff (support, counsellor, college verifier). A staff member is an ordinary User with the
// existing `subadmin` role plus `user.staff = { role, permissions }`. Only the Super Admin (the Admin
// collection, role 'admin') creates staff and chooses their permissions, from Admin > Staff.
// Keep client/src/config/staffPermissions.js in step (same keys and labels; a test checks it).
const STAFF_PERMISSIONS = [
  { key: 'tickets_view', label: 'See support tickets', area: 'Support tickets', path: '/admin/tickets' },
  { key: 'tickets_update', label: 'Reply to and close tickets', area: 'Support tickets' },
  { key: 'users_view', label: 'Look up users (read-only)', area: 'Users', path: '/admin/users' },
  { key: 'requests_view', label: 'See counselling, mock interview and resume review requests', area: 'Requests', path: '/admin/requests' },
  { key: 'requests_update', label: 'Update those requests', area: 'Requests' },
  { key: 'requests_assign', label: 'Assign those requests to a counsellor or recruiter', area: 'Requests' },
  { key: 'colleges_view', label: 'See colleges awaiting verification', area: 'College verification', path: '/admin/colleges' },
  { key: 'colleges_verify', label: 'Approve or reject a college', area: 'College verification' },
  { key: 'government_jobs', label: 'Post and close government jobs', area: 'Government jobs', path: '/admin/government-jobs' },
];
const STAFF_PERMISSION_KEYS = STAFF_PERMISSIONS.map(p => p.key);

// Presets. The Super Admin can add or remove single permissions per person afterwards.
const STAFF_ROLES = {
  support: { label: 'Support', permissions: ['tickets_view', 'tickets_update', 'users_view'] },
  counsellor: { label: 'Counsellor', permissions: ['requests_view', 'requests_update', 'requests_assign'] },
  college_verifier: { label: 'College verifier', permissions: ['colleges_view', 'colleges_verify'] },
  government_jobs_editor: { label: 'Government jobs editor', permissions: ['government_jobs'] },
};
const STAFF_ROLE_KEYS = Object.keys(STAFF_ROLES);

// A counsellor sees these request types only; website requests (sales) stay with the Super Admin.
const STAFF_REQUEST_TYPES = ['counselling', 'mock_interview', 'ai_resume_review'];

const labelFor = (key) => STAFF_PERMISSIONS.find(p => p.key === key)?.label || key;

module.exports = { STAFF_PERMISSIONS, STAFF_PERMISSION_KEYS, STAFF_ROLES, STAFF_ROLE_KEYS, STAFF_REQUEST_TYPES, labelFor };
