import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import LegalPage, { Section, SUPPORT_EMAIL, LEGAL_ENTITY, LEGAL_ADDRESS, LEGAL_CIN } from '../components/legal/LegalPage';

const SECTIONS = [
  { id: 'who', title: '1. Who we are' },
  { id: 'collect', title: '2. What we collect' },
  { id: 'use', title: '3. How we use it' },
  { id: 'share', title: '4. Who sees your data' },
  { id: 'whatsapp', title: '5. WhatsApp and email messages' },
  { id: 'processors', title: '6. Services we use' },
  { id: 'retention', title: '7. How long we keep data' },
  { id: 'rights', title: '8. Your rights and choices' },
  { id: 'security', title: '9. Security' },
  { id: 'children', title: '10. Age' },
  { id: 'changes', title: '11. Changes' },
  { id: 'contact', title: '12. Contact and grievances' },
];

// The assistant wording stays hidden until VITE_ASSISTANT_ENABLED=true (set it together with ASSISTANT_ENABLED on the server).
const ASSISTANT_LIVE = import.meta.env.VITE_ASSISTANT_ENABLED === 'true';

const PrivacyPolicy = () => (
  <LegalPage
    title="Privacy Policy"
    icon={ShieldCheck}
    effective="October 22, 2026"
    intro="Explains what data we collect, why, and the choices you have."
    sections={SECTIONS}
    seoPath="/privacy-policy"
    seoDescription="How Velaivaaipu collects, uses and protects personal data of job seekers, companies and colleges, and the choices you have."
  >
    <Section id="who" title="1. Who we are">
      <p>{LEGAL_ENTITY} ("we", "us"), CIN {LEGAL_CIN}, registered office {LEGAL_ADDRESS}, runs velaivaaipu.in, a platform that connects job seekers, companies and colleges. We decide why and how your personal data is used on the platform. This policy applies to the website and the services on it, including campus QR registration and skill tests.</p>
    </Section>

    <Section id="collect" title="2. What we collect">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Account details:</strong> name, email, phone or WhatsApp number, password (stored hashed), and the sign-in method you used (email, Google or LinkedIn).</li>
        <li><strong>Profile details you add:</strong> resume, education, skills, work history, location, photo, preferences.</li>
        <li><strong>Campus registration:</strong> your name, WhatsApp number, optional email, your college and drive, your skill test answers and scores.</li>
        <li><strong>Company and college details:</strong> organisation name, contacts, documents you upload for verification, job posts and drive information.</li>
        <li><strong>Payments:</strong> plan, amount and Razorpay payment references. Card and bank details are handled by Razorpay and never stored by us.</li>
        <li><strong>Usage data:</strong> pages viewed, device and browser type, IP address, and the campaign link you arrived from.</li>
      </ul>
    </Section>

    <Section id="use" title="3. How we use it">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To create your account, sign you in and keep it secure.</li>
        <li>To match candidates with jobs, let you apply, and let employers and colleges run hiring and campus drives.</li>
        <li>To send service messages: OTPs, application and interview updates, drive announcements, receipts and renewal notices.</li>
        <li>To send offers, such as courses or scholarships, only if you agreed to receive them.</li>
        <li>To process payments, prevent fraud and misuse, and give support.</li>
        <li>To measure and improve the platform and our marketing, using analytics.</li>
        <li>To check that our job and candidate suggestions are useful, we record which suggestions were shown, opened, applied to or shortlisted. This record holds user and job identifiers, where the suggestion appeared and its match score, not names or contact details, and is deleted after 180 days. Suggestions come from your skills, roles, location and experience; we do not use gender, age, religion, caste, marital status, name or photo to rank anyone.</li>
      </ul>
    </Section>

    <Section id="share" title="4. Who sees your data">
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Employers and recruiters</strong> see your profile and resume when you apply, or where your profile is visible to them under your settings.</li>
        <li><strong>Your college</strong> sees your registration, test results and placement status if you joined through that college.</li>
        <li><strong>Companies in a campus drive</strong> see the student details the college shares with them for that drive.</li>
        <li>Our team members see data as needed for support and safety.</li>
        <li>We may disclose data when the law requires it.</li>
      </ul>
      <p>We do not sell your personal data.</p>
    </Section>

    <Section id="whatsapp" title="5. WhatsApp and email messages">
      <p>Service messages (OTP, application updates, interview and drive notices, billing) are sent to the contact details you gave us. Promotional messages, such as course or scholarship offers, are sent only if you ticked the consent box. We record when you consented. Reply <strong>STOP</strong> to any WhatsApp message, or write to us, and we will stop promotional messages.</p>
    </Section>

    <Section id="processors" title="6. Services we use">
      {/* DRAFT wording for the AI assistant. A lawyer must review it, and OpenAI's current API data terms must be checked, before the assistant is switched on (see docs/AI_ASSISTANT.md). */}
      <p>We use trusted providers to run the platform: Razorpay (payments), Meta WhatsApp Business (messages), Google and LinkedIn (sign-in), Google Analytics and Meta Pixel (analytics and advertising measurement), AI model providers accessed through OpenRouter (for AI features such as skill tests, resume review and candidate matching; the text you submit for those features, such as your resume, is sent to them to produce the result), email delivery services, and cloud hosting. They process data on our behalf or under their own privacy terms. Some of them store data on servers outside India.</p>
      {ASSISTANT_LIVE && <p><strong>Velaivaaipu assistant (job seekers).</strong> If you use the assistant, your question and a short summary of your own career profile are sent to OpenAI to produce the answer: your headline, preferred role, location, skills, degree names, past job titles, how complete your profile is, and the jobs we suggested to you. We do not send your name, email, phone number, photo, password, payment details or resume text, and we do not keep the text of your conversation; we only count how many messages you send. OpenAI handles that data under its own terms and privacy policy. Do not type passwords, OTPs, card details or ID numbers into the assistant. Its answers can be wrong; check important details yourself.</p>}
    </Section>

    <Section id="retention" title="7. How long we keep data">
      <p>We keep your data while your account is active and for as long as needed for legal, tax and dispute purposes. If you delete your account, we remove or anonymise your personal data, except records we must keep by law (for example, payment records).</p>
    </Section>

    <Section id="rights" title="8. Your rights and choices">
      <p>You can ask us to access, correct or delete your personal data, withdraw consent for promotional messages, or close your account. You can update most details from your profile settings. To make a request, write to {SUPPORT_EMAIL} from your registered email. We will reply within a reasonable time and in line with applicable Indian law, including the Digital Personal Data Protection Act, 2023.</p>
    </Section>

    <Section id="security" title="9. Security">
      <p>We use access controls, hashed passwords, encrypted connections and rate limits to protect data. No online service is perfectly secure, so please use a strong password and keep it private.</p>
    </Section>

    <Section id="children" title="10. Age">
      <p>The platform is for people aged 18 and over. If we learn that we hold data of someone under 18 without a parent or guardian's consent, we will delete it.</p>
    </Section>

    <Section id="changes" title="11. Changes">
      <p>We may update this policy. The effective date at the top shows the latest version, and we will tell you about important changes by email or in the app. See also our <Link to="/terms" className="font-bold text-emerald-700 hover:underline">Terms</Link> and <Link to="/refund-policy" className="font-bold text-emerald-700 hover:underline">Refund Policy</Link>.</p>
    </Section>

    <Section id="contact" title="12. Contact and grievances">
      <p>Write to <strong>{SUPPORT_EMAIL}</strong> or use our <Link to="/contact" className="font-bold text-emerald-700 hover:underline">Contact page</Link> for any privacy question or complaint.</p>
    </Section>
  </LegalPage>
);

export default PrivacyPolicy;
