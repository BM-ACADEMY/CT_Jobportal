// Which existing free skill tests suit each field of work (/jobs/category/:slug).
// Keys on the right are skill-test keys from server/config/courseMap.js. A link is shown only when the server
// says that test has questions ready (GET /assessments/skills), so no test is ever invented here.
export const CATEGORY_SKILL_TESTS = {
  'it-software': ['html-css', 'python-basics', 'sql-basics', 'computer-basics'],
  'finance-accounts': ['accounting', 'banking-finance', 'ms-excel'],
  'design-creative': ['graphic-design'],
  'sales-marketing': ['sales-basics', 'digital-marketing'],
  'bpo-support': ['customer-service', 'communication'],
  'admin-office': ['ms-office', 'typing-data-entry', 'ms-excel', 'computer-basics'],
  'hr-recruitment': ['hr-basics'],
};
