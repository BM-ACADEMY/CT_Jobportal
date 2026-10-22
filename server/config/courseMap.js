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

// Scholarship is a festival offer only. It applies when COURSE_SCHOLARSHIP_ACTIVE=true AND today is inside
// COURSE_SCHOLARSHIP_START..COURSE_SCHOLARSHIP_END (YYYY-MM-DD, India time, end day included).
// At any other time the message offers a free 15-minute counselling call.
const scholarshipOn = (env = process.env, now = new Date()) => {
  if (env.COURSE_SCHOLARSHIP_ACTIVE !== 'true' || !env.COURSE_SCHOLARSHIP_PRICE) return false;
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
  if (env.COURSE_SCHOLARSHIP_START && ist < env.COURSE_SCHOLARSHIP_START) return false;
  if (env.COURSE_SCHOLARSHIP_END && ist > env.COURSE_SCHOLARSHIP_END) return false;
  return true;
};

const offerText = (env = process.env, now = new Date()) => (
  scholarshipOn(env, now)
    ? `Festival scholarship price Rs ${env.COURSE_SCHOLARSHIP_PRICE} for students`
    : 'Free 15-minute counselling call'
);

// Send between 9am and 8pm India time only.
const isSendWindow = (date = new Date()) => {
  const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
  const h = ist.getUTCHours();
  return h >= 9 && h < 20;
};

module.exports = { scholarshipOn, PASS_RATIO, SKILL_CATEGORIES, getCategory, offerText, isSendWindow };
