// Staff permissions for platform staff (role `subadmin`). Same keys and labels as
// server/config/staffPermissions.js, where the server enforces them; a server test checks the lists match.
export const STAFF_PERMISSIONS = [
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

export const STAFF_ROLES = {
  support: { label: 'Support', permissions: ['tickets_view', 'tickets_update', 'users_view'] },
  counsellor: { label: 'Counsellor', permissions: ['requests_view', 'requests_update', 'requests_assign'] },
  college_verifier: { label: 'College verifier', permissions: ['colleges_view', 'colleges_verify'] },
  government_jobs_editor: { label: 'Government jobs editor', permissions: ['government_jobs'] },
};

// Menu entries a staff member gets, from their permissions.
export const staffMenuFor = (permissions = []) =>
  STAFF_PERMISSIONS.filter((p) => p.path && permissions.includes(p.key)).map((p) => ({ label: p.area, path: p.path }));

export const hasStaffPermission = (user, key) =>
  user?.role === 'admin' || (user?.role === 'subadmin' && (user?.staff?.permissions || []).includes(key));
