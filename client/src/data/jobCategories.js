// The fields of work shown on the home page. The same list will feed signup and job posting later.
// Keys match server/config/jobCategories.js. `q` is a plain search word, kept for places that cannot filter by field.
export const JOB_CATEGORIES = [
  { key: 'it-software', label: 'IT & Software', q: 'developer', desc: 'Apps, websites and the systems behind them.', roles: ['Developer', 'Tester', 'Support Engineer'] },
  { key: 'healthcare', label: 'Healthcare', q: 'nurse', desc: 'Hospitals, clinics, pharmacies and labs.', roles: ['Staff Nurse', 'Pharmacist', 'Lab Technician'] },
  { key: 'finance-accounts', label: 'Finance & Accounts', q: 'accountant', desc: 'Books, billing, tax and banking work.', roles: ['Accountant', 'Tally Operator', 'Bank Executive'] },
  { key: 'design-creative', label: 'Design & Creative', q: 'designer', desc: 'Graphics, video, content and social media.', roles: ['Graphic Designer', 'Video Editor', 'Content Writer'] },
  { key: 'sales-marketing', label: 'Sales & Marketing', q: 'sales', desc: 'Find customers and grow the business.', roles: ['Sales Executive', 'Digital Marketer', 'Field Sales'] },
  { key: 'engineering', label: 'Engineering', q: 'engineer', desc: 'Design and maintain plants, sites and machines.', roles: ['Mechanical', 'Electrical', 'Civil'] },
  { key: 'education-training', label: 'Education & Training', q: 'teacher', desc: 'Teach, train and support learners.', roles: ['School Teacher', 'Trainer', 'School Admin'] },
  { key: 'retail-shops', label: 'Retail & Shops', q: 'retail', desc: 'Stores, showrooms and billing counters.', roles: ['Sales Associate', 'Cashier', 'Store Manager'] },
  { key: 'hospitality-tourism', label: 'Hospitality & Tourism', q: 'hotel', desc: 'Hotels, restaurants and travel.', roles: ['Front Desk', 'Steward', 'Housekeeping'] },
  { key: 'logistics-delivery', label: 'Logistics & Delivery', q: 'delivery', desc: 'Warehouses, drivers and supply chains.', roles: ['Delivery Executive', 'Warehouse', 'Driver'] },
  { key: 'manufacturing', label: 'Manufacturing', q: 'production', desc: 'Factories, quality and machine operation.', roles: ['Operator', 'Quality Check', 'Supervisor'] },
  { key: 'construction-realestate', label: 'Construction & Real Estate', q: 'site', desc: 'Sites, projects and property.', roles: ['Site Supervisor', 'Surveyor', 'Property Advisor'] },
  { key: 'bpo-support', label: 'BPO & Customer Support', q: 'customer support', desc: 'Calls, chat and customer care.', roles: ['Telecaller', 'Chat Support', 'Back Office'] },
  { key: 'admin-office', label: 'Admin & Office', q: 'admin', desc: 'Offices, records and coordination.', roles: ['Office Admin', 'Data Entry', 'Receptionist'] },
  { key: 'hr-recruitment', label: 'HR & Recruitment', q: 'hr', desc: 'Hire, onboard and look after people.', roles: ['HR Executive', 'Recruiter', 'Payroll'] },
  { key: 'skilled-trades', label: 'Skilled Trades & Technicians', q: 'technician', desc: 'Hands-on work: repair, install, build, stitch, drive.', roles: ['Electrician', 'Plumber', 'Tailor'] },
  { key: 'non-profit', label: 'Non-Profit', q: 'social', desc: 'Causes that strengthen communities.', roles: ['Program Officer', 'Social Worker', 'CSR'] },
];
