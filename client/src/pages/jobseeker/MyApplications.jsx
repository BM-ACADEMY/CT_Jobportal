import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Modal, Pagination } from 'antd';
import { toast } from 'sonner';
import { Briefcase, MapPin, Clock, Search, FileText, Undo2, BadgeCheck, Award, Eye, AlertCircle, Hourglass, Star, XCircle } from 'lucide-react';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import BrandConsent from '@/components/profile/BrandConsent';
import { jobPath } from '../../utils/jobUrl';
import {
  Page, PageHeader, StatTile, CompanyLogo, EmptyState, JobItemSkeleton, StatusLabel,
  timeAgo, btnPrimary, btnSecondary, btnDanger, fieldCls,
} from '@/components/candidate/CandidateUI';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const REVOCABLE = ['pending', 'reviewed'];
const PER_PAGE = 10;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress', statuses: ['pending', 'reviewed', 'shortlisted'] },
  { key: 'shortlisted', label: 'Shortlisted', statuses: ['shortlisted', 'accepted', 'completed'] },
  { key: 'rejected', label: 'Not selected', statuses: ['rejected'] },
  { key: 'withdrawn', label: 'Withdrawn', statuses: ['withdrawn'] },
];

// Where the application is in the hiring steps, for the small progress line.
const STEPS = ['Applied', 'Viewed', 'Shortlisted', 'Selected'];
const stepIndex = (status) => ({ pending: 0, reviewed: 1, shortlisted: 2, accepted: 3, completed: 3 }[status] ?? -1);

const Progress = ({ status }) => {
  const at = stepIndex(status);
  if (at < 0) return null;
  return (
    <ol className="m-0 mt-4 flex list-none items-center gap-1.5 p-0" aria-label="Application progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={`h-1.5 rounded-full ${i <= at ? 'bg-[#34B678]' : 'bg-zinc-200'}`} />
          <span className={`truncate text-[10px] font-semibold ${i <= at ? 'text-[#1f8a57]' : 'text-zinc-400'}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, filter]);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API}/applications/my-applications`, authHeader());
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await axios.patch(`${API}/applications/${revokeTarget.id}/revoke`, {}, authHeader());
      toast.success('Application withdrawn');
      setRevokeTarget(null);
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not withdraw. Please try again.');
    } finally {
      setRevoking(false);
    }
  };

  const q = search.trim().toLowerCase();
  const active = FILTERS.find((f) => f.key === filter);
  const filtered = applications.filter((app) => {
    const hay = `${app.job?.title || ''} ${app.job?.company?.name || ''}`.toLowerCase();
    return (!q || hay.includes(q)) && (!active?.statuses || active.statuses.includes(app.status));
  });
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const countOf = (statuses) => applications.filter((a) => statuses.includes(a.status)).length;

  return (
    <Page>
      <PageSOPBanner pageKey="myApplications" />
      {applications.length > 0 && <BrandConsent nudge />}

      <PageHeader
        eyebrow="Applications"
        title="My applications"
        text="Every job you applied to, and where each one stands."
        action={<Link to="/jobs" className={btnPrimary}><Briefcase size={16} /> Find more jobs</Link>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile Icon={FileText} label="Total applied" value={loading ? '–' : applications.length} tone="navy" />
        <StatTile Icon={Hourglass} label="In review" value={loading ? '–' : countOf(['pending', 'reviewed'])} tone="amber" />
        <StatTile Icon={Star} label="Shortlisted" value={loading ? '–' : countOf(['shortlisted', 'accepted', 'completed'])} />
        <StatTile Icon={XCircle} label="Not selected" value={loading ? '–' : countOf(['rejected'])} tone="rose" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 ring-1 ring-zinc-200/80 xl:flex-row xl:items-center">
        <div className="relative xl:w-80">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search job or company" aria-label="Search applications" className={`${fieldCls} pl-10`} />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 [scrollbar-width:none] xl:ml-auto" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`h-9 shrink-0 rounded-lg px-3.5 text-xs font-bold border-none cursor-pointer transition ${filter === f.key ? 'bg-white text-[#10213D] shadow-sm' : 'bg-transparent text-zinc-500 hover:text-[#10213D]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <JobItemSkeleton key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title={applications.length === 0 ? "You haven't applied to any jobs yet" : 'Nothing matches this filter'}
          text={applications.length === 0 ? 'Find a job you like and apply. You can follow every application here.' : 'Try another status or clear the search.'}
          action={applications.length === 0
            ? <Link to="/jobs" className={btnPrimary}>Browse jobs</Link>
            : <button type="button" className={btnSecondary} onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button>}
        />
      ) : (
        <div className="space-y-3">
          {shown.map((app) => {
            const job = app.job;
            return (
              <article key={app._id} className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200/80 transition hover:ring-[#34B678]/40 sm:p-5">
                <div className="flex gap-4">
                  <CompanyLogo logo={job?.company?.logo} name={job?.company?.name} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="m-0 flex items-center gap-1.5 text-sm font-semibold text-[#10213D]">
                          <span className="truncate">{job?.title || 'This job was removed'}</span>
                          {app.isPriority && <BadgeCheck size={16} className="shrink-0 text-[#1f8a57]" aria-label="Priority application" />}
                        </h3>
                        <p className="m-0 mt-0.5 truncate text-[13px] text-zinc-500">{job?.company?.name || 'Company'}</p>
                      </div>
                      <StatusLabel status={app.status} />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-zinc-500">
                      {job?.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-zinc-400" />{job.location}</span>}
                      {job?.jobType && <span className="inline-flex items-center gap-1.5"><Briefcase size={13} className="text-zinc-400" />{job.jobType}</span>}
                      <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-zinc-400" />Applied {timeAgo(app.createdAt).toLowerCase()}</span>
                    </div>
                    <Progress status={app.status} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-3">
                  {app.status === 'completed' && app.certificateCode && (
                    <Link to={`/certificate/${app.certificateCode}`} className={`${btnSecondary} h-9 px-3.5 text-xs`}><Award size={14} /> Certificate</Link>
                  )}
                  {REVOCABLE.includes(app.status) && (
                    <button type="button" onClick={() => setRevokeTarget({ id: app._id, title: job?.title || 'this job' })} className={btnDanger}>
                      <Undo2 size={14} /> Withdraw
                    </button>
                  )}
                  {job?._id && <Link to={jobPath(job)} className={`${btnSecondary} h-9 px-3.5 text-xs`}><Eye size={14} /> View job</Link>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filtered.length > PER_PAGE && (
        <div className="flex justify-center pt-2">
          <Pagination current={page} total={filtered.length} pageSize={PER_PAGE} showSizeChanger={false}
            onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      )}

      <Modal open={!!revokeTarget} onCancel={() => !revoking && setRevokeTarget(null)} footer={null} centered width={380} title={null}>
        <div className="p-2 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertCircle size={24} /></span>
          <h2 className="m-0 text-base font-bold text-[#10213D]">Withdraw this application?</h2>
          <p className="m-0 mt-2 text-sm text-zinc-500">
            Your application for <strong className="text-[#10213D]">{revokeTarget?.title}</strong> will be withdrawn. You can&apos;t undo this.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <button type="button" className={btnSecondary} onClick={() => setRevokeTarget(null)} disabled={revoking}>Keep it</button>
            <button type="button" className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-bold text-white border-none cursor-pointer transition hover:bg-rose-700 disabled:opacity-60" onClick={handleRevoke} disabled={revoking}>
              {revoking ? 'Withdrawing…' : 'Yes, withdraw'}
            </button>
          </div>
        </div>
      </Modal>
    </Page>
  );
};

export default MyApplications;
