import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Trash2, Download, ArrowLeft, Edit3, Palette,
  User, AlignLeft, Briefcase, BookOpen, Code2, FolderGit2, Award,
  ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff, Copy,
  Clock, Check, MoreHorizontal, Sparkles, X
} from 'lucide-react';
import FeatureGate from '@/components/subscription/FeatureGate';

// ─── LocalStorage ─────────────────────────────────────────────────────────────
const STORE_KEY = 'ct_resumes_v1';
const load = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } };
const save = (arr) => localStorage.setItem(STORE_KEY, JSON.stringify(arr));

// ─── Blank Data ───────────────────────────────────────────────────────────────
const BLANK_DATA = {
  personal: { name: '', title: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
};

// ─── Default Style ────────────────────────────────────────────────────────────
const DEFAULT_STYLE = {
  font: 'georgia',
  accent: '#10b981',
  // Header
  headerAlign: 'left',
  detailsArrangement: 'stacked',
  detailsSeparator: 'bullet',
  // Section Headings
  headingStyle: 'accent-underline',
  headingCapitalization: 'uppercase',
  headingSize: 'sm',
  headingIcons: 'none',
  // Accent color application
  accentName: true,
  accentJobTitle: false,
  accentHeadings: true,
  accentHeadingsLine: true,
  accentHeaderIcons: false,
  accentDots: false,
  accentDates: false,
  accentSubtitle: false,
  accentLinkIcons: false,
  // Entry layout
  entryLayout: 'title-right',
  entryTitleSize: 'sm',
  subtitleStyle: 'italic',
  subtitlePlacement: 'same-line',
  // Spacing
  fontSize: 10.5,
  lineHeight: 1.45,
  marginLR: 20,
  marginTB: 18,
  entrySpacing: 8,
  // Layout
  columns: 'one',
  showDividers: true,
  // Region
  dateFormat: 'MMM YYYY',
  pageFormat: 'a4',
  // Sections
  sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
  hidden: [],
};

const mergeStyle = (saved) => {
  if (!saved) return { ...DEFAULT_STYLE };
  const m = { ...DEFAULT_STYLE, ...saved };
  if (typeof m.fontSize === 'string') m.fontSize = 10.5;
  if (typeof m.lineHeight !== 'number') m.lineHeight = saved.spacing === 'compact' ? 1.3 : saved.spacing === 'relaxed' ? 1.8 : 1.45;
  if (typeof m.marginLR !== 'number') { m.marginLR = saved.margins === 'narrow' ? 14 : saved.margins === 'wide' ? 28 : 20; m.marginTB = saved.margins === 'narrow' ? 12 : saved.margins === 'wide' ? 24 : 18; }
  if (!m.headerAlign) m.headerAlign = saved.header || 'left';
  if (!m.pageFormat) m.pageFormat = saved.pageSize || 'a4';
  return m;
};

// ─── Factories ────────────────────────────────────────────────────────────────
const mkId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const newExp  = () => ({ id: mkId(), company: '', role: '', start: '', end: '', current: false, bullets: '' });
const newEdu  = () => ({ id: mkId(), school: '', degree: '', field: '', start: '', end: '', gpa: '' });
const newProj = () => ({ id: mkId(), name: '', tech: '', link: '', description: '' });
const newCert = () => ({ id: mkId(), name: '', issuer: '', date: '' });

// ─── Presets ──────────────────────────────────────────────────────────────────
const FONTS = [
  { id: 'georgia',   name: 'Classic',   stack: "Georgia, 'Times New Roman', serif" },
  { id: 'system',    name: 'Modern',    stack: "-apple-system, 'Segoe UI', Arial, sans-serif" },
  { id: 'palatino',  name: 'Elegant',   stack: "'Palatino Linotype', Palatino, Georgia, serif" },
  { id: 'trebuchet', name: 'Executive', stack: "'Trebuchet MS', Arial, sans-serif" },
  { id: 'times',     name: 'Academic',  stack: "'Times New Roman', Times, serif" },
  { id: 'courier',   name: 'Technical', stack: "'Courier New', Courier, monospace" },
];

const COLORS = ['#10b981', '#3b82f6', '#7c3aed', '#f43f5e', '#f59e0b', '#14b8a6', '#64748b', '#0f172a'];
const COLOR_NAMES = { '#10b981': 'Emerald', '#3b82f6': 'Blue', '#7c3aed': 'Violet', '#f43f5e': 'Rose', '#f59e0b': 'Amber', '#14b8a6': 'Teal', '#64748b': 'Slate', '#0f172a': 'Black' };

const ALL_SEC = [
  { key: 'summary',        label: 'Summary',        icon: AlignLeft  },
  { key: 'experience',     label: 'Experience',     icon: Briefcase  },
  { key: 'education',      label: 'Education',      icon: BookOpen   },
  { key: 'skills',         label: 'Skills',         icon: Code2      },
  { key: 'projects',       label: 'Projects',       icon: FolderGit2 },
  { key: 'certifications', label: 'Certifications', icon: Award      },
];

const CONTENT_SECTIONS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  ...ALL_SEC,
];

const HEADING_STYLE_IDS = ['plain', 'boxed', 'centered', 'underline', 'accent-underline', 'double-line', 'left-bar', 'wavy'];

// ─── Heading style computation ─────────────────────────────────────────────────
const getH2Style = (ST) => {
  const hColor = ST.accentHeadings ? ST.accent : '#1e293b';
  const lColor = ST.accentHeadingsLine ? ST.accent : '#cbd5e1';
  const sizes = { sm: 9, md: 11, lg: 13, xl: 15 };
  const sz = sizes[ST.headingSize] || 9;
  const cap = ST.headingCapitalization === 'uppercase' ? 'uppercase' : 'capitalize';
  const ls = ST.headingCapitalization === 'uppercase' ? '1.5px' : '0px';
  const base = { fontSize: `${sz}px`, fontWeight: '700', textTransform: cap, letterSpacing: ls, color: hColor, marginBottom: '10px', paddingBottom: 0, borderBottom: 'none', display: 'block' };
  switch (ST.headingStyle) {
    case 'plain':          return base;
    case 'boxed':          return { ...base, border: `1px solid ${lColor}`, padding: '3px 8px', display: 'inline-block', borderRadius: '2px' };
    case 'centered':       return { ...base, textAlign: 'center' };
    case 'underline':      return { ...base, borderBottom: `1px solid ${lColor}`, paddingBottom: '4px' };
    case 'accent-underline': return { ...base, borderBottom: `2px solid ${lColor}`, paddingBottom: '5px' };
    case 'double-line':    return { ...base, borderTop: `1px solid ${lColor}`, borderBottom: `1px solid ${lColor}`, padding: '3px 0', textAlign: 'center' };
    case 'left-bar':       return { ...base, borderLeft: `3px solid ${ST.accent}`, paddingLeft: '8px' };
    case 'wavy':           return { ...base, textDecoration: `underline wavy ${lColor}`, textDecorationSkipInk: 'none' };
    default:               return { ...base, borderBottom: `2px solid ${lColor}`, paddingBottom: '5px' };
  }
};

// ─── Form primitives ──────────────────────────────────────────────────────────
const FL = ({ children }) => <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{children}</label>;
const FI = ({ className = '', ...p }) => <input {...p} className={`w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400 transition-colors ${className}`} />;
const FT = ({ className = '', ...p }) => <textarea {...p} className={`w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-emerald-400 transition-colors resize-none ${className}`} />;
const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} className="w-full h-10 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/40 transition-all flex items-center justify-center gap-2">
    <Plus size={13} /> {label}
  </button>
);
const CDiv = ({ label }) => (
  <div className="flex items-center gap-2 mt-5 mb-3">
    <div className="h-px bg-slate-100 flex-1" />
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="h-px bg-slate-100 flex-1" />
  </div>
);
const SliderControl = ({ label, value, min, max, step, unit, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-700">{label}</p>
      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{value}{unit}</span>
    </div>
    <div className="flex items-center gap-2">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-emerald-500 cursor-pointer" />
      <button onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(2))))}
        className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold shrink-0">−</button>
      <button onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(2))))}
        className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold shrink-0">+</button>
    </div>
  </div>
);
const Toggle = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-200'}`}>
    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
  </button>
);
const SelBtn = ({ opts, val, onSelect, cols = 3 }) => (
  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
    {opts.map(o => (
      <button key={o.id} onClick={() => onSelect(o.id)}
        className={`py-2 rounded-xl border-2 text-xs font-bold transition-all ${val === o.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
        {o.label}
      </button>
    ))}
  </div>
);

// ─── Section Forms ────────────────────────────────────────────────────────────
const PersonalForm = ({ d, set }) => (
  <div className="space-y-3">
    <div><FL>Full Name *</FL><FI value={d.name} onChange={e => set('name', e.target.value)} placeholder="Arjun Kumar" /></div>
    <div><FL>Job Title</FL><FI value={d.title} onChange={e => set('title', e.target.value)} placeholder="Senior Frontend Engineer" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><FL>Email *</FL><FI type="email" value={d.email} onChange={e => set('email', e.target.value)} placeholder="arjun@email.com" /></div>
      <div><FL>Phone</FL><FI value={d.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
    </div>
    <div><FL>Location</FL><FI value={d.location} onChange={e => set('location', e.target.value)} placeholder="Bangalore, Karnataka" /></div>
    <div className="grid grid-cols-2 gap-3">
      <div><FL>LinkedIn</FL><FI value={d.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/arjun" /></div>
      <div><FL>GitHub / Website</FL><FI value={d.website} onChange={e => set('website', e.target.value)} placeholder="github.com/arjun" /></div>
    </div>
  </div>
);

const SummaryForm = ({ v, set }) => (
  <div>
    <FL>Professional Summary</FL>
    <FT rows={6} value={v} onChange={e => set(e.target.value)} placeholder="Results-driven software engineer with 4+ years building scalable web applications. Passionate about clean code and great UX." />
    <p className="text-[10px] text-slate-400 mt-2">3–4 sentences — experience, core skills, key impact.</p>
  </div>
);

const ExpForm = ({ items, upd, add, rm }) => (
  <div className="space-y-4">
    {items.map((e, i) => (
      <div key={e.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Position {i + 1}</span>
          <button onClick={() => rm(e.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Company *</FL><FI value={e.company} onChange={x => upd(e.id, 'company', x.target.value)} placeholder="Google" /></div>
          <div><FL>Role / Title *</FL><FI value={e.role} onChange={x => upd(e.id, 'role', x.target.value)} placeholder="Software Engineer" /></div>
          <div><FL>Start Date</FL><FI value={e.start} onChange={x => upd(e.id, 'start', x.target.value)} placeholder="Jan 2022" /></div>
          <div>
            <FL>End Date</FL>
            <FI value={e.current ? 'Present' : e.end} disabled={e.current} onChange={x => upd(e.id, 'end', x.target.value)} placeholder="Dec 2024" className={e.current ? 'opacity-50 cursor-not-allowed' : ''} />
            <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
              <input type="checkbox" checked={e.current} onChange={x => upd(e.id, 'current', x.target.checked)} className="w-3 h-3 accent-emerald-500" />
              <span className="text-[10px] text-slate-500 font-medium">Currently working here</span>
            </label>
          </div>
        </div>
        <div>
          <FL>Key Achievements</FL>
          <FT rows={4} value={e.bullets} onChange={x => upd(e.id, 'bullets', x.target.value)} placeholder={"• Led migration to microservices, cutting latency by 40%\n• Managed a team of 5 engineers"} />
          <p className="text-[10px] text-slate-400 mt-1">Start each line with • for bullets.</p>
        </div>
      </div>
    ))}
    <AddBtn onClick={() => add(newExp())} label="Add Position" />
  </div>
);

const EduForm = ({ items, upd, add, rm }) => (
  <div className="space-y-4">
    {items.map((e, i) => (
      <div key={e.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Education {i + 1}</span>
          <button onClick={() => rm(e.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
        <div><FL>Institution *</FL><FI value={e.school} onChange={x => upd(e.id, 'school', x.target.value)} placeholder="IIT Bombay" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Degree</FL><FI value={e.degree} onChange={x => upd(e.id, 'degree', x.target.value)} placeholder="B.Tech" /></div>
          <div><FL>Field of Study</FL><FI value={e.field} onChange={x => upd(e.id, 'field', x.target.value)} placeholder="Computer Science" /></div>
          <div><FL>Start Year</FL><FI value={e.start} onChange={x => upd(e.id, 'start', x.target.value)} placeholder="2018" /></div>
          <div><FL>End Year</FL><FI value={e.end} onChange={x => upd(e.id, 'end', x.target.value)} placeholder="2022" /></div>
          <div><FL>CGPA / %</FL><FI value={e.gpa} onChange={x => upd(e.id, 'gpa', x.target.value)} placeholder="8.7 / 10" /></div>
        </div>
      </div>
    ))}
    <AddBtn onClick={() => add(newEdu())} label="Add Education" />
  </div>
);

const SkillsForm = ({ skills, setSkills }) => {
  const [inp, setInp] = useState('');
  const add = () => { const v = inp.trim(); if (v && !skills.includes(v)) { setSkills([...skills, v]); setInp(''); } };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <FI className="flex-1" value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="e.g. React.js, Python, AWS" />
        <button onClick={add} className="h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold">Add</button>
      </div>
      <p className="text-[10px] text-slate-400">Press Enter or click Add · Click a tag to remove</p>
      <div className="flex flex-wrap gap-2 min-h-8">
        {skills.length === 0 && <p className="text-xs text-slate-400 italic">No skills yet</p>}
        {skills.map(s => (
          <button key={s} onClick={() => setSkills(skills.filter(x => x !== s))}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors">
            {s} ×
          </button>
        ))}
      </div>
    </div>
  );
};

const ProjForm = ({ items, upd, add, rm }) => (
  <div className="space-y-4">
    {items.map((p, i) => (
      <div key={p.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Project {i + 1}</span>
          <button onClick={() => rm(p.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Name *</FL><FI value={p.name} onChange={x => upd(p.id, 'name', x.target.value)} placeholder="CareerPoint Portal" /></div>
          <div><FL>Tech Stack</FL><FI value={p.tech} onChange={x => upd(p.id, 'tech', x.target.value)} placeholder="React, Node.js, MongoDB" /></div>
          <div className="col-span-2"><FL>Link</FL><FI value={p.link} onChange={x => upd(p.id, 'link', x.target.value)} placeholder="github.com/user/project" /></div>
        </div>
        <div><FL>Description</FL><FT rows={3} value={p.description} onChange={x => upd(p.id, 'description', x.target.value)} placeholder="A full-stack job portal with real-time messaging and Razorpay integration." /></div>
      </div>
    ))}
    <AddBtn onClick={() => add(newProj())} label="Add Project" />
  </div>
);

const CertForm = ({ items, upd, add, rm }) => (
  <div className="space-y-4">
    {items.map((c, i) => (
      <div key={c.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Certification {i + 1}</span>
          <button onClick={() => rm(c.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
        </div>
        <div><FL>Name *</FL><FI value={c.name} onChange={x => upd(c.id, 'name', x.target.value)} placeholder="AWS Certified Solutions Architect" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><FL>Issuer</FL><FI value={c.issuer} onChange={x => upd(c.id, 'issuer', x.target.value)} placeholder="Amazon Web Services" /></div>
          <div><FL>Date</FL><FI value={c.date} onChange={x => upd(c.id, 'date', x.target.value)} placeholder="Mar 2024" /></div>
        </div>
      </div>
    ))}
    <AddBtn onClick={() => add(newCert())} label="Add Certification" />
  </div>
);

// ─── Customization Panel ──────────────────────────────────────────────────────
const HeadingPreview = ({ id, active, accent }) => {
  const ac = active ? accent : '#94a3b8';
  const textCls = 'text-[7px] font-bold uppercase tracking-wider w-full';
  const previews = {
    plain:            <div className={textCls} style={{ color: '#334155' }}>HEADING</div>,
    boxed:            <div className={`${textCls} border border-slate-400 px-1 inline-block`} style={{ color: '#334155' }}>HEADING</div>,
    centered:         <div className={`${textCls} text-center`} style={{ color: '#334155' }}>HEADING</div>,
    underline:        <div className={`${textCls} border-b border-slate-400 pb-0.5`} style={{ color: '#334155' }}>HEADING</div>,
    'accent-underline': <div className={textCls} style={{ borderBottom: `2px solid ${ac}`, paddingBottom: '2px', color: ac }}>HEADING</div>,
    'double-line':    <div className={`${textCls} text-center border-t border-b border-slate-300 py-0.5`} style={{ color: '#334155' }}>HEADING</div>,
    'left-bar':       <div className={textCls} style={{ borderLeft: `2px solid ${ac}`, paddingLeft: '4px', color: ac }}>HEADING</div>,
    wavy:             <div className={textCls} style={{ textDecoration: 'underline wavy #94a3b8', color: '#334155' }}>HEADING</div>,
  };
  return (
    <div className={`flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer h-12 transition-all ${active ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
      {previews[id] || null}
    </div>
  );
};

const ACCENT_ROWS = [
  [{ key: 'accentName', label: 'Name' }, { key: 'accentDots', label: 'Dots/Bars/Bubbles' }],
  [{ key: 'accentJobTitle', label: 'Job title' }, { key: 'accentDates', label: 'Dates' }],
  [{ key: 'accentHeadings', label: 'Headings' }, { key: 'accentSubtitle', label: 'Entry subtitle' }],
  [{ key: 'accentHeadingsLine', label: 'Headings Line' }, { key: 'accentLinkIcons', label: 'Link icons' }],
  [{ key: 'accentHeaderIcons', label: 'Header icons' }, null],
];

const CustomizationPanel = ({ style: ST, setStyle }) => {
  const upd = (k, v) => setStyle(s => ({ ...s, [k]: v }));
  const moveSection = (key, dir) => {
    const arr = [...ST.sectionOrder];
    const i = arr.indexOf(key);
    if (dir === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    else if (dir === 'down' && i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    upd('sectionOrder', arr);
  };
  const toggleHidden = (key) => {
    const h = ST.hidden.includes(key) ? ST.hidden.filter(x => x !== key) : [...ST.hidden, key];
    upd('hidden', h);
  };

  return (
    <div className="space-y-1 text-sm pb-8">

      {/* Typography */}
      <CDiv label="Typography" />
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Font Family</p>
      <div className="grid grid-cols-3 gap-2">
        {FONTS.map(f => (
          <button key={f.id} onClick={() => upd('font', f.id)}
            className={`py-3 rounded-xl border-2 text-center transition-all ${ST.font === f.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}
            style={{ fontFamily: f.stack }}>
            <p className="text-base font-bold text-slate-900 leading-none">Aa</p>
            <p className="text-[9px] text-slate-500 mt-1 font-medium">{f.name}</p>
          </button>
        ))}
      </div>

      {/* Accent Color */}
      <CDiv label="Accent Color" />
      <div className="flex flex-wrap gap-2.5 mb-3">
        {COLORS.map(c => (
          <button key={c} onClick={() => upd('accent', c)} title={COLOR_NAMES[c]}
            className={`w-8 h-8 rounded-xl transition-all border-2 ${ST.accent === c ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-[10px] text-slate-500 font-medium">Custom:</p>
        <input type="color" value={ST.accent} onChange={e => upd('accent', e.target.value)}
          className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white" />
        <span className="text-[10px] font-mono text-slate-500">{ST.accent}</span>
      </div>

      {/* Header Layout */}
      <CDiv label="Header Layout" />
      <p className="text-xs font-bold text-slate-700 mb-2">Text Alignment</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: 'left', label: 'Left', el: <div className="w-full space-y-1 px-3"><div className="h-2 bg-slate-500 rounded w-3/4" /><div className="h-1.5 bg-slate-300 rounded w-1/2" /></div> },
          { id: 'center', label: 'Center', el: <div className="w-full flex flex-col items-center space-y-1 px-3"><div className="h-2 bg-slate-500 rounded w-3/4" /><div className="h-1.5 bg-slate-300 rounded w-1/2" /></div> },
        ].map(o => (
          <button key={o.id} onClick={() => upd('headerAlign', o.id)}
            className={`py-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${ST.headerAlign === o.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
            {o.el}
            <span className="text-[10px] font-bold text-slate-600">{o.label}</span>
          </button>
        ))}
      </div>

      <p className="text-xs font-bold text-slate-700 mb-2">Details Arrangement</p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { id: 'stacked', label: 'Stacked', el: <div className="space-y-0.5 w-full px-3">{[70,55,60].map((w,i)=><div key={i} className="h-1.5 bg-slate-300 rounded" style={{width:`${w}%`}} />)}</div> },
          { id: 'columns', label: 'Columns', el: <div className="grid grid-cols-2 gap-1 w-full px-2">{[1,2,3,4].map(i=><div key={i} className="h-1.5 bg-slate-300 rounded" />)}</div> },
        ].map(o => (
          <button key={o.id} onClick={() => upd('detailsArrangement', o.id)}
            className={`py-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${ST.detailsArrangement === o.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
            {o.el}
            <span className="text-[10px] font-bold text-slate-600">{o.label}</span>
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Separator Style</p>
      <SelBtn cols={3} val={ST.detailsSeparator} onSelect={v => upd('detailsSeparator', v)}
        opts={[{ id: 'bullet', label: '• Bullet' }, { id: 'bar', label: '| Bar' }, { id: 'none', label: 'None' }]} />

      {/* Section Headings */}
      <CDiv label="Section Headings" />
      <p className="text-xs font-bold text-slate-700 mb-2">Style</p>
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {HEADING_STYLE_IDS.map(id => (
          <button key={id} onClick={() => upd('headingStyle', id)}>
            <HeadingPreview id={id} active={ST.headingStyle === id} accent={ST.accent} />
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Capitalization</p>
      <SelBtn cols={2} val={ST.headingCapitalization} onSelect={v => upd('headingCapitalization', v)}
        opts={[{ id: 'capitalize', label: 'Capitalize' }, { id: 'uppercase', label: 'UPPERCASE' }]} />

      <div className="mt-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Size</p>
        <div className="flex gap-2">
          {[{ id: 'sm', label: 'S' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'L' }, { id: 'xl', label: 'XL' }].map(o => (
            <button key={o.id} onClick={() => upd('headingSize', o.id)}
              className={`w-10 h-10 rounded-xl border-2 text-xs font-bold transition-all ${ST.headingSize === o.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Icons</p>
        <SelBtn cols={3} val={ST.headingIcons} onSelect={v => upd('headingIcons', v)}
          opts={[{ id: 'none', label: 'None' }, { id: 'outline', label: 'Outline' }, { id: 'filled', label: 'Filled' }]} />
      </div>

      {/* Apply Accent Color */}
      <CDiv label="Apply Accent Color" />
      <div className="space-y-2">
        {ACCENT_ROWS.map((row, ri) => (
          <div key={ri} className="grid grid-cols-2 gap-x-4 gap-y-2">
            {row.map((item, ci) => item ? (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => upd(item.key, !ST[item.key])}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${ST[item.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}>
                  {ST[item.key] && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <span className="text-xs text-slate-700 select-none">{item.label}</span>
              </label>
            ) : <div key={ci} />)}
          </div>
        ))}
      </div>

      {/* Entry Layout */}
      <CDiv label="Entry Layout" />
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { id: 'title-right', el: <div className="w-full px-2 space-y-1"><div className="flex justify-between"><div className="h-1.5 bg-slate-700 rounded w-1/2"/><div className="h-1.5 bg-slate-300 rounded w-1/4"/></div>{[65,50,55].map((w,i)=><div key={i} className="h-1 bg-slate-200 rounded" style={{width:`${w}%`}}/>)}</div> },
          { id: 'date-left', el: <div className="w-full px-2 space-y-1"><div className="flex justify-between"><div className="h-1.5 bg-slate-300 rounded w-1/4"/><div className="h-1.5 bg-slate-700 rounded w-1/2"/></div>{[65,50].map((w,i)=><div key={i} className="h-1 bg-slate-200 rounded ml-auto" style={{width:`${w}%`}}/>)}</div> },
          { id: 'stacked', el: <div className="w-full px-2 space-y-1"><div className="h-1.5 bg-slate-700 rounded w-3/4"/><div className="h-1.5 bg-slate-400 rounded w-1/2"/><div className="h-1 bg-slate-300 rounded w-1/3"/></div> },
          { id: 'compact', el: <div className="w-full px-2 space-y-0.5">{[75,60,65,55,70].map((w,i)=><div key={i} className="h-1 bg-slate-300 rounded" style={{width:`${w}%`}}/>)}</div> },
        ].map(o => (
          <button key={o.id} onClick={() => upd('entryLayout', o.id)}
            className={`py-3 rounded-xl border-2 transition-all ${ST.entryLayout === o.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
            {o.el}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Title & Subtitle Size</p>
      <div className="flex gap-2 mb-3">
        {[{ id: 'sm', label: 'S' }, { id: 'md', label: 'M' }, { id: 'lg', label: 'L' }].map(o => (
          <button key={o.id} onClick={() => upd('entryTitleSize', o.id)}
            className={`w-10 h-10 rounded-xl border-2 text-xs font-bold transition-all ${ST.entryTitleSize === o.id ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-600 hover:border-slate-200'}`}>
            {o.label}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subtitle Style</p>
      <SelBtn cols={3} val={ST.subtitleStyle} onSelect={v => upd('subtitleStyle', v)}
        opts={[{ id: 'normal', label: 'Normal' }, { id: 'bold', label: 'Bold' }, { id: 'italic', label: 'Italic' }]} />

      <div className="mt-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subtitle Placement</p>
        <SelBtn cols={2} val={ST.subtitlePlacement} onSelect={v => upd('subtitlePlacement', v)}
          opts={[{ id: 'same-line', label: 'Same Line' }, { id: 'next-line', label: 'Next Line' }]} />
      </div>

      {/* Spacing */}
      <CDiv label="Spacing" />
      <div className="space-y-4">
        <SliderControl label="Font Size" value={ST.fontSize} min={8} max={14} step={0.5} unit="pt" onChange={v => upd('fontSize', v)} />
        <SliderControl label="Line Height" value={ST.lineHeight} min={1.0} max={2.5} step={0.05} unit="" onChange={v => upd('lineHeight', v)} />
        <SliderControl label="Left & Right Margin" value={ST.marginLR} min={8} max={36} step={1} unit="mm" onChange={v => upd('marginLR', v)} />
        <SliderControl label="Top & Bottom Margin" value={ST.marginTB} min={8} max={32} step={1} unit="mm" onChange={v => upd('marginTB', v)} />
        <SliderControl label="Space Between Entries" value={ST.entrySpacing} min={2} max={24} step={1} unit="px" onChange={v => upd('entrySpacing', v)} />
      </div>

      {/* Layout */}
      <CDiv label="Layout" />
      <p className="text-xs font-bold text-slate-700 mb-2">Columns</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { id: 'one', label: 'One', el: <div className="w-full px-2 space-y-1">{[80,65,72,55].map((w,i)=><div key={i} className="h-1.5 bg-slate-400 rounded" style={{width:`${w}%`}}/>)}</div> },
          { id: 'two', label: 'Two', el: <div className="w-full px-1 grid grid-cols-2 gap-1">{[1,2,3,4,5,6].map(i=><div key={i} className="h-1.5 bg-slate-400 rounded"/>)}</div> },
          { id: 'mix', label: 'Mix', el: <div className="w-full px-1 flex gap-1"><div className="w-1/3 space-y-1">{[1,2,3].map(i=><div key={i} className="h-1.5 bg-slate-400 rounded"/>)}</div><div className="flex-1 space-y-1">{[1,2,3,4].map(i=><div key={i} className="h-1.5 bg-slate-300 rounded"/>)}</div></div> },
        ].map(o => (
          <button key={o.id} onClick={() => upd('columns', o.id)}
            className={`py-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${ST.columns === o.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'}`}>
            {o.el}
            <span className="text-[10px] font-bold text-slate-600">{o.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-slate-100 bg-slate-50">
        <p className="text-xs font-bold text-slate-700">Section Dividers</p>
        <Toggle checked={ST.showDividers} onChange={v => upd('showDividers', v)} />
      </div>

      {/* Language & Region */}
      <CDiv label="Language & Region" />
      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Date Format</p>
          <select value={ST.dateFormat} onChange={e => upd('dateFormat', e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-emerald-400 cursor-pointer">
            {[{ v: 'MMM YYYY', l: 'Jan 2024' }, { v: 'DD/MM/YYYY', l: 'DD/MM/YYYY' }, { v: 'MM/DD/YYYY', l: 'MM/DD/YYYY' }, { v: 'YYYY-MM-DD', l: 'YYYY-MM-DD' }].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Page Format</p>
          <select value={ST.pageFormat} onChange={e => upd('pageFormat', e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-emerald-400 cursor-pointer">
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </div>
      </div>

      {/* Section Order */}
      <CDiv label="Sections" />
      <div className="space-y-1.5">
        {ST.sectionOrder.map((key, idx) => {
          const sec = ALL_SEC.find(s => s.key === key);
          if (!sec) return null;
          const isHidden = ST.hidden.includes(key);
          return (
            <div key={key} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${isHidden ? 'border-slate-100 bg-slate-50/50 opacity-50' : 'border-slate-100 bg-white'}`}>
              <span className="text-xs font-semibold text-slate-700 flex-1">{sec.label}</span>
              <button onClick={() => toggleHidden(key)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveSection(key, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
                <button onClick={() => moveSection(key, 'down')} disabled={idx === ST.sectionOrder.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"><ChevronDown size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Resume Preview ───────────────────────────────────────────────────────────
const parseBullets = (text) => text.split('\n').map(l => l.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);

const ResumePreview = ({ resume: R, style: ST }) => {
  const font = FONTS.find(f => f.id === ST.font)?.stack || FONTS[0].stack;
  const base = ST.fontSize * 1.33;
  const lh = ST.lineHeight;
  const accent = ST.accent;
  const h2Style = getH2Style(ST);
  const titleSizes = { sm: base, md: base * 1.1, lg: base * 1.2 };
  const titleSize = titleSizes[ST.entryTitleSize] || base;
  const secMB = ST.entrySpacing * 2;
  const entMB = ST.entrySpacing;
  const dateColor = ST.accentDates ? accent : '#94a3b8';
  const subtitleColor = ST.accentSubtitle ? accent : '#475569';
  const subFS = ST.subtitleStyle === 'italic' ? 'italic' : 'normal';
  const subFW = ST.subtitleStyle === 'bold' ? '700' : '400';

  const wrap = {
    fontFamily: font, fontSize: `${base}px`, lineHeight: lh,
    padding: `${ST.marginTB}mm ${ST.marginLR}mm`,
    backgroundColor: '#fff',
    minHeight: ST.pageFormat === 'letter' ? '279mm' : '297mm',
    color: '#1e293b', boxSizing: 'border-box',
  };

  const P = R.personal;
  const contactItems = [P.email, P.phone, P.location, P.linkedin, P.website].filter(Boolean);

  const renderSep = (i) => {
    if (i === contactItems.length - 1) return null;
    if (ST.detailsSeparator === 'bullet') return <span style={{ color: '#94a3b8', margin: '0 6px' }}>•</span>;
    if (ST.detailsSeparator === 'bar') return <span style={{ color: '#cbd5e1', margin: '0 8px' }}>|</span>;
    return <span style={{ margin: '0 4px' }} />;
  };

  const renderContact = () => {
    if (ST.detailsArrangement === 'columns') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', fontSize: `${base * 0.88}px`, color: '#64748b', marginTop: '6px' }}>
          {contactItems.map((item, i) => <span key={i}>{item}</span>)}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', fontSize: `${base * 0.88}px`, color: '#64748b', marginTop: '6px', justifyContent: ST.headerAlign === 'center' ? 'center' : 'flex-start' }}>
        {contactItems.map((item, i) => <React.Fragment key={i}><span>{item}</span>{renderSep(i)}</React.Fragment>)}
      </div>
    );
  };

  const renderEntryHead = (title, subtitle, start, end, current) => {
    const dateStr = start ? `${start}${(end || current) ? ' – ' : ''}${current ? 'Present' : end}` : '';
    const tStyle = { fontWeight: '700', fontSize: `${titleSize}px`, color: '#0f172a' };
    const sStyle = { color: subtitleColor, fontStyle: subFS, fontWeight: subFW, fontSize: `${base}px` };
    const dStyle = { color: dateColor, fontSize: `${base * 0.88}px`, whiteSpace: 'nowrap' };

    if (ST.entryLayout === 'stacked') {
      return (
        <div style={{ marginBottom: '3px' }}>
          {title && <div style={tStyle}>{title}</div>}
          {subtitle && <div style={sStyle}>{subtitle}</div>}
          {dateStr && <div style={{ ...dStyle, marginTop: '1px' }}>{dateStr}</div>}
        </div>
      );
    }
    if (ST.entryLayout === 'date-left') {
      return (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '3px' }}>
          {dateStr && <div style={{ ...dStyle, flexShrink: 0, width: '72px' }}>{dateStr}</div>}
          <div>
            {title && <div style={tStyle}>{title}</div>}
            {subtitle && <div style={sStyle}>{subtitle}</div>}
          </div>
        </div>
      );
    }
    if (ST.entryLayout === 'compact') {
      return (
        <div style={{ marginBottom: '2px' }}>
          {title && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={tStyle}>{title}</span>
            {dateStr && <span style={dStyle}>{dateStr}</span>}
          </div>}
          {subtitle && <div style={sStyle}>{subtitle}</div>}
        </div>
      );
    }
    // default: title-right
    return (
      <div style={{ marginBottom: '3px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            {title && <span style={tStyle}>{title}</span>}
            {subtitle && ST.subtitlePlacement === 'same-line' && <span style={{ ...sStyle, marginLeft: '6px' }}>· {subtitle}</span>}
          </div>
          {dateStr && <span style={dStyle}>{dateStr}</span>}
        </div>
        {subtitle && ST.subtitlePlacement !== 'same-line' && <div style={sStyle}>{subtitle}</div>}
      </div>
    );
  };

  const renderSection = (key) => {
    const secWrap = { marginBottom: `${secMB}px` };
    const entWrap = { marginBottom: `${entMB}px` };
    switch (key) {
      case 'summary':
        return R.summary ? (
          <div key="summary" style={secWrap}>
            <h2 style={h2Style}>Professional Summary</h2>
            <p style={{ color: '#334155', lineHeight: lh }}>{R.summary}</p>
          </div>
        ) : null;
      case 'experience':
        return R.experience.some(e => e.company || e.role) ? (
          <div key="experience" style={secWrap}>
            <h2 style={h2Style}>Experience</h2>
            {R.experience.map(e => (e.company || e.role) ? (
              <div key={e.id} style={entWrap}>
                {renderEntryHead(e.role, e.company, e.start, e.end, e.current)}
                {e.bullets && <ul style={{ margin: '3px 0 0', paddingLeft: '16px', color: '#334155' }}>{parseBullets(e.bullets).map((b, i) => <li key={i} style={{ marginBottom: '2px' }}>{b}</li>)}</ul>}
              </div>
            ) : null)}
          </div>
        ) : null;
      case 'education':
        return R.education.some(e => e.school) ? (
          <div key="education" style={secWrap}>
            <h2 style={h2Style}>Education</h2>
            {R.education.map(e => e.school ? (
              <div key={e.id} style={entWrap}>
                {renderEntryHead(e.school, [e.degree, e.field].filter(Boolean).join(' in '), e.start, e.end, false)}
                {e.gpa && <div style={{ color: '#64748b', fontSize: `${base * 0.88}px` }}>CGPA: {e.gpa}</div>}
              </div>
            ) : null)}
          </div>
        ) : null;
      case 'skills':
        return R.skills.length > 0 ? (
          <div key="skills" style={secWrap}>
            <h2 style={h2Style}>Skills</h2>
            <p style={{ color: '#334155' }}>{R.skills.join('  ·  ')}</p>
          </div>
        ) : null;
      case 'projects':
        return R.projects.some(p => p.name) ? (
          <div key="projects" style={secWrap}>
            <h2 style={h2Style}>Projects</h2>
            {R.projects.map(p => p.name ? (
              <div key={p.id} style={entWrap}>
                {renderEntryHead(p.name, p.tech, '', '', false)}
                {p.link && <div style={{ color: ST.accentLinkIcons ? accent : '#3b82f6', fontSize: `${base * 0.88}px` }}>{p.link}</div>}
                {p.description && <p style={{ color: '#334155', marginTop: '3px', lineHeight: lh }}>{p.description}</p>}
              </div>
            ) : null)}
          </div>
        ) : null;
      case 'certifications':
        return R.certifications.some(c => c.name) ? (
          <div key="certifications" style={secWrap}>
            <h2 style={h2Style}>Certifications</h2>
            {R.certifications.map(c => c.name ? (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', ...entWrap }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{c.name}</span>
                  {c.issuer && <span style={{ color: subtitleColor, fontStyle: subFS }}> · {c.issuer}</span>}
                </div>
                {c.date && <span style={{ color: dateColor, fontSize: `${base * 0.88}px`, flexShrink: 0 }}>{c.date}</span>}
              </div>
            ) : null)}
          </div>
        ) : null;
      default: return null;
    }
  };

  const visible = ST.sectionOrder.filter(k => !ST.hidden.includes(k));
  const noContent = !P.name && !P.email && !R.summary && !R.experience.length && !R.education.length && !R.skills.length;

  const renderBody = () => {
    if (ST.columns === 'two') {
      const left = visible.filter((_, i) => i % 2 === 0);
      const right = visible.filter((_, i) => i % 2 !== 0);
      return (
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 1 }}>{left.map(k => renderSection(k))}</div>
          <div style={{ flex: 1 }}>{right.map(k => renderSection(k))}</div>
        </div>
      );
    }
    if (ST.columns === 'mix') {
      const SIDEBAR = ['skills', 'certifications'];
      const sidebar = visible.filter(k => SIDEBAR.includes(k));
      const main = visible.filter(k => !SIDEBAR.includes(k));
      return (
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ width: '34%', flexShrink: 0 }}>{sidebar.map(k => renderSection(k))}</div>
          <div style={{ flex: 1 }}>{main.map(k => renderSection(k))}</div>
        </div>
      );
    }
    return visible.map(k => renderSection(k));
  };

  const center = ST.headerAlign === 'center';
  return (
    <div id="resume-preview" style={wrap}>
      {(P.name || P.email) ? (
        <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '16px', borderBottom: `2px solid ${accent}`, paddingBottom: '12px' }}>
          {P.name && <h1 style={{ fontSize: `${base * 2.2}px`, fontWeight: '700', color: ST.accentName ? accent : '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{P.name}</h1>}
          {P.title && <p style={{ fontSize: `${base * 1.1}px`, color: ST.accentJobTitle ? accent : '#64748b', fontStyle: 'italic', margin: `${base * 0.25}px 0 0` }}>{P.title}</p>}
          {contactItems.length > 0 && renderContact()}
        </div>
      ) : (
        <div style={{ borderBottom: `2px solid #e2e8f0`, paddingBottom: '14px', marginBottom: '18px' }}>
          <p style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: '700' }}>Your Name</p>
          <p style={{ color: '#e2e8f0', fontSize: '11px', marginTop: '4px' }}>Fill in Personal Info →</p>
        </div>
      )}
      {renderBody()}
      {noContent && (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: '#cbd5e1' }}>
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Your resume will appear here</p>
          <p style={{ fontSize: '11px', marginTop: '6px' }}>Fill in the sections on the left</p>
        </div>
      )}
    </div>
  );
};

// ─── PDF Download ─────────────────────────────────────────────────────────────
const downloadPDF = (pageFormat) => {
  const el = document.getElementById('resume-preview');
  if (!el) return;
  const size = pageFormat === 'letter' ? 'Letter' : 'A4';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Resume</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#fff;}ul{list-style-type:disc;}
    @media print{@page{size:${size};margin:0;}body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}
    </style></head><body>${el.outerHTML}</body></html>`);
  w.document.close();
  w.addEventListener('load', () => { w.focus(); w.print(); });
};

// ─── Resume Card ──────────────────────────────────────────────────────────────
const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ResumeCard = ({ resume, onEdit, onDelete, onDuplicate }) => {
  const [menu, setMenu] = useState(false);
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all">
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex flex-col gap-1.5 cursor-pointer relative overflow-hidden" onClick={() => onEdit(resume.id)}>
        <div className="h-3 rounded-sm w-1/2" style={{ backgroundColor: resume.style?.accent || '#0f172a' }} />
        <div className="h-2 bg-slate-200 rounded-sm w-3/4" />
        <div className="h-px bg-slate-200 my-1 w-full" />
        {[80, 60, 70, 50, 65].map((w, i) => <div key={i} className="h-1.5 bg-slate-200 rounded-sm" style={{ width: `${w}%` }} />)}
        <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/8 transition-colors flex items-center justify-center">
          <span className="text-emerald-700 text-xs font-bold bg-white/90 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">Open Editor</span>
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{resume.name}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock size={9} /> {fmtDate(resume.updatedAt)}
            </p>
          </div>
          <div className="relative shrink-0">
            <button onClick={() => setMenu(!menu)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><MoreHorizontal size={15} /></button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-8 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                  <button onClick={() => { onEdit(resume.id); setMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Edit3 size={12} /> Edit</button>
                  <button onClick={() => { onDuplicate(resume.id); setMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Copy size={12} /> Duplicate</button>
                  <div className="h-px bg-slate-100 mx-2" />
                  <button onClick={() => { onDelete(resume.id); setMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Action buttons — Edit + visible Delete */}
        <div className="flex gap-2">
          <button onClick={() => onEdit(resume.id)} className="flex-1 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
            <Edit3 size={12} /> Edit
          </button>
          <button onClick={() => onDelete(resume.id)} title="Delete resume"
            className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors flex items-center justify-center shrink-0">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Resume List ──────────────────────────────────────────────────────────────
const ResumeList = ({ onNew, onEdit }) => {
  const [resumes, setResumes] = useState(load);

  const handleDelete = (id) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    const updated = resumes.filter(r => r.id !== id);
    setResumes(updated); save(updated);
  };
  const handleDuplicate = (id) => {
    const src = resumes.find(r => r.id === id);
    if (!src) return;
    const copy = { ...src, id: mkId(), name: src.name + ' (Copy)', createdAt: Date.now(), updatedAt: Date.now() };
    const updated = [...resumes, copy];
    setResumes(updated); save(updated);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Resume Builder</h1>
          </div>
          <p className="text-sm text-slate-500">Build and manage your professional resumes.</p>
        </div>
        <button onClick={onNew}
          className="flex items-center gap-2 h-10 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-emerald-500/20">
          <Plus size={15} /> New Resume
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-center">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={26} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No resumes yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">Create your first professional resume with live preview and instant PDF download.</p>
          <button onClick={onNew}
            className="inline-flex items-center gap-2 h-11 px-7 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30">
            <FileText size={15} /> Craft My Resume
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resumes.map(r => (
            <ResumeCard key={r.id} resume={r} onEdit={onEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} />
          ))}
          <button onClick={onNew} className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center min-h-[220px] gap-2 text-slate-400 hover:text-emerald-600">
            <Plus size={24} />
            <span className="text-xs font-bold">New Resume</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Editor ───────────────────────────────────────────────────────────────────
const Editor = ({ resumeId, onBack }) => {
  const allResumes = load();
  const existing = resumeId ? allResumes.find(r => r.id === resumeId) : null;
  const stableId = useRef(resumeId || mkId());

  const [name, setName] = useState(existing?.name || 'My Resume');
  const [data, setData] = useState(existing?.data || BLANK_DATA);
  const [style, setStyle] = useState(() => mergeStyle(existing?.style));
  const [activeSection, setActiveSection] = useState('personal');
  const [leftTab, setLeftTab] = useState('content');
  const [mobileTab, setMobileTab] = useState('edit');
  const [saved, setSaved] = useState(true);
  const [editName, setEditName] = useState(false);

  useEffect(() => {
    setSaved(false);
    const id = stableId.current;
    const t = setTimeout(() => {
      const all = load();
      const entry = { id, name, data, style, createdAt: existing?.createdAt || Date.now(), updatedAt: Date.now() };
      const idx = all.findIndex(r => r.id === id);
      if (idx >= 0) all[idx] = entry; else all.push(entry);
      save(all);
      setSaved(true);
    }, 600);
    return () => clearTimeout(t);
  }, [name, data, style]);

  const setPersonal = (f, v) => setData(d => ({ ...d, personal: { ...d.personal, [f]: v } }));
  const setSummary  = (v)    => setData(d => ({ ...d, summary: v }));
  const setSkills   = (arr)  => setData(d => ({ ...d, skills: arr }));
  const updList     = (sec, id, f, v) => setData(d => ({ ...d, [sec]: d[sec].map(x => x.id === id ? { ...x, [f]: v } : x) }));
  const addItem     = (sec, item)     => setData(d => ({ ...d, [sec]: [...d[sec], item] }));
  const rmItem      = (sec, id)       => setData(d => ({ ...d, [sec]: d[sec].filter(x => x.id !== id) }));

  const renderForm = () => {
    switch (activeSection) {
      case 'personal':        return <PersonalForm d={data.personal} set={setPersonal} />;
      case 'summary':         return <SummaryForm v={data.summary} set={setSummary} />;
      case 'experience':      return <ExpForm items={data.experience} upd={(id,f,v)=>updList('experience',id,f,v)} add={i=>addItem('experience',i)} rm={id=>rmItem('experience',id)} />;
      case 'education':       return <EduForm items={data.education} upd={(id,f,v)=>updList('education',id,f,v)} add={i=>addItem('education',i)} rm={id=>rmItem('education',id)} />;
      case 'skills':          return <SkillsForm skills={data.skills} setSkills={setSkills} />;
      case 'projects':        return <ProjForm items={data.projects} upd={(id,f,v)=>updList('projects',id,f,v)} add={i=>addItem('projects',i)} rm={id=>rmItem('projects',id)} />;
      case 'certifications':  return <CertForm items={data.certifications} upd={(id,f,v)=>updList('certifications',id,f,v)} add={i=>addItem('certifications',i)} rm={id=>rmItem('certifications',id)} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 140px)', minHeight: '600px' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between pb-3 shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors shrink-0">
            <ArrowLeft size={14} /> All Resumes
          </button>
          <div className="h-4 w-px bg-slate-200" />
          {editName ? (
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onBlur={() => setEditName(false)} onKeyDown={e => e.key === 'Enter' && setEditName(false)}
              className="text-sm font-bold text-slate-900 border-b-2 border-emerald-400 outline-none bg-transparent min-w-0 w-40" />
          ) : (
            <button onClick={() => setEditName(true)} className="flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors truncate max-w-[200px]">
              {name} <Edit3 size={12} className="text-slate-400 shrink-0" />
            </button>
          )}
          <span className={`text-[10px] font-medium shrink-0 flex items-center gap-1 ${saved ? 'text-emerald-500' : 'text-slate-400'}`}>
            {saved ? <><Check size={10} /> Saved</> : 'Saving...'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex sm:hidden bg-slate-100 rounded-lg p-0.5">
            {['edit', 'preview'].map(t => (
              <button key={t} onClick={() => setMobileTab(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-colors capitalize ${mobileTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => downloadPDF(style.pageFormat)}
            className="flex items-center gap-2 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors">
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>

      {/* Two-panel */}
      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
        {/* Left panel */}
        <div className={`flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shrink-0 ${mobileTab === 'preview' ? 'hidden sm:flex' : 'flex'}`} style={{ width: '340px' }}>
          <div className="flex border-b border-slate-100 shrink-0">
            <button onClick={() => setLeftTab('content')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${leftTab === 'content' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-800'}`}>
              <Edit3 size={13} /> Content
            </button>
            <button onClick={() => setLeftTab('design')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${leftTab === 'design' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-800'}`}>
              <Palette size={13} /> Design
            </button>
          </div>

          {leftTab === 'content' ? (
            <>
              <div className="border-b border-slate-100 p-2 shrink-0">
                {CONTENT_SECTIONS.map(s => {
                  const Icon = s.icon;
                  const isA = activeSection === s.key;
                  return (
                    <button key={s.key} onClick={() => setActiveSection(s.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isA ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isA ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        <Icon size={13} strokeWidth={isA ? 2.5 : 1.8} />
                      </div>
                      <span className="text-[11px] font-bold tracking-wide">{s.label}</span>
                      {isA && <ChevronRight size={12} className="ml-auto text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto p-4">{renderForm()}</div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <CustomizationPanel style={style} setStyle={setStyle} />
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className={`flex-1 overflow-y-auto bg-slate-100 rounded-2xl p-4 min-w-0 ${mobileTab === 'edit' ? 'hidden sm:block' : 'block'}`}>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 min-w-[440px]">
            <ResumePreview resume={data} style={style} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const ResumeBuilder = () => {
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const openEditor = (id = null) => { setEditingId(id); setView('editor'); };
  const goHome = () => { setView('list'); setEditingId(null); };
  return (
    <FeatureGate
      featureKey="hasResumeBuilder"
      featureName="Resume Builder"
      description="Build professional, ATS-optimized resumes with live preview, full customization, and PDF download."
      subscriptionPath="/jobseeker/subscription"
    >
      {view === 'list'
        ? <ResumeList onNew={() => openEditor(null)} onEdit={openEditor} />
        : <Editor resumeId={editingId} onBack={goHome} />
      }
    </FeatureGate>
  );
};

export default ResumeBuilder;
