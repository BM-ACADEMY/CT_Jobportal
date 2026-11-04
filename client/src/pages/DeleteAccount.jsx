import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import LegalPage, { Section, SUPPORT_EMAIL, LEGAL_ENTITY } from '../components/legal/LegalPage';

const SECTIONS = [
  { id: 'how', title: '1. How to delete your account' },
  { id: 'what', title: '2. What is deleted and what is kept' },
  { id: 'owners', title: '3. Company and college owners' },
];

const DeleteAccount = () => (
  <LegalPage
    title="Delete Your Account"
    icon={Trash2}
    effective="November 2, 2026"
    intro="How to delete your Velaivaaipu account and your data."
    sections={SECTIONS}
    seoPath="/delete-account"
    seoDescription="How to delete your Velaivaaipu account and what happens to your data."
  >
    <Section id="how" title="1. How to delete your account">
      <p>Sign in, open <strong>Settings</strong>, scroll to <strong>Delete my account</strong>, type DELETE and confirm. This works on the website and in the app.</p>
      <p>Cannot sign in? Write to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-emerald-700 font-semibold">{SUPPORT_EMAIL}</a> from your registered email with the subject "Delete my account". We will complete it after verifying it is you.</p>
    </Section>
    <Section id="what" title="2. What is deleted and what is kept">
      <p>Deleted at once: your name, email, phone, profile, resume and documents, photo, notifications, email history and skill test results. You are signed out everywhere and promotional messages stop.</p>
      <p>Kept without your name: payment and invoice records (tax law), and job applications as anonymous counts. See our <Link to="/privacy-policy" className="text-emerald-700 font-semibold">Privacy Policy</Link>.</p>
    </Section>
    <Section id="owners" title="3. Company and college owners">
      <p>These accounts are closed by our team so jobs, payments and people are handled properly. Write to {SUPPORT_EMAIL}. {LEGAL_ENTITY} operates Velaivaaipu.</p>
    </Section>
  </LegalPage>
);

export default DeleteAccount;
