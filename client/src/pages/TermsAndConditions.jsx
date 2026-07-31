import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { FileText, ShieldAlert } from 'lucide-react';

const EFFECTIVE_DATE = 'July 25, 2026';

const SECTIONS = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'definitions', title: '2. Definitions' },
  { id: 'eligibility', title: '3. Eligibility & Account Registration' },
  { id: 'how-it-works', title: '4. How the Platform Works' },
  { id: 'subscriptions', title: '5. Subscription Plans, Billing & Payments' },
  { id: 'no-refunds', title: '6. No-Refund Policy' },
  { id: 'matching', title: '7. AI Matching & Accuracy Disclaimer' },
  { id: 'communications', title: '8. Email & WhatsApp Communications' },
  { id: 'campus', title: '9. Campus Drives & Verification' },
  { id: 'conduct', title: '10. Acceptable Use' },
  { id: 'content', title: '11. Content Ownership & License' },
  { id: 'third-party', title: '12. Third-Party Services' },
  { id: 'privacy', title: '13. Data & Privacy' },
  { id: 'disclaimer', title: '14. Disclaimer of Warranties' },
  { id: 'liability', title: '15. Limitation of Liability' },
  { id: 'indemnification', title: '16. Indemnification' },
  { id: 'termination', title: '17. Termination & Suspension' },
  { id: 'ip', title: '18. Intellectual Property' },
  { id: 'governing-law', title: '19. Governing Law & Disputes' },
  { id: 'changes', title: '20. Changes to These Terms' },
  { id: 'contact', title: '21. Contact Us' },
];

const Section = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 py-8 border-b border-slate-100 last:border-b-0">
    <h2 className="text-lg font-bold text-slate-900 mb-3">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </section>
);

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-950 pt-16 pb-14 px-6">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 mb-5">
            Legal
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 flex items-center gap-3">
            <FileText size={30} className="text-emerald-400" /> Terms & Conditions
          </h1>
          <p className="text-slate-400 text-sm">Effective date: {EFFECTIVE_DATE} · Applies to all Velaivaaipu users — Job Seekers, Recruiters, Companies, Colleges, and Admins.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-12">
        {/* Table of contents */}
        <nav className="hidden lg:block sticky top-24 self-start">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">On this page</p>
          <ul className="space-y-2">
            {SECTIONS.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors leading-snug block">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Body */}
        <div>
          <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              This is a summary of our platform policies for general understanding. By creating an account or using Velaivaaipu ("the Platform"), you agree to be bound by these Terms & Conditions in full.
            </p>
          </div>

          <Section id="acceptance" title="1. Acceptance of Terms">
            <p>
              These Terms & Conditions ("Terms") form a binding agreement between you and Velaivaaipu ("we", "us", "the Platform") governing your access to and use of our website, mobile experience, and all related services. By registering for an account, purchasing a subscription, or otherwise using the Platform, you confirm that you have read, understood, and agree to these Terms, along with any plan-specific terms referenced below.
            </p>
            <p>If you do not agree to these Terms, you must not access or use the Platform.</p>
          </Section>

          <Section id="definitions" title="2. Definitions">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>"Job Seeker"</strong> — an individual using the Platform to search for and apply to job opportunities.</li>
              <li><strong>"Recruiter" / "Company"</strong> — an individual or organization using the Platform to post jobs, search candidates, and manage hiring.</li>
              <li><strong>"College" / "TPO"</strong> — an educational institution or Training & Placement Officer using the Platform to manage campus placement drives.</li>
              <li><strong>"Team Member"</strong> — an Employee or Recruiter account added to an organization by a Company admin, subject to the access controls described in Section 3.</li>
              <li><strong>"Subscription"</strong> — a paid plan (monthly, quarterly, or yearly) granting access to premium features for a given role.</li>
              <li><strong>"Pay-Per-Feature"</strong> — a one-time or credit-based purchase unlocking a specific feature without a full subscription.</li>
            </ul>
          </Section>

          <Section id="eligibility" title="3. Eligibility & Account Registration">
            <p>
              You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account, including activity by Team Members you add to an organization.
            </p>
            <p>
              Company accounts are responsible for accurately representing whether an invited Team Member is an Employee or a Recruiter, and for the page-level permissions granted to any Recruiter Team Member. You are responsible for the actions your Team Members take on the Platform using access you grant them.
            </p>
            <p>You agree to provide accurate, current, and complete information during registration and to keep it updated.</p>
          </Section>

          <Section id="how-it-works" title="4. How the Platform Works">
            <p>
              Velaivaaipu connects Job Seekers, Recruiters/Companies, and Colleges through job listings, applications, candidate search, campus placement drives, messaging, interview scheduling, and related tools. A step-by-step walkthrough for each role is available on our{' '}
              <Link to="/how-it-works" className="font-bold text-emerald-700 hover:underline">How It Works</Link> page.
            </p>
            <p>
              We reserve the right to add, modify, or discontinue any feature at our discretion, including features tied to a specific subscription tier, with reasonable notice where practical.
            </p>
          </Section>

          <Section id="subscriptions" title="5. Subscription Plans, Billing & Payments">
            <p>
              The Platform offers free and paid subscription tiers for Job Seekers, Recruiters/Companies, and Colleges, as well as one-time Pay-Per-Feature purchases. Paid plan features, limits, and pricing are as displayed on the relevant Subscription page at the time of purchase.
            </p>
            <p>
              Payments are processed through our third-party payment partner (Razorpay). By subscribing, you authorize us to charge your chosen payment method for the plan price, including recurring auto-renewal charges where auto-renewal is enabled, until you cancel or downgrade. You can manage auto-renewal from your account's Subscription settings.
            </p>
            <p>
              If a recurring payment fails, your plan may be downgraded to the Free tier after repeated failed attempts, as described in your dashboard's renewal notifications.
            </p>
          </Section>

          <Section id="no-refunds" title="6. No-Refund Policy">
            <p className="font-bold text-slate-900">
              All payments made for Subscription plans and Pay-Per-Feature purchases are final and non-refundable, in whole or in part, regardless of the extent to which the plan or feature is used.
            </p>
            <p>
              This includes, without limitation: monthly, quarterly, and yearly subscription fees; upgrade or add-on charges; pay-per-feature credit purchases; and amounts charged via auto-renewal. No refunds, credits, or pro-rated reimbursements will be issued for unused time, unused credits, early cancellation, downgrade, account suspension for a Terms violation, or dissatisfaction with match outcomes or hiring results.
            </p>
            <p>
              Where applicable law in your jurisdiction grants non-waivable refund rights, this section applies to the maximum extent permitted by that law.
            </p>
          </Section>

          <Section id="matching" title="7. AI Matching & Accuracy Disclaimer">
            <p>
              Paid Job Seeker and Recruiter plans include access to our AI-assisted matching engine, which is designed and tuned to target up to <strong>95% match relevance</strong> between candidate profiles and job requirements, based on the completeness, accuracy, and recency of the profile, resume, and job posting data provided by users.
            </p>
            <p>
              Match relevance is an algorithmic estimate, not a guarantee. It does not guarantee that you will receive interview invitations, job offers, qualified applicants, or a successful hire, and actual relevance may vary based on data quality, market conditions, and factors outside our control. Subscribing to a paid plan does not create any warranty of employment or hiring outcomes.
            </p>
          </Section>

          <Section id="communications" title="8. Email & WhatsApp Communications">
            <p>
              By providing your email address and/or phone number, you consent to receive transactional and service communications from the Platform — including application status updates, interview invitations, assessment invites, drive announcements, billing notices, and verification updates — via email and, where a phone number is on file, via WhatsApp.
            </p>
            <p>
              These communications are necessary to the services you've signed up for and are not promotional opt-ins; you can update your contact details, but disabling delivery entirely may limit your ability to receive time-sensitive updates (e.g. interview schedules).
            </p>
          </Section>

          <Section id="campus" title="9. Campus Drives & Verification">
            <p>
              Colleges must complete our platform verification process before their campus drives, student registrations, and company invitations become active or visible to other users. We reserve the right to approve, reject, or revoke verification at our discretion, including where submitted authorization documents cannot be validated.
            </p>
            <p>
              Companies invited to a campus drive, and students registering for one, are responsible for the accuracy of the information they submit. The Platform is a facilitation tool for campus placements and does not guarantee drive outcomes, student placement, or company participation.
            </p>
          </Section>

          <Section id="conduct" title="10. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Post false, misleading, or fraudulent job listings, company information, or candidate profiles;</li>
              <li>Use the Platform to harass, discriminate against, or spam other users;</li>
              <li>Scrape, mine, or bulk-extract data from the Platform without written permission;</li>
              <li>Circumvent subscription limits, feature gates, or seat/permission restrictions;</li>
              <li>Upload malicious code or attempt to compromise Platform security;</li>
              <li>Impersonate another person, company, or institution.</li>
            </ul>
            <p>Violation of this section may result in suspension or termination of your account under Section 17, without refund under Section 6.</p>
          </Section>

          <Section id="content" title="11. Content Ownership & License">
            <p>
              You retain ownership of the content you submit (resumes, job postings, profile information, messages). By submitting content, you grant the Platform a worldwide, non-exclusive, royalty-free license to host, display, and process that content as necessary to operate the service — for example, showing your resume to a recruiter you applied to, or generating a certificate/report from data you provided.
            </p>
            <p>Documents we generate on your behalf (certificates, MoUs, placement reports, offer-letter links) remain subject to the accuracy of the underlying data you or your organization supplied.</p>
          </Section>

          <Section id="third-party" title="12. Third-Party Services">
            <p>
              The Platform integrates third-party services including Razorpay (payments), Google/GitHub/LinkedIn (social login), Google Gemini (AI-assisted content features), and Meta WhatsApp Business (messaging). Your use of these integrations is also subject to those providers' own terms and privacy policies. We are not responsible for outages, errors, or policy changes originating from third-party providers.
            </p>
          </Section>

          <Section id="privacy" title="13. Data & Privacy">
            <p>
              We collect and process personal data (profile details, resumes, contact information, usage data) to operate the Platform's core features — matching, applications, messaging, notifications, and billing. We do not sell your personal data to third parties. Full details will be published in our Privacy Policy; until then, this section governs data handling in conjunction with applicable law.
            </p>
          </Section>

          <Section id="disclaimer" title="14. Disclaimer of Warranties">
            <p>
              The Platform is provided "as is" and "as available," without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components, or that any job listing, candidate, company, or college profile is accurate or verified beyond the specific verification steps described in Section 9.
            </p>
          </Section>

          <Section id="liability" title="15. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, the Platform and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or hiring/employment opportunities, arising from your use of or inability to use the Platform. Our total aggregate liability for any claim relating to the Platform shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </Section>

          <Section id="indemnification" title="16. Indemnification">
            <p>
              You agree to indemnify and hold harmless the Platform, its officers, employees, and partners from any claims, damages, liabilities, and expenses (including legal fees) arising from your use of the Platform, your content, your violation of these Terms, or your violation of any rights of a third party.
            </p>
          </Section>

          <Section id="termination" title="17. Termination & Suspension">
            <p>
              We may suspend or terminate your account, with or without notice, for violation of these Terms, fraudulent activity, non-payment, or at our discretion to protect the Platform and its users. Sections 6, 11, 15, 16, and 19 survive termination. Termination does not entitle you to any refund under Section 6.
            </p>
          </Section>

          <Section id="ip" title="18. Intellectual Property">
            <p>
              The Velaivaaipu name, logo, design, and platform software are our exclusive property or that of our licensors, protected by applicable intellectual property laws. Nothing in these Terms grants you any right to use our trademarks or branding without prior written consent.
            </p>
          </Section>

          <Section id="governing-law" title="19. Governing Law & Disputes">
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Chennai, Tamil Nadu, India, unless otherwise required by applicable law.
            </p>
          </Section>

          <Section id="changes" title="20. Changes to These Terms">
            <p>
              We may update these Terms from time to time. Material changes will be reflected by an updated effective date at the top of this page, and, where required, notified to you via email or in-app notice. Continued use of the Platform after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section id="contact" title="21. Contact Us">
            <p>
              Questions about these Terms can be directed to <strong>support@velaivaaipu.in</strong> or via our{' '}
              <Link to="/contact" className="font-bold text-emerald-700 hover:underline">Contact page</Link>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
