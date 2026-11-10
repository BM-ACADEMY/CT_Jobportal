import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, Award, Check, CheckCheck, Download, FileSpreadsheet, GraduationCap, Mic,
  Paperclip, Phone, Smile, Video, Building2, Factory, Landmark, Store,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

// ── QR sign-up: a notice-board poster and the phone that scanned it ──────────
// A real, scannable QR code (version 3, level M) for https://velaivaaipu.in/register,
// generated once with the `qrcode` package and kept here as a path so the page needs no library.
const QR_SIZE = 29;
const QR_PATH = 'M0 0h1v1h-1zM1 0h1v1h-1zM2 0h1v1h-1zM3 0h1v1h-1zM4 0h1v1h-1zM5 0h1v1h-1zM6 0h1v1h-1zM8 0h1v1h-1zM11 0h1v1h-1zM12 0h1v1h-1zM15 0h1v1h-1zM16 0h1v1h-1zM17 0h1v1h-1zM18 0h1v1h-1zM19 0h1v1h-1zM22 0h1v1h-1zM23 0h1v1h-1zM24 0h1v1h-1zM25 0h1v1h-1zM26 0h1v1h-1zM27 0h1v1h-1zM28 0h1v1h-1zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM9 1h1v1h-1zM11 1h1v1h-1zM14 1h1v1h-1zM15 1h1v1h-1zM18 1h1v1h-1zM20 1h1v1h-1zM22 1h1v1h-1zM28 1h1v1h-1zM0 2h1v1h-1zM2 2h1v1h-1zM3 2h1v1h-1zM4 2h1v1h-1zM6 2h1v1h-1zM10 2h1v1h-1zM11 2h1v1h-1zM13 2h1v1h-1zM14 2h1v1h-1zM15 2h1v1h-1zM18 2h1v1h-1zM20 2h1v1h-1zM22 2h1v1h-1zM24 2h1v1h-1zM25 2h1v1h-1zM26 2h1v1h-1zM28 2h1v1h-1zM0 3h1v1h-1zM2 3h1v1h-1zM3 3h1v1h-1zM4 3h1v1h-1zM6 3h1v1h-1zM8 3h1v1h-1zM12 3h1v1h-1zM16 3h1v1h-1zM17 3h1v1h-1zM19 3h1v1h-1zM22 3h1v1h-1zM24 3h1v1h-1zM25 3h1v1h-1zM26 3h1v1h-1zM28 3h1v1h-1zM0 4h1v1h-1zM2 4h1v1h-1zM3 4h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM12 4h1v1h-1zM13 4h1v1h-1zM17 4h1v1h-1zM18 4h1v1h-1zM19 4h1v1h-1zM22 4h1v1h-1zM24 4h1v1h-1zM25 4h1v1h-1zM26 4h1v1h-1zM28 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM10 5h1v1h-1zM11 5h1v1h-1zM12 5h1v1h-1zM14 5h1v1h-1zM17 5h1v1h-1zM19 5h1v1h-1zM20 5h1v1h-1zM22 5h1v1h-1zM28 5h1v1h-1zM0 6h1v1h-1zM1 6h1v1h-1zM2 6h1v1h-1zM3 6h1v1h-1zM4 6h1v1h-1zM5 6h1v1h-1zM6 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM18 6h1v1h-1zM20 6h1v1h-1zM22 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM25 6h1v1h-1zM26 6h1v1h-1zM27 6h1v1h-1zM28 6h1v1h-1zM8 7h1v1h-1zM13 7h1v1h-1zM14 7h1v1h-1zM17 7h1v1h-1zM20 7h1v1h-1zM0 8h1v1h-1zM2 8h1v1h-1zM3 8h1v1h-1zM5 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM11 8h1v1h-1zM13 8h1v1h-1zM14 8h1v1h-1zM16 8h1v1h-1zM17 8h1v1h-1zM18 8h1v1h-1zM22 8h1v1h-1zM25 8h1v1h-1zM27 8h1v1h-1zM28 8h1v1h-1zM1 9h1v1h-1zM2 9h1v1h-1zM3 9h1v1h-1zM4 9h1v1h-1zM5 9h1v1h-1zM7 9h1v1h-1zM8 9h1v1h-1zM9 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM15 9h1v1h-1zM16 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM20 9h1v1h-1zM21 9h1v1h-1zM22 9h1v1h-1zM23 9h1v1h-1zM24 9h1v1h-1zM28 9h1v1h-1zM0 10h1v1h-1zM6 10h1v1h-1zM11 10h1v1h-1zM14 10h1v1h-1zM15 10h1v1h-1zM17 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM26 10h1v1h-1zM27 10h1v1h-1zM12 11h1v1h-1zM13 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM18 11h1v1h-1zM20 11h1v1h-1zM21 11h1v1h-1zM22 11h1v1h-1zM28 11h1v1h-1zM0 12h1v1h-1zM1 12h1v1h-1zM3 12h1v1h-1zM4 12h1v1h-1zM5 12h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM10 12h1v1h-1zM11 12h1v1h-1zM16 12h1v1h-1zM17 12h1v1h-1zM19 12h1v1h-1zM25 12h1v1h-1zM26 12h1v1h-1zM1 13h1v1h-1zM3 13h1v1h-1zM5 13h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1zM9 13h1v1h-1zM10 13h1v1h-1zM11 13h1v1h-1zM13 13h1v1h-1zM17 13h1v1h-1zM19 13h1v1h-1zM20 13h1v1h-1zM21 13h1v1h-1zM22 13h1v1h-1zM26 13h1v1h-1zM27 13h1v1h-1zM28 13h1v1h-1zM1 14h1v1h-1zM2 14h1v1h-1zM5 14h1v1h-1zM6 14h1v1h-1zM10 14h1v1h-1zM12 14h1v1h-1zM14 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM20 14h1v1h-1zM21 14h1v1h-1zM22 14h1v1h-1zM26 14h1v1h-1zM27 14h1v1h-1zM28 14h1v1h-1zM0 15h1v1h-1zM1 15h1v1h-1zM2 15h1v1h-1zM3 15h1v1h-1zM4 15h1v1h-1zM5 15h1v1h-1zM9 15h1v1h-1zM10 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM15 15h1v1h-1zM20 15h1v1h-1zM21 15h1v1h-1zM22 15h1v1h-1zM23 15h1v1h-1zM27 15h1v1h-1zM0 16h1v1h-1zM2 16h1v1h-1zM4 16h1v1h-1zM6 16h1v1h-1zM7 16h1v1h-1zM9 16h1v1h-1zM10 16h1v1h-1zM11 16h1v1h-1zM18 16h1v1h-1zM21 16h1v1h-1zM23 16h1v1h-1zM24 16h1v1h-1zM25 16h1v1h-1zM27 16h1v1h-1zM9 17h1v1h-1zM10 17h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM17 17h1v1h-1zM20 17h1v1h-1zM23 17h1v1h-1zM25 17h1v1h-1zM26 17h1v1h-1zM27 17h1v1h-1zM0 18h1v1h-1zM2 18h1v1h-1zM3 18h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM7 18h1v1h-1zM10 18h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM18 18h1v1h-1zM21 18h1v1h-1zM23 18h1v1h-1zM24 18h1v1h-1zM26 18h1v1h-1zM2 19h1v1h-1zM3 19h1v1h-1zM5 19h1v1h-1zM7 19h1v1h-1zM10 19h1v1h-1zM12 19h1v1h-1zM15 19h1v1h-1zM16 19h1v1h-1zM17 19h1v1h-1zM18 19h1v1h-1zM20 19h1v1h-1zM21 19h1v1h-1zM26 19h1v1h-1zM1 20h1v1h-1zM3 20h1v1h-1zM5 20h1v1h-1zM6 20h1v1h-1zM7 20h1v1h-1zM8 20h1v1h-1zM10 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM15 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM18 20h1v1h-1zM19 20h1v1h-1zM20 20h1v1h-1zM21 20h1v1h-1zM22 20h1v1h-1zM23 20h1v1h-1zM24 20h1v1h-1zM25 20h1v1h-1zM26 20h1v1h-1zM8 21h1v1h-1zM10 21h1v1h-1zM13 21h1v1h-1zM14 21h1v1h-1zM15 21h1v1h-1zM19 21h1v1h-1zM20 21h1v1h-1zM24 21h1v1h-1zM25 21h1v1h-1zM26 21h1v1h-1zM27 21h1v1h-1zM28 21h1v1h-1zM0 22h1v1h-1zM1 22h1v1h-1zM2 22h1v1h-1zM3 22h1v1h-1zM4 22h1v1h-1zM5 22h1v1h-1zM6 22h1v1h-1zM8 22h1v1h-1zM9 22h1v1h-1zM11 22h1v1h-1zM13 22h1v1h-1zM19 22h1v1h-1zM20 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM25 22h1v1h-1zM27 22h1v1h-1zM0 23h1v1h-1zM6 23h1v1h-1zM8 23h1v1h-1zM9 23h1v1h-1zM11 23h1v1h-1zM15 23h1v1h-1zM16 23h1v1h-1zM18 23h1v1h-1zM20 23h1v1h-1zM24 23h1v1h-1zM25 23h1v1h-1zM27 23h1v1h-1zM0 24h1v1h-1zM2 24h1v1h-1zM3 24h1v1h-1zM4 24h1v1h-1zM6 24h1v1h-1zM10 24h1v1h-1zM11 24h1v1h-1zM14 24h1v1h-1zM15 24h1v1h-1zM16 24h1v1h-1zM17 24h1v1h-1zM20 24h1v1h-1zM21 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM24 24h1v1h-1zM26 24h1v1h-1zM28 24h1v1h-1zM0 25h1v1h-1zM2 25h1v1h-1zM3 25h1v1h-1zM4 25h1v1h-1zM6 25h1v1h-1zM8 25h1v1h-1zM12 25h1v1h-1zM13 25h1v1h-1zM14 25h1v1h-1zM15 25h1v1h-1zM16 25h1v1h-1zM17 25h1v1h-1zM18 25h1v1h-1zM19 25h1v1h-1zM20 25h1v1h-1zM21 25h1v1h-1zM23 25h1v1h-1zM24 25h1v1h-1zM25 25h1v1h-1zM27 25h1v1h-1zM0 26h1v1h-1zM2 26h1v1h-1zM3 26h1v1h-1zM4 26h1v1h-1zM6 26h1v1h-1zM8 26h1v1h-1zM10 26h1v1h-1zM11 26h1v1h-1zM12 26h1v1h-1zM13 26h1v1h-1zM14 26h1v1h-1zM18 26h1v1h-1zM19 26h1v1h-1zM20 26h1v1h-1zM23 26h1v1h-1zM26 26h1v1h-1zM28 26h1v1h-1zM0 27h1v1h-1zM6 27h1v1h-1zM11 27h1v1h-1zM12 27h1v1h-1zM15 27h1v1h-1zM16 27h1v1h-1zM18 27h1v1h-1zM20 27h1v1h-1zM21 27h1v1h-1zM25 27h1v1h-1zM27 27h1v1h-1zM0 28h1v1h-1zM1 28h1v1h-1zM2 28h1v1h-1zM3 28h1v1h-1zM4 28h1v1h-1zM5 28h1v1h-1zM6 28h1v1h-1zM8 28h1v1h-1zM12 28h1v1h-1zM14 28h1v1h-1zM18 28h1v1h-1zM19 28h1v1h-1zM20 28h1v1h-1zM21 28h1v1h-1zM25 28h1v1h-1zM27 28h1v1h-1z';
export const QrFinder = ({ className = '' }) => (
  <svg viewBox={`-2 -2 ${QR_SIZE + 4} ${QR_SIZE + 4}`} className={className} shapeRendering="crispEdges" role="img" aria-label="QR code to join Velaivaaipu">
    <rect x="-2" y="-2" width={QR_SIZE + 4} height={QR_SIZE + 4} fill="#fff" />
    <path d={QR_PATH} fill="#0b1220" />
  </svg>
);

const NUMBER = '98765 43210';
const useTyped = (text, { step = 140, hold = 1600 } = {}) => {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setTimeout(() => setN((v) => (v >= text.length ? 0 : v + 1)), n >= text.length ? hold : step);
    return () => clearTimeout(id);
  }, [n, reduce, text.length, step, hold]);
  return text.slice(0, n);
};

// iPhone 15 Pro look, same as the home page phone: titanium rail, side buttons, black glass
// border, Dynamic Island, iOS status glyphs and the home indicator.
const TITANIUM = 'linear-gradient(160deg,#e4e3df 0%,#9c9b97 14%,#d3d2cd 30%,#7d7c78 52%,#c8c7c2 72%,#8f8e8a 88%,#dcdbd6 100%)';
const RAIL_BUTTON = 'linear-gradient(90deg,#6f6e6a 0%,#d6d5d0 45%,#a3a29e 70%,#6c6b67 100%)';
const IOS_FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif' };

const IPhone = ({ children, className = '' }) => (
  <div className={`relative w-[200px] h-[412px] shrink-0 ${className}`}>
    <span className="absolute -left-[2px] top-[78px] h-[18px] w-[3px] rounded-l-[2px]" style={{ background: RAIL_BUTTON }} />
    <span className="absolute -left-[2px] top-[110px] h-[32px] w-[3px] rounded-l-[2px]" style={{ background: RAIL_BUTTON }} />
    <span className="absolute -left-[2px] top-[150px] h-[32px] w-[3px] rounded-l-[2px]" style={{ background: RAIL_BUTTON }} />
    <span className="absolute -right-[2px] top-[124px] h-[50px] w-[3px] rounded-r-[2px]" style={{ background: RAIL_BUTTON }} />
    <div
      className="relative h-full w-full rounded-[40px] p-[3px]"
      style={{ background: TITANIUM, boxShadow: 'inset 0 0 0 0.75px rgba(255,255,255,0.7), inset 0 0 0 1.5px rgba(0,0,0,0.18), 0 30px 60px -25px rgba(15,23,42,0.55), 0 60px 110px -45px rgba(15,23,42,0.4)' }}
    >
      <span className="absolute left-0 top-[54px] h-[2px] w-[3px] bg-[#6e6d69]/70" />
      <span className="absolute right-0 top-[54px] h-[2px] w-[3px] bg-[#6e6d69]/70" />
      <span className="absolute left-0 bottom-[54px] h-[2px] w-[3px] bg-[#6e6d69]/70" />
      <span className="absolute right-0 bottom-[54px] h-[2px] w-[3px] bg-[#6e6d69]/70" />
      <div className="h-full w-full rounded-[37px] bg-[#050505] p-[5px]" style={{ boxShadow: 'inset 0 0 0 1px #1c1c1e' }}>
        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white" style={IOS_FONT}>
          <div className="absolute inset-x-0 top-0 z-30 grid h-[34px] grid-cols-[1fr_62px_1fr] items-center text-zinc-950">
            <span className="justify-self-center pl-1 text-[11px] font-semibold">9:41</span>
            <span />
            <span className="justify-self-center flex items-center gap-[3px] pr-1">
              <svg width="13" height="8" viewBox="0 0 17 11"><g fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.8" /><rect x="4.6" y="5" width="3" height="6" rx="0.8" /><rect x="9.2" y="2.6" width="3" height="8.4" rx="0.8" /><rect x="13.8" y="0" width="3" height="11" rx="0.8" /></g></svg>
              <svg width="11" height="8" viewBox="0 0 15 11"><g fill="currentColor"><path d="M7.5 2.2c2.2 0 4.2.85 5.7 2.25l1.1-1.13A9.6 9.6 0 0 0 7.5.6 9.6 9.6 0 0 0 .7 3.32L1.8 4.45A8 8 0 0 1 7.5 2.2Z" /><path d="M7.5 5.3c1.36 0 2.6.5 3.55 1.35l1.1-1.13A6.7 6.7 0 0 0 7.5 3.7c-1.8 0-3.44.7-4.65 1.82l1.1 1.13A5.1 5.1 0 0 1 7.5 5.3Z" /><path d="M7.5 8.4c.5 0 .97.18 1.33.48L7.5 10.6 6.17 8.88c.36-.3.83-.48 1.33-.48Z" /></g></svg>
              <svg width="19" height="9" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3.4" fill="none" stroke="currentColor" strokeOpacity="0.4" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" fillOpacity="0.45" /></svg>
            </span>
          </div>
          <span className="absolute z-40 top-[8px] left-1/2 -translate-x-1/2 h-[19px] w-[62px] rounded-full bg-black">
            <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[7px] w-[7px] rounded-full" style={{ background: 'radial-gradient(circle at 35% 35%, #3a4a6b 0%, #141a2b 45%, #050608 75%)' }} />
          </span>
          <div className="absolute inset-x-0 top-[34px] bottom-0">{children}</div>
          <span className="absolute z-30 bottom-[6px] left-1/2 -translate-x-1/2 h-[3.5px] w-[72px] rounded-full bg-black" />
          <span className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(115deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_22%,transparent_34%)]" />
        </div>
      </div>
    </div>
  </div>
);

export const SignupVisual = () => {
  const typed = useTyped(NUMBER);
  const done = typed.length === NUMBER.length;
  return (
    <div className="relative mx-auto h-[430px] w-[340px] max-w-full flex items-center justify-end" aria-hidden="true">
      {/* Poster pinned to the notice board */}
      <div className="absolute left-0 bottom-10 z-20 w-[116px] p-2 sm:w-[150px] sm:p-3 rounded-md bg-[#fffdf5] shadow-xl shadow-zinc-900/15 ring-1 ring-black/5 -rotate-3 transition-transform duration-500 group-hover:-rotate-6">
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-500 shadow ring-2 ring-red-700/30" />
        <p className="text-[9px] font-black uppercase tracking-wider text-[#059669]">Placement cell</p>
        <p className="mt-0.5 text-[11px] font-bold leading-tight text-zinc-900">Scan to join this year&apos;s drives</p>
        <div className="mt-2 rounded bg-white p-1 ring-1 ring-zinc-200"><QrFinder className="block w-full h-auto" /></div>
        <p className="mt-1.5 text-center text-[8px] font-semibold text-zinc-500">velaivaaipu.in</p>
      </div>

      <IPhone className="z-10 transition-transform duration-500 group-hover:-translate-y-1">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-zinc-100">
          <img src="/velaivaaipu-mark.png" alt="" className="h-4 w-auto" />
          <span className="text-[9px] font-semibold text-zinc-400">Step 1 of 2</span>
        </div>
        <div className="px-3.5 pt-3">
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center"><GraduationCap size={16} /></span>
          <p className="mt-2 text-[13px] font-bold leading-tight text-zinc-900">Join your placement cell</p>
          <p className="text-[9px] text-zinc-500">Takes about 20 seconds</p>
          <p className="mt-3 text-[8.5px] font-semibold text-zinc-500">Full name</p>
          <div className="mt-1 rounded-[10px] bg-zinc-100/80 px-2.5 py-2 text-[11px] text-zinc-900">Aakash M</div>
          <p className="mt-2 text-[8.5px] font-semibold text-zinc-500">WhatsApp number</p>
          <div className={`mt-1 flex items-center rounded-[10px] bg-white px-2.5 py-2 text-[11px] text-zinc-900 transition-shadow ${done ? 'ring-1 ring-emerald-300' : 'ring-2 ring-emerald-400'}`}>
            <span className="text-zinc-400 mr-1">+91</span>{typed}
            {!done && <span className="ml-px inline-block w-px h-3.5 bg-[#059669] animate-[college-caret_1s_steps(1)_infinite] motion-reduce:animate-none" />}
            {done && <Check size={12} className="ml-auto text-emerald-600" strokeWidth={3} />}
          </div>
          <div className={`mt-3.5 h-9 rounded-[10px] text-[11px] font-bold flex items-center justify-center transition-colors duration-300 ${done ? 'bg-[#059669] text-white' : 'bg-emerald-100 text-emerald-700'}`}>
            Join and take a skill test
          </div>
          <p className="mt-2 text-center text-[8.5px] text-zinc-400">No password needed</p>
        </div>
        {/* iOS number pad while typing; slides away once the number is in */}
        <div className={`absolute inset-x-0 bottom-0 bg-[#d1d4da] px-1.5 pt-1.5 pb-4 transition-transform duration-500 ${done ? 'translate-y-full' : 'translate-y-0'}`}>
          <div className="grid grid-cols-3 gap-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
              <span key={i} className={`h-5 rounded-[5px] flex items-center justify-center text-[11px] ${k && k !== '⌫' ? 'bg-white shadow-[0_1px_0_rgba(0,0,0,0.3)] text-zinc-900' : 'text-zinc-700'}`}>{k}</span>
            ))}
          </div>
        </div>
      </IPhone>
    </div>
  );
};

// ── Certificate: paper, seal, signature ─────────────────────────────────────
export const CertificateVisual = () => (
  <div className="relative mx-auto w-full max-w-[290px] aspect-[1.414/1] rounded-md bg-[#fffdf7] p-2 shadow-lg shadow-amber-900/10 ring-1 ring-amber-200/70 transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-1deg]" aria-hidden="true">
    <div className="relative h-full rounded-sm border-[3px] border-double border-amber-400/80 px-4 pt-3 pb-2 text-center flex flex-col">
      <div className="flex items-center justify-center gap-1.5">
        <span className="w-5 h-5 rounded bg-[#059669] text-white flex items-center justify-center"><GraduationCap size={11} /></span>
        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-600">Your College Name</span>
      </div>
      <p className="mt-1.5 font-serif text-[13px] font-bold tracking-wide text-[#10213D]">Certificate of Achievement</p>
      <p className="text-[7px] uppercase tracking-[0.2em] text-zinc-500">This is awarded to</p>
      <p className="mt-0.5 font-serif italic text-[18px] leading-tight text-zinc-900">Aakash M</p>
      <div className="mx-auto mt-0.5 h-px w-28 bg-amber-300" />
      <p className="mt-1 text-[8px] leading-snug text-zinc-600">for passing the <b className="text-zinc-800">Communication Skills</b> test</p>
      <div className="mt-auto flex items-end justify-between">
        <div className="text-left">
          <svg viewBox="0 0 60 18" className="w-12 h-3.5" aria-hidden="true"><path d="M2 14 C 8 2, 12 16, 18 8 S 28 4, 30 12 S 42 2, 46 10 S 54 12, 58 6" fill="none" stroke="#1e3a8a" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <p className="border-t border-zinc-300 pt-0.5 text-[6.5px] text-zinc-500">Placement Officer</p>
        </div>
        {/* Gold seal */}
        <div className="relative -mb-1 w-11 h-11">
          <svg viewBox="0 0 40 40" className="absolute inset-0" aria-hidden="true">
            <defs><radialGradient id="seal" cx="0.35" cy="0.35" r="0.7"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#d97706" /></radialGradient></defs>
            <path d="M14 30 L 10 40 L 16 37 L 19 40 L 20 31 Z M26 30 L 30 40 L 24 37 L 21 40 L 20 31 Z" fill="#059669" />
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return <circle key={i} cx={20 + Math.cos(a) * 14} cy={18 + Math.sin(a) * 14} r="3.2" fill="url(#seal)" />;
            })}
            <circle cx="20" cy="18" r="13" fill="url(#seal)" stroke="#b45309" strokeWidth="0.6" />
            <circle cx="20" cy="18" r="10" fill="none" stroke="#fff7" strokeWidth="0.6" strokeDasharray="1 1.4" />
          </svg>
          <Award size={13} className="absolute left-1/2 top-[18px] -translate-x-1/2 -translate-y-1/2 text-amber-900" />
        </div>
        <div className="text-right">
          <p className="text-[7px] font-semibold text-zinc-700">ID VV-CS-0142</p>
          <p className="border-t border-zinc-300 pt-0.5 text-[6.5px] text-zinc-500">Verify online</p>
        </div>
      </div>
    </div>
  </div>
);

// ── CSV upload: a spreadsheet whose rows turn into accounts ─────────────────
const ROWS = [['Arun K', 'CSE', '2026'], ['Divya R', 'ECE', '2026'], ['Mohamed S', 'MECH', '2026'], ['Priya V', 'CSE', '2026']];
export const CsvVisual = () => {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(reduce ? ROWS.length : 0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setTimeout(() => setDone((d) => (d > ROWS.length ? 0 : d + 1)), done > ROWS.length - 1 ? 1600 : 650);
    return () => clearTimeout(id);
  }, [done, reduce]);
  const shown = Math.min(done, ROWS.length);
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/80 text-[11px]" aria-hidden="true">
      <div className="flex items-center gap-2 bg-[#107C41] px-3 py-2 text-white">
        <FileSpreadsheet size={14} />
        <span className="font-semibold truncate">students_cse_2026.csv</span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-zinc-500">
            <th className="w-6 border-b border-r border-zinc-200 font-normal" />
            {['Name', 'Dept', 'Batch', ''].map((h, i) => <th key={i} className="border-b border-r border-zinc-200 px-2 py-1 text-left font-semibold last:border-r-0">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => (
            <tr key={r[0]} className={`transition-colors duration-300 ${i < shown ? 'bg-emerald-50/60' : ''}`}>
              <td className="border-b border-r border-zinc-200 bg-zinc-50 text-center text-zinc-400">{i + 2}</td>
              {r.map((c) => <td key={c} className="border-b border-r border-zinc-200 px-2 py-1 text-zinc-800">{c}</td>)}
              <td className="border-b border-zinc-200 px-2 py-1 w-7">
                <span className={`flex w-4 h-4 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-300 ${i < shown ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}><Check size={10} strokeWidth={3} /></span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-zinc-500">{shown < ROWS.length ? 'Creating accounts…' : 'All accounts created'}</span>
        <span className="h-1.5 w-20 rounded-full bg-zinc-100 overflow-hidden"><span className="block h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${(shown / ROWS.length) * 100}%` }} /></span>
      </div>
    </div>
  );
};

// ── Report: a dashboard chart with axes, values and a hover tooltip ─────────
const REPORT = [['CSE', 82], ['ECE', 64], ['MECH', 48], ['EEE', 56], ['MBA', 72]];
export const ReportVisual = () => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80" aria-hidden="true">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[12px] font-bold text-zinc-900">Placement report</p>
        <p className="text-[10px] text-zinc-500">2025–26 batch · placed students, %</p>
      </div>
      <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-700"><Download size={11} /> PDF</span>
    </div>
    <div className="mt-2 inline-flex rounded-md bg-zinc-100 p-0.5 text-[10px] font-semibold">
      <span className="rounded bg-white px-2 py-0.5 text-zinc-900 shadow-sm">By department</span>
      <span className="px-2 py-0.5 text-zinc-500">By drive</span>
    </div>
    <div className="relative mt-3 h-32 pl-6">
      {[100, 75, 50, 25, 0].map((v, i) => (
        <div key={v} className="absolute left-0 right-0 flex items-center gap-1" style={{ top: `${i * 25}%` }}>
          <span className="w-5 -translate-y-1/2 text-right text-[8px] text-zinc-400">{v}</span>
          <span className="flex-1 -translate-y-1/2 border-t border-dashed border-zinc-200" />
        </div>
      ))}
      <div className="relative h-full flex items-end gap-3 pl-1">
        {REPORT.map(([dept, v], i) => (
          <div key={dept} className="group/bar relative flex-1 h-full flex items-end">
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 * i, ease: EASE }}
              style={{ height: `${v}%` }}
              className="relative w-full origin-bottom rounded-t-md bg-gradient-to-t from-[#059669] to-[#34d399] transition-[filter] group-hover/bar:brightness-110"
            >
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-zinc-700">{v}%</span>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-1 flex gap-3 pl-7">
      {REPORT.map(([dept]) => <span key={dept} className="flex-1 text-center text-[9px] font-bold text-zinc-500">{dept}</span>)}
    </div>
  </div>
);

// ── WhatsApp: the chat a student actually receives ──────────────────────────
const bubbleIn = (delay) => ({
  initial: { opacity: 0, y: 10, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: EASE },
});
export const WhatsAppVisual = () => (
  <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-200" aria-hidden="true">
    <div className="flex items-center gap-2 bg-[#008069] px-2.5 py-2 text-white">
      <ArrowLeft size={14} />
      <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden ring-1 ring-white/60"><img src="/velaivaaipu-mark.png" alt="" className="w-5 h-auto" /></span>
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-[11px] font-semibold truncate">Velaivaaipu</p>
        <p className="text-[9px] text-white/75">Business account</p>
      </div>
      <Video size={14} className="opacity-90" />
      <Phone size={13} className="opacity-90 ml-2" />
    </div>
    <div
      className="px-2.5 py-3 space-y-1.5"
      style={{ backgroundColor: '#EFEAE2', backgroundImage: 'radial-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)', backgroundSize: '12px 12px' }}
    >
      <p className="mx-auto w-fit rounded-md bg-white/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-500 shadow-sm">Today</p>
      <motion.div {...bubbleIn(0.1)} className="max-w-[88%] rounded-lg rounded-tl-none bg-white text-[10.5px] text-zinc-800 shadow-sm overflow-hidden">
        <div className="px-2.5 pt-2 pb-1">
          <p className="font-bold">Round 2: Technical interview</p>
          <p className="mt-1">📅 Tomorrow, 10:00 AM</p>
          <p>📍 Seminar Hall B</p>
          <p className="mt-1 text-zinc-600">Carry your resume and college ID.</p>
          <span className="block text-right text-[8px] text-zinc-400">10:02</span>
        </div>
        <div className="border-t border-zinc-100 py-1.5 text-center text-[10.5px] font-semibold text-[#027EB5]">View details</div>
      </motion.div>
      <motion.div {...bubbleIn(0.7)} className="ml-auto w-fit max-w-[70%] rounded-lg rounded-tr-none bg-[#D9FDD3] px-2.5 py-1.5 text-[10.5px] text-zinc-800 shadow-sm">
        Thank you, I&apos;ll be there.
        <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[8px] text-zinc-400">10:04 <CheckCheck size={11} className="text-[#53BDEB]" /></span>
      </motion.div>
    </div>
    <div className="flex items-center gap-1.5 bg-[#F0F2F5] px-2 py-1.5">
      <div className="flex-1 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-[10px] text-zinc-400">
        <Smile size={12} /> <span className="flex-1">Message</span> <Paperclip size={11} />
      </div>
      <span className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center"><Mic size={13} /></span>
    </div>
  </div>
);

// ── Company drives: who was invited and who said yes ────────────────────────
const INVITES = [
  { icon: Building2, sector: 'IT services', role: 'Software trainee', status: 'Accepted', tone: 'bg-emerald-50 text-emerald-700' },
  { icon: Landmark, sector: 'Private bank', role: 'Relationship officer', status: 'Accepted', tone: 'bg-emerald-50 text-emerald-700' },
  { icon: Factory, sector: 'Manufacturing', role: 'Graduate engineer', status: 'Invited', tone: 'bg-amber-50 text-amber-700' },
  { icon: Store, sector: 'Retail chain', role: 'Store trainee', status: 'Awaiting reply', tone: 'bg-zinc-100 text-zinc-600' },
];
export const DrivesVisual = () => (
  <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/80" aria-hidden="true">
    <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
      <p className="text-[11px] font-bold text-zinc-900">Campus drive · Final year</p>
      <span className="text-[10px] font-semibold text-[#059669]">+ Invite</span>
    </div>
    <ul className="divide-y divide-zinc-100">
      {INVITES.map((c, i) => (
        <motion.li key={c.sector} {...bubbleIn(0.08 * i)} className="flex items-center gap-2.5 px-3 py-2">
          <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center"><c.icon size={14} /></span>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-[11px] font-semibold text-zinc-900 truncate">{c.sector}</p>
            <p className="text-[9.5px] text-zinc-500 truncate">{c.role}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold ${c.tone}`}>{c.status}</span>
        </motion.li>
      ))}
    </ul>
  </div>
);
