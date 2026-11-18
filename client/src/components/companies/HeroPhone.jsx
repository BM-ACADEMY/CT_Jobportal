import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, MapPin, Briefcase, Home, Building2, User, ArrowRight, Wifi, BatteryFull, Signal } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

const API = import.meta.env.VITE_API_BASE_URL;
const DOMAIN = import.meta.env.VITE_API_DOMAIN;
const EASE = [0.22, 1, 0.36, 1];
const CITIES = ['Chennai', 'Coimbatore', 'Puducherry', 'Madurai'];

// Loop: 0 list → 1 finger taps the first card → 2 detail sheet open → back to 0.
const PHASE_MS = [2600, 900, 2800];

// The photo (a hand holding an iPhone) is 800×1265 with the green screen keyed out.
// The app screen sits behind it, measured to that hole (+3px under the bezel each side).
const PHOTO = { w: 800, h: 1265 };
const SCREEN = { cx: 486, cy: 438, w: 391, h: 846, rotate: 0, radius: 51 };
// The app UI is laid out on a 248px-wide canvas and scaled down into the hole.
const CANVAS_W = 248;
const CANVAS_SCALE = SCREEN.w / CANVAS_W;

const roles = (c) => c.openPositions || c.openJobs?.length || 0;

const Logo = ({ c, size = 'w-10 h-10', text = 'text-base' }) => (
  <div className={`${size} shrink-0 rounded-xl overflow-hidden bg-white ring-1 ring-zinc-200/80`}>
    {c?.logo
      ? <img src={`${DOMAIN}${c.logo}`} alt="" className="w-full h-full object-cover" />
      : <div className={`w-full h-full flex items-center justify-center font-bold bg-[#eaf7f0] text-[#1f8a57] ${text}`}>{c?.name?.[0]?.toUpperCase() || ''}</div>}
  </div>
);

// Typewriter for the search field.
const useTypedCity = (enabled) => {
  const [text, setText] = useState(CITIES[0]);
  useEffect(() => {
    if (!enabled) return undefined;
    let city = 0;
    let i = CITIES[0].length;
    let deleting = true;
    let pause = 14;
    const id = setInterval(() => {
      if (pause > 0) { pause -= 1; return; }
      const word = CITIES[city];
      if (deleting) {
        i -= 1;
        if (i <= 0) { deleting = false; city = (city + 1) % CITIES.length; }
      } else {
        i += 1;
        if (i >= CITIES[city].length) { deleting = true; pause = 18; }
      }
      setText((deleting ? word : CITIES[city]).slice(0, Math.max(i, 0)));
    }, 90);
    return () => clearInterval(id);
  }, [enabled]);
  return text;
};

// Scale factor so the fixed-size artwork fits whatever width the column gives it.
const useFitScale = (ref) => {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setScale(el.clientWidth / PHOTO.w);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
};

const CompanyRow = ({ c, i, tapped, tapping }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0, scale: tapped ? 0.97 : 1 }}
    transition={{ duration: 0.45, delay: tapped ? 0 : 0.6 + i * 0.12, ease: EASE }}
    className={`relative flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 transition-shadow ${tapped ? 'ring-[#34B678] shadow-[0_8px_20px_-10px_rgba(52,182,120,0.6)]' : 'ring-zinc-100'}`}
  >
    {c ? <Logo c={c} /> : <div className="w-10 h-10 rounded-xl bg-zinc-100" />}
    <div className="min-w-0 flex-1">
      {c ? (
        <>
          <p className="m-0 text-[12.5px] font-bold text-[#10213D] truncate">{c.name}</p>
          <p className="m-0 mt-0.5 text-[10.5px] text-zinc-500 truncate flex items-center gap-1">
            <MapPin size={10} className="shrink-0" /> {c.location || c.industry || 'Company profile'}
          </p>
        </>
      ) : (
        <>
          <div className="h-2.5 w-24 rounded-full bg-zinc-200" />
          <div className="mt-1.5 h-2 w-16 rounded-full bg-zinc-100" />
        </>
      )}
    </div>
    {c && roles(c) > 0 && (
      <span className="shrink-0 text-[10px] font-bold text-[#1f8a57] bg-[#eaf7f0] rounded-md px-1.5 py-1">{roles(c)} open</span>
    )}
    {/* finger tap ripple */}
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {tapping && (
          <motion.span
            initial={{ opacity: 0, scale: 1.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35 }}
            className="block w-9 h-9 rounded-full bg-[#34B678]/30 ring-2 ring-[#34B678]"
          />
        )}
      </AnimatePresence>
    </span>
  </motion.div>
);

// What the phone shows: the companies screen of the app.
const AppScreen = ({ companies, phase, city }) => {
  const rows = companies.length ? companies : [null, null, null, null];
  const featured = companies[0];

  return (
    <div className="relative w-full h-full bg-[#f4faf7] overflow-hidden">
      {/* status bar (the photo's own Dynamic Island sits in the middle) */}
      <div className="flex items-center justify-between px-6 pt-[15px] text-[11px] font-bold text-[#10213D]">
        <span>9:41</span>
        <span className="flex items-center gap-1"><Signal size={12} /><Wifi size={12} /><BatteryFull size={15} /></span>
      </div>

      {/* app header */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between">
          <BrandLogo className="w-16" />
          <span className="w-8 h-8 rounded-full bg-white ring-1 ring-zinc-200 flex items-center justify-center text-zinc-500"><User size={14} /></span>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
          className="m-0 mt-4 text-[20px] leading-[1.15] font-bold text-[#10213D]"
        >
          Companies hiring<br /><span className="text-[#1f8a57]">near you</span>
        </motion.p>

        {/* search with typed city */}
        <div className="mt-3 flex items-center gap-2 h-10 rounded-xl bg-white ring-1 ring-zinc-200 px-3">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <span className="text-[12px] font-semibold text-[#10213D]">{city}</span>
          <span className="w-px h-3.5 bg-[#34B678] animate-pulse -ml-1.5" />
          <span className="ml-auto w-6 h-6 rounded-lg bg-[#34B678] text-white flex items-center justify-center"><Search size={12} /></span>
        </div>
      </div>

      {/* list */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="m-0 text-[12px] font-bold text-[#10213D]">Hiring now</p>
          <p className="m-0 text-[10.5px] font-bold text-[#1f8a57]">See all</p>
        </div>
        <div className="space-y-2">
          {rows.map((c, i) => (
            <CompanyRow
              key={c?._id || i}
              c={c}
              i={i}
              tapped={i === 0 && !!featured && phase >= 1}
              tapping={i === 0 && !!featured && phase === 1}
            />
          ))}
        </div>
      </div>

      {/* bottom nav */}
      <div className="absolute inset-x-3 bottom-4 h-12 rounded-2xl bg-white ring-1 ring-zinc-100 shadow-sm flex items-center justify-around text-zinc-400">
        <Home size={16} />
        <span className="w-9 h-9 rounded-xl bg-[#eaf7f0] text-[#1f8a57] flex items-center justify-center"><Building2 size={16} /></span>
        <Briefcase size={16} />
        <User size={16} />
      </div>

      {/* detail sheet */}
      <AnimatePresence>
        {phase === 2 && featured && (
          <motion.div key="dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#10213D]/25" />
        )}
        {phase === 2 && featured && (
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-x-0 bottom-0 rounded-t-[1.6rem] bg-white px-4 pt-2.5 pb-8 shadow-[0_-20px_40px_-20px_rgba(16,33,61,0.35)]"
          >
            <span className="block mx-auto w-10 h-1 rounded-full bg-zinc-200" />
            <div className="mt-3 flex items-center gap-3">
              <Logo c={featured} size="w-12 h-12" text="text-lg" />
              <div className="min-w-0">
                <p className="m-0 text-[14px] font-bold text-[#10213D] truncate">{featured.name}</p>
                <p className="m-0 text-[11px] text-zinc-500 truncate">{featured.industry || featured.location || 'Company profile'}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {featured.location && <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-zinc-600 bg-zinc-100 rounded-md px-2 py-1"><MapPin size={10} /> {featured.location}</span>}
              {roles(featured) > 0 && <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-[#1f8a57] bg-[#eaf7f0] rounded-md px-2 py-1"><Briefcase size={10} /> {roles(featured)} open role{roles(featured) === 1 ? '' : 's'}</span>}
            </div>
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: [0.96, 1, 0.98, 1] }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-4 h-10 rounded-xl bg-[#34B678] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#34B678]/30"
            >
              {roles(featured) > 0 ? 'View open roles' : 'View company'} <ArrowRight size={13} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HeroPhone = () => {
  const reduce = useReducedMotion();
  const [companies, setCompanies] = useState([]);
  const [phase, setPhase] = useState(0);
  const city = useTypedCity(!reduce);
  const boxRef = useRef(null);
  const scale = useFitScale(boxRef);

  useEffect(() => {
    let alive = true;
    axios.get(`${API}/public/companies?page=1&limit=12&type=company`)
      .then((res) => { if (alive) setCompanies([...(res.data?.companies || [])].sort((a, b) => roles(b) - roles(a)).slice(0, 4)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setTimeout(() => setPhase((p) => (p + 1) % PHASE_MS.length), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [phase, reduce]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      {/* Glow and rings behind the phone */}
      <div className="absolute left-[38%] right-[8%] top-[2%] bottom-[38%] rounded-[3rem] bg-gradient-to-tr from-[#34B678]/45 to-teal-200/40 blur-3xl" aria-hidden="true" />
      <svg className="absolute left-[61%] top-[35%] -translate-x-1/2 -translate-y-1/2 w-[105%] aspect-square pointer-events-none" viewBox="0 0 200 200" fill="none" aria-hidden="true">
        {[60, 75, 90].map((r, i) => (
          <motion.circle
            key={r}
            cx="100" cy="100" r={r}
            stroke="#34B678" strokeOpacity="0.25" strokeWidth="0.5" strokeDasharray={i === 1 ? '2 4' : undefined}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.3 + i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
        className="relative z-10"
        role="img"
        aria-label="A hand holding an iPhone with the Velaivaaipu app showing companies hiring near you"
      >
        <div className="home-float">
          <div ref={boxRef} className="relative w-full" style={{ aspectRatio: `${PHOTO.w} / ${PHOTO.h}` }}>
            <div
              className="absolute left-0 top-0 origin-top-left drop-shadow-[0_30px_35px_rgba(16,33,61,0.22)]"
              style={{ width: PHOTO.w, height: PHOTO.h, transform: `scale(${scale})` }}
              aria-hidden="true"
            >
              {/* app screen, behind the photo's cut-out */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: SCREEN.cx - SCREEN.w / 2,
                  top: SCREEN.cy - SCREEN.h / 2,
                  width: SCREEN.w,
                  height: SCREEN.h,
                  borderRadius: SCREEN.radius,
                  transform: `rotate(${SCREEN.rotate}deg)`,
                }}
              >
                <div className="origin-top-left" style={{ width: CANVAS_W, height: SCREEN.h / CANVAS_SCALE, transform: `scale(${CANVAS_SCALE})` }}>
                  <AppScreen companies={companies} phase={phase} city={city} />
                </div>
              </div>

              {/* real hand + iPhone frame on top */}
              <img
                src="/images/companies-hand-iphone.webp"
                alt=""
                width={PHOTO.w}
                height={PHOTO.h}
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full select-none pointer-events-none"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroPhone;
