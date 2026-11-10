import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MotionIcon from '@/components/home/MotionIcon';

// Brand-green "hire with us" banner shared by the home and companies pages; the cut-out
// photo breaks out of the card's top edge on desktop.
const HireCta = ({
  eyebrow = 'For Recruiters & Companies',
  title = <>Ready to Hire India's <span className="text-[#10213D]">Best Talent?</span></>,
  text = 'Post a job in minutes and reach job seekers across Tamil Nadu and Puducherry.',
  primary = { to: '/register', label: 'Post a Job Free' },
  secondary = { to: '/company-login', label: 'Company Login' },
}) => (
  <section className="pt-16 lg:pt-32 pb-24 bg-white">
    <div className="max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-[2rem] bg-gradient-to-br from-[#3CC283] via-[#34B678] to-[#249a62] shadow-2xl shadow-[#34B678]/30"
      >
        {/* Decoration stays clipped to the card; the photo is not */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          {/* Wave lines: sweep in from the top-left behind the photo, then bundle into a band
              that runs just under the button row (buttons sit at ~66–82% of card height) */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none" fill="none">
            <defs>
              <linearGradient id="cta-wave-fade" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0.15" />
                <stop offset="0.35" stopColor="#fff" stopOpacity="0.55" />
                <stop offset="0.75" stopColor="#fff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d={`M0 ${30 + i * 9} C 150 ${-20 + i * 7}, 290 ${110 + i * 6}, 420 ${262 + i * 1.6} S 760 ${266 + i * 1.6}, 1000 ${252 + i * 2}`}
                stroke="url(#cta-wave-fade)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-white/10" />
        </div>

        <div className="relative lg:pl-[40%]">
          {/* Card height comes from the text. On desktop the photo is pinned to the card's
              bottom and sized off that height, so only the head rises above the top edge;
              capped so a longer text never grows the hand into the copy */}
          <motion.img
            src="/images/ads.png"
            alt="Happy candidate pointing to the call to action"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block absolute bottom-0 left-[4%] w-auto h-[120%] max-h-[370px] select-none [mask-image:linear-gradient(to_bottom,#000_72%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,#000_72%,transparent)]"
            draggable="false"
          />

          <div className="px-8 sm:px-12 py-12 lg:pl-0 lg:pr-14 lg:py-14 text-left">
            <p className="text-[#10213D] text-sm font-bold mb-3">{eyebrow}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight leading-tight">{title}</h2>
            <p className="text-white/90 text-base font-medium mb-8 max-w-xl leading-relaxed">{text}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-start">
              <Link to={primary.to} onClick={primary.onClick}>
                <Button className="group home-shine relative overflow-hidden h-12 px-8 rounded-xl bg-[#10213D] hover:bg-[#0b1830] text-white font-bold text-base shadow-lg shadow-[#10213D]/30 transition-all hover:-translate-y-0.5 cursor-pointer">
                  {primary.label} <MotionIcon icon={ArrowRight} animation="nudge" trigger="hover" size={18} />
                </Button>
              </Link>
              {secondary && (
                <Link to={secondary.to}>
                  <Button variant="outline" className="h-12 px-8 rounded-xl bg-white text-[#10213D] border-white hover:bg-white/90 hover:text-[#10213D] font-bold text-base cursor-pointer">
                    {secondary.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default HireCta;
