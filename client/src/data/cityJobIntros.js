// Short intro text shown on the city job pages (/jobs/<city>), so each page has its own content
// for search engines and readers. Keep each intro 100–150 words, factual and candidate-focused.

export const CITY_JOB_INTROS = {
  pondicherry: {
    name: 'Pondicherry',
    heading: 'Jobs in Pondicherry (Puducherry)',
    paragraphs: [
      'Pondicherry, also called Puducherry, has openings across IT and software, education, healthcare, hospitality and tourism, sales, accounts and customer support. Employers here hire both freshers and experienced candidates, for full-time, part-time and walk-in roles, so there are options at every stage of your career.',
      'On Velaivaaipu you can see the latest job vacancies in Pondicherry in one place. Filter by job type, salary and experience, open any listing to read the full details, and apply online for free. Take the free skill test to see which roles suit your skills, and always check the company and job details before you accept an offer. Never pay anyone to get a job.',
    ],
  },
  chennai: {
    name: 'Chennai',
    heading: 'Jobs in Chennai',
    paragraphs: [
      'Chennai is one of the largest job markets in Tamil Nadu, with openings in IT and software, manufacturing, banking and finance, healthcare, logistics, sales and customer support. Roles range from entry-level jobs for fresh graduates to senior positions for experienced professionals in every part of the city.',
      'On Velaivaaipu you can browse the latest job vacancies in Chennai, filter by job type, salary and experience, and apply online for free. Read each job description carefully, check the work location and timings, and confirm the company details before you attend an interview. A genuine employer will never ask you to pay a fee to get hired.',
    ],
  },
  villupuram: {
    name: 'Villupuram',
    heading: 'Jobs in Villupuram',
    paragraphs: [
      'Villupuram offers openings in sales, retail, accounts, administration, education, healthcare and local manufacturing, along with roles in nearby towns such as Tindivanam and Pondicherry. Many employers here hire freshers as well as candidates with a few years of experience, for both full-time and part-time roles.',
      'On Velaivaaipu you can see the latest job vacancies in Villupuram, filter by job type and salary, and apply online for free. If you are open to travel, also check jobs in Pondicherry and Cuddalore. Before you accept an offer, confirm the employer, the salary and the work location, and never pay anyone to get a job.',
    ],
  },
  cuddalore: {
    name: 'Cuddalore',
    heading: 'Jobs in Cuddalore',
    paragraphs: [
      'Cuddalore has openings in manufacturing and industrial units, sales, accounts, administration, healthcare, education and customer support. Both freshers and experienced candidates can find full-time and part-time roles, and many people from the district also look at jobs in nearby Pondicherry and Villupuram.',
      'On Velaivaaipu you can browse the latest job vacancies in Cuddalore, filter by job type, salary and experience, and apply online for free. Read each listing in full before you apply, check the work location and shift timings, and confirm the company details before you accept an offer. A genuine employer will never ask you to pay for a job.',
    ],
  },
};

// Other spellings people use in the URL.
const CITY_ALIASES = { puducherry: 'pondicherry', pondy: 'pondicherry' };

export const getCityIntro = (routeLocation) => {
  if (!routeLocation) return null;
  const key = decodeURIComponent(routeLocation).trim().toLowerCase().replace(/\s+/g, '-');
  return CITY_JOB_INTROS[CITY_ALIASES[key] || key] || null;
};

export const CITY_LINKS = Object.entries(CITY_JOB_INTROS).map(([slug, city]) => ({ slug, name: city.name }));
