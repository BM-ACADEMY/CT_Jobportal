// Fields of work a job can belong to. Keys match client/src/data/jobCategories.js.
// `words` are used only to guess a field for jobs posted before categories existed (nothing is saved by the guess).
const JOB_CATEGORIES = [
  { key: 'it-software', label: 'IT & Software', words: ['developer', 'software', 'frontend', 'backend', 'full stack', 'fullstack', 'devops', 'programmer', 'web design', 'qa engineer', 'tester', 'react', 'node', 'java', 'python', 'data analyst', 'it support'] },
  { key: 'healthcare', label: 'Healthcare', words: ['nurse', 'nursing', 'pharmac', 'lab tech', 'doctor', 'medical', 'hospital', 'clinic', 'physio', 'dental', 'ward', 'radiolog'] },
  { key: 'finance-accounts', label: 'Finance & Accounts', words: ['accountant', 'accounts', 'tally', 'audit', 'finance', 'bank', 'loan', 'insurance', 'billing executive', 'tax', 'gst'] },
  { key: 'design-creative', label: 'Design & Creative', words: ['designer', 'graphic', 'video editor', 'content writer', 'copywriter', 'photographer', 'animator', 'ui/ux', 'creative', 'social media'] },
  { key: 'sales-marketing', label: 'Sales & Marketing', words: ['sales', 'marketing', 'business development', 'field executive', 'seo', 'digital marketing', 'brand'] },
  { key: 'engineering', label: 'Engineering', words: ['engineer', 'mechanical', 'electrical', 'civil', 'autocad', 'maintenance'] },
  { key: 'education-training', label: 'Education & Training', words: ['teacher', 'tutor', 'lecturer', 'trainer', 'faculty', 'school', 'coach'] },
  { key: 'retail-shops', label: 'Retail & Shops', words: ['retail', 'showroom', 'cashier', 'store', 'shop', 'counter', 'salesman', 'sales associate'] },
  { key: 'hospitality-tourism', label: 'Hospitality & Tourism', words: ['hotel', 'restaurant', 'chef', 'cook', 'steward', 'housekeeping', 'front desk', 'tour', 'travel', 'waiter', 'barista', 'cdp', 'commis', 'tandoor', 'kitchen', 'housemen', 'house men', 'house keeping', 'room boy', 'captain', 'bartender', 'banquet', 'f&b'] },
  { key: 'logistics-delivery', label: 'Logistics & Delivery', words: ['delivery', 'driver', 'warehouse', 'logistics', 'courier', 'dispatch', 'supply chain', 'forklift'] },
  { key: 'manufacturing', label: 'Manufacturing', words: ['production', 'machine operator', 'operator', 'quality', 'factory', 'assembly', 'cnc', 'fitter', 'welder'] },
  { key: 'construction-realestate', label: 'Construction & Real Estate', words: ['site supervisor', 'construction', 'real estate', 'property', 'surveyor', 'mason', 'contractor', 'site engineer'] },
  { key: 'bpo-support', label: 'BPO & Customer Support', words: ['telecaller', 'tele caller', 'customer support', 'customer care', 'call center', 'bpo', 'chat support', 'voice process', 'back office'] },
  { key: 'admin-office', label: 'Admin & Office', words: ['admin', 'receptionist', 'data entry', 'office', 'secretary', 'coordinator', 'executive assistant'] },
  { key: 'hr-recruitment', label: 'HR & Recruitment', words: ['hr ', 'human resource', 'recruiter', 'recruitment', 'payroll', 'talent'] },
  { key: 'skilled-trades', label: 'Skilled Trades & Technicians', words: ['electrician', 'plumber', 'carpenter', 'painter', 'tailor', 'mechanic', 'technician', 'ac repair', 'ac mechanic', 'a.c mechanic', 'a.c. mechanic', 'hvac', 'refrigeration', 'beautician', 'security guard', 'helper', 'cleaner'] },
  { key: 'non-profit', label: 'Non-Profit', words: ['ngo', 'non-profit', 'nonprofit', 'social worker', 'program officer', 'csr', 'volunteer'] },
];

const KEYS = new Set(JOB_CATEGORIES.map((c) => c.key));

// A valid key, or '' when the value is empty or unknown. Never throws.
const cleanCategory = (raw) => {
  const k = String(raw ?? '').trim().toLowerCase();
  return KEYS.has(k) ? k : '';
};

// A job seeker's fields of interest: valid keys only, no repeats, at most 3. Anything that is not a list gives [].
const MAX_INTERESTS = 3;
const cleanInterestedCategories = (raw) => {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map(cleanCategory).filter(Boolean))].slice(0, MAX_INTERESTS);
};

// Best guess from the title (first, it counts most) and required skills. '' when nothing fits.
const guessCategory = ({ title = '', skillsRequired = [] } = {}) => {
  const t = ` ${String(title).toLowerCase()} `;
  const s = ` ${(Array.isArray(skillsRequired) ? skillsRequired : []).join(' ').toLowerCase()} `;
  let best = ''; let bestScore = 0;
  for (const c of JOB_CATEGORIES) {
    let score = 0;
    for (const w of c.words) {
      if (t.includes(w)) score += 3;
      else if (s.includes(w)) score += 1;
    }
    if (score > bestScore) { best = c.key; bestScore = score; }
  }
  return best;
};

module.exports = { JOB_CATEGORIES, cleanCategory, cleanInterestedCategories, guessCategory, MAX_INTERESTS };
