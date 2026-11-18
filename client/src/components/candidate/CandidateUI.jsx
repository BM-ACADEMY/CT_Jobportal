import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Building2, MapPin, Briefcase, Clock, Bookmark, BookmarkCheck, CircleCheck, ArrowRight } from 'lucide-react';
import { jobPath } from '@/utils/jobUrl';
import { formatPay } from '@/data/jobFacets';

// Shared building blocks for the job seeker portal (/candidate/...), in the brand look:
// mint page, white rounded panels, navy text, green actions.

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || '';

// Saved-job ids from the signed-in user, plus a toggle that keeps the user in sync.
export const useSavedJobs = () => {
  const { user, updateUser } = useAuth();
  const ids = new Set((user?.savedJobs || []).map((j) => String(j?._id || j)));
  const toggle = async (job) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/save-job/${job._id}`);
      updateUser({ savedJobs: res.data.savedJobs });
      toast.success(res.data.msg || 'Saved jobs updated');
      return res.data.savedJobs;
    } catch {
      toast.error('Could not update saved jobs. Please try again.');
      return null;
    }
  };
  return { isSaved: (id) => ids.has(String(id)), toggle, count: ids.size };
};

export const mediaUrl = (path) => {
  if (!path || /default/i.test(path)) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_DOMAIN}${path}`;
};

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-[13px] font-semibold border-none cursor-pointer no-underline shadow-md shadow-[#34B678]/25 transition disabled:opacity-60 disabled:cursor-not-allowed';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white text-[#10213D] text-[13px] font-semibold ring-1 ring-zinc-200 hover:ring-[#34B678]/50 hover:text-[#1f8a57] border-none cursor-pointer no-underline transition disabled:opacity-60 disabled:cursor-not-allowed';
export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-transparent text-zinc-500 hover:text-[#10213D] hover:bg-zinc-100 text-xs font-bold border-none cursor-pointer no-underline transition';
export const btnDanger =
  'inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-white text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 text-xs font-bold border-none cursor-pointer transition disabled:opacity-60';
export const fieldCls =
  'w-full h-10 rounded-xl bg-white px-3.5 text-[13px] font-medium text-zinc-900 ring-1 ring-zinc-200 border-none outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#34B678]';

export const Page = ({ children, className = '' }) => (
  <div className={`w-full space-y-6 ${className}`}>{children}</div>
);

export const PageHeader = ({ eyebrow, title, text, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f8a57]">{eyebrow}</p>}
      <h1 className="m-0 text-xl sm:text-[1.375rem] font-bold tracking-tight text-[#10213D]">{title}</h1>
      {text && <p className="m-0 mt-1 max-w-2xl text-[13px] leading-relaxed text-zinc-500">{text}</p>}
    </div>
    {action && <div className="flex shrink-0 flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{action}</div>}
  </div>
);

export const Panel = ({ title, text, action, children, className = '', bodyClassName = '' }) => (
  <section className={`rounded-2xl bg-white ring-1 ring-zinc-200/80 shadow-[0_18px_40px_-32px_rgba(16,33,61,0.35)] ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          {title && <h2 className="m-0 text-[15px] font-semibold text-[#10213D]">{title}</h2>}
          {text && <p className="m-0 mt-0.5 text-xs text-zinc-500">{text}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={`p-5 sm:p-6 ${title || action ? 'pt-4 sm:pt-4' : ''} ${bodyClassName}`}>{children}</div>
  </section>
);

export const PanelLink = ({ to, children }) => (
  <Link to={to} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#1f8a57] no-underline hover:underline">
    {children} <ArrowRight size={13} />
  </Link>
);

// Count tile. Only ever pass real numbers.
export const StatTile = ({ Icon, label, value, tone = 'green', to }) => {
  const tones = {
    green: 'bg-[#eaf7f0] text-[#1f8a57]',
    navy: 'bg-[#e8edf5] text-[#10213D]',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  const body = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon size={18} /></span>
      <span className="min-w-0">
        <span className="block text-xl font-bold leading-none text-[#10213D]">{value}</span>
        <span className="mt-1 block text-xs font-medium leading-snug text-zinc-500">{label}</span>
      </span>
    </>
  );
  const cls = 'flex min-w-0 items-center gap-3 rounded-2xl bg-white p-3.5 sm:p-4 ring-1 ring-zinc-200/80 no-underline transition';
  return to
    ? <Link to={to} className={`${cls} hover:ring-[#34B678]/50 hover:shadow-md`}>{body}</Link>
    : <div className={cls}>{body}</div>;
};

export const CompanyLogo = ({ logo, name, size = 48 }) => {
  const src = mediaUrl(logo);
  const style = { width: size, height: size };
  if (src) {
    return (
      <span style={style} className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200">
        <img src={src} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
      </span>
    );
  }
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57] font-bold" aria-hidden="true">
      {name?.[0]?.toUpperCase() || <Building2 size={size * 0.42} />}
    </span>
  );
};

export const formatExperience = (exp) => {
  if (!exp || (!exp.min && !exp.max)) return 'Any experience';
  if (exp.min && exp.max) return `${exp.min}–${exp.max} yrs`;
  return `${exp.min || exp.max}+ yrs`;
};

export const timeAgo = (date) => {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Meta = ({ Icon, children }) => (
  <span className="inline-flex min-w-0 items-center gap-1.5"><Icon size={13} className="shrink-0 text-zinc-400" /><span className="truncate">{children}</span></span>
);

// One job, as a row in a list. `saved` / `onToggleSave` are optional.
export const JobItem = ({ job, applied, saved, onToggleSave, compact = false }) => (
  <article className="group relative flex gap-3 sm:gap-4 rounded-2xl bg-white p-4 sm:p-5 ring-1 ring-zinc-200/80 transition hover:ring-[#34B678]/50 hover:shadow-[0_18px_40px_-28px_rgba(16,33,61,0.45)]">
    <CompanyLogo logo={job.company?.logo} name={job.company?.name} size={compact ? 44 : 52} />
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-sm font-semibold leading-snug text-[#10213D]">
            <Link to={jobPath(job)} className="text-inherit no-underline after:absolute after:inset-0 after:rounded-2xl group-hover:text-[#1f8a57]">
              {job.title}
            </Link>
          </h3>
          <p className="m-0 mt-0.5 truncate text-[13px] text-zinc-500">{job.company?.name || 'Company'}</p>
        </div>
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onToggleSave(job); }}
            aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
            aria-pressed={!!saved}
            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-none cursor-pointer transition ${saved ? 'bg-[#eaf7f0] text-[#1f8a57]' : 'bg-zinc-50 text-zinc-400 hover:bg-[#eaf7f0] hover:text-[#1f8a57]'}`}
          >
            {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-600">
        {job.location && <Meta Icon={MapPin}>{job.location}</Meta>}
        <Meta Icon={Briefcase}>{formatExperience(job.experience)}</Meta>
        <span className="font-semibold text-[#10213D]">{formatPay(job.salary)}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
        <Meta Icon={Clock}><span className="text-zinc-400">{timeAgo(job.createdAt)}</span></Meta>
        {applied && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1f8a57]"><CircleCheck size={14} /> Applied</span>
        )}
      </div>
    </div>
  </article>
);

export const JobItemSkeleton = () => (
  <div className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/80 animate-pulse">
    <span className="h-12 w-12 shrink-0 rounded-xl bg-zinc-100" />
    <div className="flex-1 space-y-2.5">
      <span className="block h-4 w-2/3 rounded bg-zinc-100" />
      <span className="block h-3 w-1/3 rounded bg-zinc-100" />
      <span className="block h-3 w-1/2 rounded bg-zinc-100" />
    </div>
  </div>
);

export const EmptyState = ({ Icon, title, text, action }) => (
  <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-dashed ring-zinc-200">
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7f0] text-[#1f8a57]"><Icon size={26} /></span>
    <h3 className="m-0 text-[15px] font-semibold text-[#10213D]">{title}</h3>
    {text && <p className="m-0 mt-1 max-w-sm text-[13px] text-zinc-500">{text}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const APPLICATION_STATUS = {
  pending: { label: 'Applied', cls: 'bg-amber-50 text-amber-700' },
  reviewed: { label: 'Viewed by employer', cls: 'bg-sky-50 text-sky-700' },
  shortlisted: { label: 'Shortlisted', cls: 'bg-[#eaf7f0] text-[#1f8a57]' },
  accepted: { label: 'Selected', cls: 'bg-[#34B678] text-white' },
  completed: { label: 'Completed', cls: 'bg-[#34B678] text-white' },
  rejected: { label: 'Not selected', cls: 'bg-rose-50 text-rose-700' },
  withdrawn: { label: 'Withdrawn', cls: 'bg-zinc-100 text-zinc-500' },
};

export const StatusLabel = ({ status }) => {
  const s = APPLICATION_STATUS[status] || APPLICATION_STATUS.pending;
  return <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
};
