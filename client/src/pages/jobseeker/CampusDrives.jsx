import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { GraduationCap, Calendar, Building2, Megaphone, CheckCircle2, XCircle, ArrowRight, Hourglass } from 'lucide-react';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import PhoneNumberInput from '@/components/shared/PhoneNumberInput';
import { Page, PageHeader, Panel, EmptyState, JobItemSkeleton, btnPrimary, fieldCls } from '@/components/candidate/CandidateUI';

const API_COLLEGE_URL = `${import.meta.env.VITE_API_BASE_URL}/college`;
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#10213D]';

// Shared form for joining a college and for re-applying after a rejection.
const JoinForm = ({ initial = {}, withCode = true, submitText, busyText, busy, onSubmit }) => {
  const [v, setV] = useState({ collegeCode: '', rollNumber: '', department: '', batchYear: '', phone: '', ...initial });
  const set = (k) => (e) => setV((cur) => ({ ...cur, [k]: e?.target ? e.target.value : e }));
  const submit = (e) => {
    e.preventDefault();
    if (!v.phone) { toast.error('Phone number is required'); return; }
    onSubmit(v);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {withCode && (
        <div>
          <label htmlFor="cd-code" className={labelCls}>College code</label>
          <input id="cd-code" required value={v.collegeCode} onChange={set('collegeCode')} placeholder="e.g. SKCT" className={fieldCls} />
          <p className="m-0 mt-1.5 text-xs text-zinc-400">Ask your placement officer (TPO) for this code.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cd-roll" className={labelCls}>Roll number</label>
          <input id="cd-roll" required value={v.rollNumber} onChange={set('rollNumber')} placeholder="e.g. 21CS045" className={fieldCls} />
        </div>
        <div>
          <label htmlFor="cd-dept" className={labelCls}>Department</label>
          <input id="cd-dept" required value={v.department} onChange={set('department')} placeholder="e.g. CSE" className={fieldCls} />
        </div>
        <div>
          <label htmlFor="cd-year" className={labelCls}>Passing year</label>
          <input id="cd-year" required type="number" min="2000" max="2100" value={v.batchYear} onChange={set('batchYear')} placeholder="e.g. 2026" className={fieldCls} />
        </div>
        <div>
          <span className={labelCls}>Phone number</span>
          <PhoneNumberInput value={v.phone} onChange={set('phone')} />
        </div>
      </div>
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>{busy ? busyText : submitText}</button>
    </form>
  );
};

const toPayload = (v, collegeCode) => ({
  collegeCode: String(collegeCode).trim(),
  rollNumber: v.rollNumber.trim(),
  department: v.department.trim(),
  batchYear: parseInt(v.batchYear, 10),
  phone: String(v.phone).trim(),
});

const RegisteredLabel = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf7f0] px-3 py-2 text-xs font-bold capitalize text-[#1f8a57]">
    <CheckCircle2 size={14} /> {status || 'Registered'}
  </span>
);

const CampusDrives = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [joining, setJoining] = useState(false);
  const [registeringId, setRegisteringId] = useState(null);

  const fetchDrives = async () => {
    try {
      const res = await axios.get(`${API_COLLEGE_URL}/me/drives`);
      setStudent(res.data.student);
      setDrives(res.data.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrives(); }, []);

  const join = async (v, code, okMsg) => {
    if (!code) { toast.error('Missing college code'); return; }
    setJoining(true);
    try {
      const res = await axios.post(`${API_COLLEGE_URL}/me/join`, toPayload(v, code));
      toast.success(res.data.msg || okMsg);
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send the request. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const registerForDrive = async (driveId, e) => {
    e.preventDefault();
    setRegisteringId(driveId);
    try {
      await axios.post(`${API_COLLEGE_URL}/me/drives/${driveId}/register`);
      toast.success('Registered for the drive');
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not register. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  if (loading) {
    return <Page><div className="space-y-3">{[1, 2].map((i) => <JobItemSkeleton key={i} />)}</div></Page>;
  }

  if (!student) {
    return (
      <Page className="max-w-xl">
        <PageHeader eyebrow="Campus drives" title="Join your college" text="Link your account to your college's placement team to see and register for campus drives." />
        <Panel>
          <JoinForm submitText="Send join request" busyText="Sending…" busy={joining} onSubmit={(v) => join(v, v.collegeCode, 'Join request sent')} />
        </Panel>
      </Page>
    );
  }

  const verification = student.idVerification?.status;
  const rejected = verification === 'rejected';

  return (
    <Page>
      <PageSOPBanner pageKey="jobseekerCampusDrives" />

      <PageHeader
        eyebrow="Campus drives"
        title={student.college?.name || 'Campus drives'}
        text={rejected ? 'Your college did not accept your join request.' : 'Drives your placement team has opened for your batch.'}
      />

      {verification === 'pending' && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          <Hourglass size={18} className="mt-0.5 shrink-0" />
          <span>Your placement officer still has to approve your college ID. You can see drives now; some may open only after approval.</span>
        </div>
      )}

      {rejected ? (
        <Panel className="mx-auto max-w-xl">
          <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
            <XCircle size={18} className="mt-0.5 shrink-0" />
            <span>
              {student.college?.name} turned down your request.
              {student.idVerification?.rejectionReason && <> Reason: &ldquo;{student.idVerification.rejectionReason}&rdquo;.</>}
              {' '}Check your details and send it again.
            </span>
          </div>
          <JoinForm
            withCode={false}
            initial={{ rollNumber: student.rollNumber || '', department: student.department || '', batchYear: student.batchYear || '', phone: student.phone || '' }}
            submitText="Send again"
            busyText="Sending…"
            busy={joining}
            onSubmit={(v) => join(v, student.college?.code, 'Request sent again')}
          />
        </Panel>
      ) : drives.length === 0 ? (
        <EmptyState Icon={GraduationCap} title="No drives right now" text="Your placement officer will post new campus drives here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {drives.map((drive) => {
            const companies = drive.companies?.length > 0 ? drive.companies : drive.companyName ? [{ name: drive.companyName, packageLPA: drive.packageLPA }] : [];
            const latest = drive.announcements?.length ? drive.announcements[drive.announcements.length - 1] : null;
            return (
              <article key={drive._id} className="group relative flex flex-col rounded-2xl bg-white p-5 ring-1 ring-zinc-200/80 transition hover:ring-[#34B678]/50 hover:shadow-[0_18px_40px_-28px_rgba(16,33,61,0.45)]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-[15px] font-semibold text-[#10213D]">
                    <Link to={`/candidate/campus-drives/${drive._id}`} className="text-inherit no-underline after:absolute after:inset-0 after:rounded-2xl group-hover:text-[#1f8a57]">{drive.title}</Link>
                  </h3>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-500"><Calendar size={13} /> Batch {drive.batchYear}</span>
                </div>

                {companies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {companies.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-[#10213D] ring-1 ring-zinc-200/70">
                        <Building2 size={12} className="text-zinc-400" /> {c.name}
                        {c.packageLPA > 0 && <span className="font-bold text-[#1f8a57]">{c.packageLPA} LPA</span>}
                      </span>
                    ))}
                  </div>
                )}

                {drive.description && <p className="m-0 mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-500">{drive.description}</p>}

                {latest && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#f4faf7] p-3 text-xs">
                    <Megaphone size={14} className="mt-0.5 shrink-0 text-[#1f8a57]" />
                    <span className="min-w-0"><strong className="text-[#10213D]">{latest.title}</strong>{latest.message && <span className="text-zinc-500"> · {latest.message}</span>}</span>
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1f8a57]">View details <ArrowRight size={13} /></span>
                  <div className="relative z-10">
                    {drive.myApplication ? (
                      <RegisteredLabel status={drive.myApplication.status} />
                    ) : (
                      <button type="button" onClick={(e) => registerForDrive(drive._id, e)} disabled={registeringId === drive._id} className={`${btnPrimary} h-9 px-4 text-xs`}>
                        {registeringId === drive._id ? 'Registering…' : 'Register'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
};

export default CampusDrives;
