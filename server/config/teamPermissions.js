// The page-level permissions a company admin can grant a team-managed recruiter. One list for the
// model enum, the invite/edit validation and the server route gate (middlewares/teamPermission.js).
// Keep client/src/config/teamPermissions.js in step (same keys, same labels).
const TEAM_PERMISSIONS = [
  { key: 'post_job', label: 'Post Job' },
  { key: 'my_jobs', label: 'My Jobs' },
  { key: 'candidate_search', label: 'Candidate Search' },
  { key: 'messages', label: 'Messages' },
  { key: 'ats_pipeline', label: 'Applicants / ATS Pipeline' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'bulk_messaging', label: 'Bulk Messaging' },
  { key: 'bulk_applicant_management', label: 'Bulk Applicant Management' },
  { key: 'interview_scheduling', label: 'Video Interview / Scheduling' },
  { key: 'ai_candidate_matching', label: 'AI Candidate Matching' },
];

const TEAM_PERMISSION_KEYS = TEAM_PERMISSIONS.map(p => p.key);
const labelFor = (key) => TEAM_PERMISSIONS.find(p => p.key === key)?.label || key;

// Pages that list the company's jobs as a starting point (the job list itself is not sensitive on its own,
// every one of these pages needs it to work).
const JOB_LIST_KEYS = ['post_job', 'my_jobs', 'ats_pipeline', 'analytics', 'bulk_messaging', 'bulk_applicant_management', 'interview_scheduling', 'ai_candidate_matching'];
// Pages that read a job's applicant list.
const APPLICANT_LIST_KEYS = ['ats_pipeline', 'bulk_messaging', 'bulk_applicant_management', 'interview_scheduling'];

module.exports = { TEAM_PERMISSIONS, TEAM_PERMISSION_KEYS, labelFor, JOB_LIST_KEYS, APPLICANT_LIST_KEYS };
