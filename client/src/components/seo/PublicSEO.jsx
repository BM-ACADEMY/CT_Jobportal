import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import SEOHead from './SEOHead';

const baseSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://velaivaaipu.in/#organization',
  name: 'Velaivaaipu',
  url: 'https://velaivaaipu.in',
};

const META = {
  '/': ["Jobs in Tamil Nadu & Pondicherry – Apply Free | Velaivaaipu", "Find the latest job vacancies in Tamil Nadu and Pondicherry. Take a free AI skill test, get resume feedback and apply to jobs for free. Sign up today."],
  '/companies': ["Companies Hiring in Tamil Nadu & Pondicherry | Velaivaaipu", "Browse companies hiring in Tamil Nadu and Pondicherry. View company profiles, see their open job vacancies and apply directly for free. Explore now."],
  '/contact': ["Contact Us – Job Search & Hiring Support | Velaivaaipu", "Need help with your job search, account or hiring on Velaivaaipu? Reach our support team in Tamil or English by WhatsApp or email. Contact us today."],
  '/how-it-works': ["How It Works – Find Jobs or Hire in Tamil Nadu | Velaivaaipu", "Learn how job seekers apply free, employers find candidates and colleges run campus drives on Velaivaaipu. See the simple steps and get started today."],
  '/terms': ["Terms and Conditions for Users & Employers | Velaivaaipu", "Read the terms for using Velaivaaipu as a job seeker, employer or college, including accounts, payments, refunds and acceptable use. Review them here."],
  '/blog': ["Job Search Tips & Career Guides for Tamil Nadu | Velaivaaipu", "Read practical guides on fresher jobs, private jobs, walk-in interviews and work from home jobs in Tamil Nadu and Pondicherry. Start reading today."],
  '/free-assessment': ["Free Online Skill Test for Job Seekers | Velaivaaipu", "Take a free online skill test, see your score and find out which jobs in Tamil Nadu and Pondicherry suit your skills best. Start your free test now."],
};

const PublicSEO = () => {
  const location = useLocation();
  const value = useMemo(() => {
    if (location.pathname.startsWith('/blog/')) return null;
    if (location.pathname === '/recruitment-agency-fees-india') return null;
    if (location.pathname.startsWith('/job/')) return null;
    // Company profiles set their own tags once the company has loaded.
    if (location.pathname.startsWith('/companies/')) return null;
    // Jobs owns its metadata because the live result count is only available there.
    if (location.pathname === '/jobs' || location.pathname.startsWith('/jobs/')) return null;
    return META[location.pathname] || ['Velaivaaipu — Jobs in Tamil Nadu', 'Find verified jobs, companies and career resources across Tamil Nadu on Velaivaaipu.'];
  }, [location.pathname]);

  if (!value) return null;
  return <SEOHead title={value[0]} description={value[1]} path={location.pathname} schema={baseSchema} />;
};

export default PublicSEO;
