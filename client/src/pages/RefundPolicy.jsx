import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import LegalPage, { Section, SUPPORT_EMAIL, LEGAL_ENTITY, LEGAL_ADDRESS } from '../components/legal/LegalPage';

const SECTIONS = [
  { id: 'summary', title: '1. In short' },
  { id: 'eligible', title: '2. When you can get a refund' },
  { id: 'not-eligible', title: '3. When a refund is not available' },
  { id: 'colleges', title: '4. College (campus) plans' },
  { id: 'how', title: '5. How to ask' },
  { id: 'timeline', title: '6. How long it takes' },
  { id: 'cancel', title: '7. Cancelling a subscription' },
  { id: 'contact', title: '8. Contact' },
];

const RefundPolicy = () => (
  <LegalPage
    title="Refund & Cancellation Policy"
    icon={RotateCcw}
    effective="October 22, 2026"
    intro="Applies to subscriptions and pay-per-feature purchases."
    sections={SECTIONS}
    seoPath="/refund-policy"
    seoTitle="Refund & Cancellation Policy for Paid Plans | Velaivaaipu"
    seoDescription="See the Velaivaaipu refund and cancellation policy: the 24-hour refund window, full refunds for duplicate charges and how to stop auto-renewal. Read it."
  >
    <Section id="summary" title="1. In short">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Ask within <strong>24 hours</strong> of paying, and you get a refund if you have not used what you bought.</li>
        <li>Charged twice for the same thing? We refund the extra charge in full, whenever you tell us.</li>
        <li>One refund per account, email address and phone number.</li>
        <li>Every refund is checked and approved by our team.</li>
      </ul>
    </Section>

    <Section id="eligible" title="2. When you can get a refund">
      <p>You are eligible if all of these are true:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>The request is made within 24 hours of the payment.</li>
        <li>You have not used the plan or feature you paid for (for example, no candidate unlocks, job posts, credits or premium tools used).</li>
        <li>You have not already received or requested a refund on this account, email address or phone number.</li>
      </ul>
      <p><strong>Duplicate or accidental double payment:</strong> if the same plan or feature was charged more than once, the extra payment is refunded in full, with no time limit.</p>
      <p>If a payment was taken but your plan or feature was not activated, write to us straight away and we will either activate it or refund you.</p>
    </Section>

    <Section id="not-eligible" title="3. When a refund is not available">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>More than 24 hours have passed (other than a duplicate charge).</li>
        <li>You have used the plan or feature, fully or partly.</li>
        <li>Unused time or credits after you cancel, downgrade or change your mind later.</li>
        <li>Your account was suspended or closed for breaking our <Link to="/terms" className="font-bold text-emerald-700 hover:underline">Terms</Link>.</li>
        <li>You did not get interviews, hires or placements. We do not guarantee hiring or job outcomes.</li>
        <li>A renewal charge, if you did not cancel auto-renewal before the renewal date. You can cancel from Subscription settings at any time.</li>
      </ul>
      <p>Where the law gives you refund rights that cannot be waived, those rights apply.</p>
    </Section>

    <Section id="colleges" title="4. College (campus) plans">
      <p>College plans are set up with onboarding and verification, so refunds for them are handled directly by our team. Write to us at {SUPPORT_EMAIL} and we will review your case.</p>
    </Section>

    <Section id="how" title="5. How to ask">
      <p>Raise a support ticket from your dashboard, or email <strong>{SUPPORT_EMAIL}</strong> from your registered email address. Please include the payment ID or the date and amount of the payment, and a line on why you are asking.</p>
    </Section>

    <Section id="timeline" title="6. How long it takes">
      <p>We review requests within 3 working days. Approved refunds go back to the original payment method (card, UPI or net banking) and usually show up within 5 to 7 working days, depending on your bank. When a refund is approved, the paid plan or feature is withdrawn and your account moves to the Free plan.</p>
    </Section>

    <Section id="cancel" title="7. Cancelling a subscription">
      <p>You can turn off auto-renewal at any time in Subscription settings. Your plan stays active until the end of the period you already paid for, and you will not be charged again. Cancelling does not by itself refund the current period; for that, the refund rules above apply.</p>
    </Section>

    <Section id="contact" title="8. Contact">
      <p>{LEGAL_ENTITY}, {LEGAL_ADDRESS}. Questions about this policy: <strong>{SUPPORT_EMAIL}</strong> or our <Link to="/contact" className="font-bold text-emerald-700 hover:underline">Contact page</Link>.</p>
    </Section>
  </LegalPage>
);

export default RefundPolicy;
