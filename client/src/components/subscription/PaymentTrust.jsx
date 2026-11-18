import React from 'react';
import { ShieldCheck, Landmark, Zap } from 'lucide-react';

// Trust row shown under plan and add-on cards: how people can pay, and that it is safe.
// Logo files are the official marks (from Wikimedia Commons), kept in /public/images/payments.
const LOGOS = [
  { src: '/images/payments/upi.svg', alt: 'UPI', h: 'h-5' },
  { src: '/images/payments/visa.svg', alt: 'Visa', h: 'h-3.5' },
  { src: '/images/payments/mastercard.svg', alt: 'Mastercard', h: 'h-6' },
  { src: '/images/payments/rupay.svg', alt: 'RuPay', h: 'h-4' },
];

const chip = 'flex h-11 items-center justify-center rounded-xl bg-white px-4 ring-1 ring-zinc-200/80';

const PaymentTrust = ({ note = 'Instant activation' }) => (
  <section aria-label="Payment options" className="mt-10 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/80 sm:p-6">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]">
          <ShieldCheck size={22} />
        </span>
        <div>
          <p className="m-0 text-sm font-semibold text-[#10213D]">Safe and secure payments</p>
          <p className="m-0 mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
            Processed by Razorpay <span aria-hidden="true">·</span> <Zap size={12} className="text-[#1f8a57]" /> {note}
          </p>
        </div>
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="We accept">
        {LOGOS.map(({ src, alt, h }) => (
          <li key={alt} className={chip}>
            <img src={src} alt={alt} className={`${h} w-auto`} loading="lazy" />
          </li>
        ))}
        <li className={`${chip} gap-2`}>
          <Landmark size={17} className="shrink-0 text-[#10213D]" />
          <span className="text-xs font-semibold text-[#10213D]">Net banking</span>
        </li>
      </ul>
    </div>
  </section>
);

export default PaymentTrust;
