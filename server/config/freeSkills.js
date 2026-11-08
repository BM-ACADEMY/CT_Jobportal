// The free skill test list shown to job seekers: every skill, grouped by industry.
// The old campus categories (config/courseMap.js) stay as they are; this file only adds the industry grouping and new skills.
const { SKILL_CATEGORIES } = require('./courseMap');

const LEVELS = ['easy', 'medium', 'hard'];

const OFFICE = 'Office, IT and finance';
const SALES = 'Sales, retail and customer service';

// Industry for the skills that already existed.
const CORE_INDUSTRY = {
  'digital-marketing': SALES, 'sales-basics': SALES, 'customer-service': SALES,
  accounting: OFFICE, 'banking-finance': OFFICE,
};

// New skills. A skill appears in the list only once it has questions ready.
const EXTRA_SKILLS = [
  { key: 'nursing-basics', label: 'Nursing Basics', industry: 'Healthcare' },
  { key: 'pharmacy-basics', label: 'Pharmacy Basics', industry: 'Healthcare' },
  { key: 'lab-technician', label: 'Lab Technician Basics', industry: 'Healthcare' },
  { key: 'hospital-front-office', label: 'Hospital Front Office', industry: 'Healthcare' },
  { key: 'retail-billing-pos', label: 'Retail Billing and POS', industry: SALES },
  { key: 'field-sales', label: 'Field Sales', industry: SALES },
  { key: 'hotel-front-desk', label: 'Hotel Front Desk', industry: 'Hospitality' },
  { key: 'housekeeping', label: 'Housekeeping', industry: 'Hospitality' },
  { key: 'food-beverage-service', label: 'Food and Beverage Service', industry: 'Hospitality' },
  { key: 'warehouse-basics', label: 'Warehouse Basics', industry: 'Logistics and warehouse' },
  { key: 'delivery-driver', label: 'Delivery and Driving', industry: 'Logistics and warehouse' },
  { key: 'inventory-control', label: 'Inventory Control', industry: 'Logistics and warehouse' },
  { key: 'quality-check', label: 'Quality Check', industry: 'Manufacturing and safety' },
  { key: 'workplace-safety', label: 'Workplace Safety', industry: 'Manufacturing and safety' },
  { key: 'machine-operator', label: 'Machine Operator Basics', industry: 'Manufacturing and safety' },
  { key: 'teaching-basics', label: 'Teaching Basics', industry: 'Education' },
  { key: 'school-admin', label: 'School Administration', industry: 'Education' },
  { key: 'site-safety', label: 'Construction Site Safety', industry: 'Construction' },
  { key: 'site-supervision', label: 'Site Supervision', industry: 'Construction' },
];

const ALL_SKILLS = [
  ...SKILL_CATEGORIES.map(({ key, label }) => ({ key, label, industry: CORE_INDUSTRY[key] || OFFICE })),
  ...EXTRA_SKILLS,
];
const byKey = new Map(ALL_SKILLS.map((s) => [s.key, s]));

const getFreeSkill = (key) => (typeof key === 'string' ? byKey.get(key) || null : null);
const cleanLevel = (raw) => { const l = String(raw || '').toLowerCase().trim(); return LEVELS.includes(l) ? l : 'medium'; };

module.exports = { LEVELS, ALL_SKILLS, getFreeSkill, cleanLevel };
