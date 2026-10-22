// Campus skill-test categories and the course we suggest when a student scores below the pass mark.
// Edit the `course` names here if the BM Academy catalogue changes. Nothing is sent unless
// WHATSAPP_FOLLOWUP_ENABLED=true (see cron/courseFollowUps.js).
const PASS_RATIO = 0.6;

const SKILL_CATEGORIES = [
  { key: 'digital-marketing', label: 'Digital Marketing Basics', course: 'AI-powered Digital Marketing' },
  { key: 'ms-excel', label: 'MS Excel', course: 'Data Analytics with Power BI' },
  { key: 'accounting', label: 'Tally / Basic Accounting', course: 'Data Analytics with Power BI' },
  { key: 'graphic-design', label: 'Canva / Graphic Design', course: 'AI Content & Video' },
  { key: 'communication', label: 'Communication / English', course: 'Soft Skills & Interview Prep' },
  { key: 'computer-basics', label: 'Computer Basics', course: 'Web Design (Basic)' },
  { key: 'customer-service', label: 'Customer Service', course: 'Production Support Engineer Program' },
];

const byKey = new Map(SKILL_CATEGORIES.map((c) => [c.key, c]));
const getCategory = (key) => (typeof key === 'string' ? byKey.get(key) || null : null);

// The first offer: scholarship price when a scholarship is running, otherwise a free counselling call.
const offerText = (env = process.env) => (
  env.COURSE_SCHOLARSHIP_ACTIVE === 'true' && env.COURSE_SCHOLARSHIP_PRICE
    ? `Scholarship price Rs ${env.COURSE_SCHOLARSHIP_PRICE} for students`
    : 'Free 15-minute counselling call'
);

// Send between 9am and 8pm India time only.
const isSendWindow = (date = new Date()) => {
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
  const h = ist.getUTCHours();
  return h >= 9 && h < 20;
};

module.exports = { PASS_RATIO, SKILL_CATEGORIES, getCategory, offerText, isSendWindow };
