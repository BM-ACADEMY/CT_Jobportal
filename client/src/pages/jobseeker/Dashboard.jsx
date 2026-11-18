import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search, UserRound, FileText, Hourglass, Star, Bookmark, Sparkles, Briefcase,
  FileUser, BadgeCheck, Bell, GraduationCap, ArrowRight, Building2, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OnboardingChecklistCard from '../../components/onboarding/OnboardingChecklistCard';
import {
  Page, Panel, PanelLink, StatTile, JobItem, JobItemSkeleton, EmptyState, StatusLabel, CompanyLogo,
  useSavedJobs, timeAgo, btnPrimary, btnSecondary,
} from '@/components/candidate/CandidateUI';
import { jobPath } from '../../utils/jobUrl';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const TOOLS = [
  { Icon: FileUser, title: 'Resume builder', text: 'Make a clean resume in minutes.', to: '/candidate/resume-builder' },
  { Icon: BadgeCheck, title: 'Skill tests', text: 'Earn a certificate employers can check.', to: '/candidate/skill-tests' },
  { Icon: Bell, title: 'Job alerts', text: 'Get new jobs that fit you by email.', to: '/candidate/job-alerts' },
  { Icon: GraduationCap, title: 'Campus drives', text: 'Drives open to your college.', to: '/candidate/campus-drives' },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const ProfileRing = ({ value }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e4efe9" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#34B678" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(100, Math.max(0, value))) / 100}
          className="transition-[stroke-dashoffset] duration-1000" />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold leading-none text-[#10213D]">{value}%</span>
        <span className="mt-1 text-[10px] font-semibold text-zinc-500">profile</span>
      </span>
    </div>
  );
};

const Scorecards = ({ cards }) => (
  <Panel title="My interview scorecards" text="Feedback your placement team recorded for your campus interviews.">
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {cards.map((card) => {
        const average = ((Number(card.technical || 0) + Number(card.communication || 0) + Number(card.problemSolving || 0)) / 3).toFixed(1);
        const positive = ['strong_hire', 'hire'].includes(card.recommendation);
        const recCls = positive ? 'bg-[#eaf7f0] text-[#1f8a57]' : card.recommendation === 'no_hire' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700';
        return (
          <article key={card._id} className="min-w-0 space-y-3 rounded-xl bg-[#f4faf7] p-4 ring-1 ring-[#34B678]/10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="m-0 truncate text-sm font-bold text-[#10213D]">{card.employer?.name}</h3>
                <p className="m-0 text-[11px] text-zinc-500">{card.drive?.title || 'Campus drive'} · {new Date(card.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold capitalize ${recCls}`}>{card.recommendation.replaceAll('_', ' ')}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[['Technical', card.technical], ['Talk', card.communication], ['Problem', card.problemSolving], ['Average', average]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white p-2 text-center ring-1 ring-zinc-200/70">
                  <p className="m-0 text-base font-bold text-[#10213D]">{value}<span className="text-[10px] text-zinc-400">/5</span></p>
                  <p className="m-0 text-[10px] font-semibold text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
            <p className="m-0 text-xs leading-relaxed text-zinc-600">{card.comments || 'No extra feedback was given.'}</p>
            {card.interviewer && <p className="m-0 text-[11px] text-zinc-400">Interviewer: {card.interviewer}</p>}
          </article>
        );
      })}
    </div>
  </Panel>
);

const CompanyInvite = ({ invite }) => {
  const [busy, setBusy] = useState('');
  const act = async (kind) => {
    setBusy(kind);
    try {
      const res = await axios.post(`${API}/user/${kind}-company-invite`, {}, authHeader());
      if (kind === 'accept' && res.data?.token) localStorage.setItem('token', res.data.token);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setBusy('');
    }
  };
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-sky-200 sm:flex-row sm:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Building2 size={20} /></span>
      <p className="m-0 flex-1 text-sm text-zinc-600">
        <strong className="text-[#10213D]">{invite.company?.name}</strong> invited you to join their team as
        a <strong className="text-[#10213D]">{invite.type === 'recruiter' ? 'recruiter' : 'team member'}</strong>.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => act('decline')} disabled={!!busy} className={`${btnSecondary} h-10`}>Decline</button>
        <button type="button" onClick={() => act('accept')} disabled={!!busy} className={`${btnPrimary} h-10`}>{busy === 'accept' ? 'Joining…' : 'Accept invite'}</button>
      </div>
    </div>
  );
};

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const saved = useSavedJobs();
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [campusStudent, setCampusStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = (url, set, pick, opts) => axios.get(url, opts).then((r) => set(pick(r.data))).catch((err) => {
      if (err.response?.status !== 404) console.error(`Error loading ${url}:`, err);
    });
    Promise.all([
      load(`${API}/jobs/matching`, setMatchingJobs, (d) => (Array.isArray(d) ? d : []), authHeader()),
      load(`${API}/jobs?limit=8`, setRecentJobs, (d) => (Array.isArray(d?.jobs) ? d.jobs : Array.isArray(d) ? d : [])),
      load(`${API}/applications/my-applications`, setApplications, (d) => (Array.isArray(d) ? d : []), authHeader()),
      load(`${API}/college/me/student`, setCampusStudent, (d) => d || null, authHeader()),
    ]).finally(() => setLoading(false));
  }, []);

  const appliedIds = new Set(applications.filter((a) => a.status !== 'withdrawn').map((a) => String(a.job?._id)));
  const count = (...s) => applications.filter((a) => s.includes(a.status)).length;
  const completion = user?.profile?.profileCompletion || 0;
  const firstName = (user?.name || '').split(' ')[0];
  const recommended = matchingJobs.slice(0, 4);
  const recommendedIds = new Set(recommended.map((j) => j._id));
  const latest = recentJobs.filter((j) => !recommendedIds.has(j._id)).slice(0, 6);
  const recentApps = [...applications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  const renderJobs = (jobs) => jobs.map((job) => (
    <JobItem key={job._id} job={job} applied={appliedIds.has(String(job._id))} saved={saved.isSaved(job._id)} onToggleSave={saved.toggle} />
  ));

  return (
    <Page>
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-[#eaf7f0] p-5 ring-1 ring-zinc-200/80 sm:p-6">
        <svg className="pointer-events-none absolute -right-24 -top-28 h-[340px] w-[340px] opacity-80" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <circle cx="100" cy="100" r="60" fill="#34B678" fillOpacity="0.08" />
          {[70, 80, 90, 99].map((r) => <circle key={r} cx="100" cy="100" r={r} stroke="#34B678" strokeOpacity="0.22" strokeWidth="0.4" />)}
        </svg>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-[13px] font-medium text-[#1f8a57]">{greeting()}{firstName ? `, ${firstName}` : ''}</p>
            <h1 className="m-0 mt-1 text-xl font-bold tracking-tight text-[#10213D] sm:text-[1.5rem] sm:leading-tight">Let&apos;s find your next job.</h1>
            <p className="m-0 mt-1.5 max-w-lg text-[13px] leading-relaxed text-zinc-500">
              {completion < 100
                ? 'A complete profile gets seen by more employers. Add the missing details and apply with one tap.'
                : 'Your profile is complete. Keep applying and follow your applications here.'}
            </p>
            <div className="mt-4 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap">
              <Link to="/jobs" className={btnPrimary}><Search size={16} /> Find jobs</Link>
              <Link to="/candidate/settings" className={btnSecondary}><UserRound size={16} /> {completion < 100 ? 'Complete profile' : 'Edit profile'}</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/80 p-3.5 ring-1 ring-zinc-200/80 backdrop-blur lg:w-[250px] lg:shrink-0">
            <ProfileRing value={completion} />
            <div className="min-w-0 text-sm">
              <p className="m-0 text-xs font-semibold text-zinc-500">Your ID</p>
              <p className="m-0 mt-0.5 font-mono text-sm font-semibold text-[#10213D]">{user?.display_id || '—'}</p>
              <Link to="/candidate/profile-insights" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#1f8a57] no-underline hover:underline">
                Who viewed me <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {user?.pendingCompanyInvite && <CompanyInvite invite={user.pendingCompanyInvite} />}

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile Icon={FileText} label="Jobs applied" value={loading ? '–' : count('pending', 'reviewed', 'shortlisted', 'accepted', 'completed', 'rejected')} tone="navy" to="/candidate/applications" />
        <StatTile Icon={Hourglass} label="In review" value={loading ? '–' : count('pending', 'reviewed')} tone="amber" to="/candidate/applications" />
        <StatTile Icon={Star} label="Shortlisted" value={loading ? '–' : count('shortlisted', 'accepted', 'completed')} to="/candidate/applications" />
        <StatTile Icon={Bookmark} label="Saved jobs" value={saved.count} tone="navy" to="/dashboard/saved-jobs" />
      </div>

      <OnboardingChecklistCard className="" />

      {campusStudent?.interviewScorecards?.length > 0 && <Scorecards cards={campusStudent.interviewScorecards} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Recommended for you" text="Matched to your skills, location and fields of work." action={<PanelLink to="/jobs">All jobs</PanelLink>}>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{[1, 2].map((i) => <JobItemSkeleton key={i} />)}</div>
            ) : recommended.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{renderJobs(recommended)}</div>
            ) : (
              <EmptyState
                Icon={Sparkles}
                title="No matches yet"
                text="Add your skills, location and fields of work so we can match jobs to you."
                action={<Link to="/candidate/settings" className={btnPrimary}>Update profile</Link>}
              />
            )}
          </Panel>

          <Panel title="Latest jobs" text="New on Velaivaaipu." action={<PanelLink to="/jobs">See more</PanelLink>}>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <JobItemSkeleton key={i} />)}</div>
            ) : latest.length ? (
              <div className="space-y-3">{renderJobs(latest)}</div>
            ) : (
              <EmptyState Icon={Briefcase} title="No new jobs today" text="Check back soon, or set a job alert so new jobs come to you." />
            )}
          </Panel>
        </div>

        <aside className="grid content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
          <Panel title="My applications" action={applications.length > 0 && <PanelLink to="/candidate/applications">View all</PanelLink>}>
            {loading ? (
              <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100" />)}</div>
            ) : recentApps.length ? (
              <ul className="m-0 list-none space-y-1 p-0">
                {recentApps.map((app) => (
                  <li key={app._id}>
                    <Link to={app.job?._id ? jobPath(app.job) : '/candidate/applications'} className="-mx-2 flex items-center gap-3 rounded-xl p-2 no-underline transition hover:bg-zinc-50">
                      <CompanyLogo logo={app.job?.company?.logo} name={app.job?.company?.name} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#10213D]">{app.job?.title || 'Job removed'}</span>
                        <span className="block truncate text-[11px] text-zinc-400">{timeAgo(app.createdAt)}</span>
                      </span>
                      <StatusLabel status={app.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]"><ClipboardCheck size={20} /></span>
                <p className="m-0 text-sm font-semibold text-[#10213D]">No applications yet</p>
                <p className="m-0 mt-1 text-xs text-zinc-500">Jobs you apply to show up here with their status.</p>
              </div>
            )}
          </Panel>

          <Panel title="Get noticed faster">
            <ul className="m-0 list-none space-y-1 p-0">
              {TOOLS.map(({ Icon, title, text, to }) => (
                <li key={to}>
                  <Link to={to} className="group -mx-2 flex items-center gap-3 rounded-xl p-2 no-underline transition hover:bg-[#f4faf7]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]"><Icon size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-[#10213D]">{title}</span>
                      <span className="block truncate text-xs text-zinc-500">{text}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[#1f8a57]" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </Page>
  );
};

export default JobSeekerDashboard;
