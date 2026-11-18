import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, User as UserIcon, Calendar, Building2, CheckCircle2, Megaphone, Loader2 } from 'lucide-react';
import { Page, Panel, btnPrimary } from '@/components/candidate/CandidateUI';

const CampusDriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchDrive = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/college/me/drives`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const found = res.data.drives?.find(d => d._id === id);
      if (found) {
        setDrive(found);
      } else {
        toast.error("Drive not found");
        navigate('/candidate/campus-drives');
      }
    } catch (err) {
      toast.error("Failed to fetch drive details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrive();
  }, [id, navigate]);

  const handleChat = async (inChargeUserId) => {
    if (!inChargeUserId) return toast.error('This in-charge has not activated their account yet.');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/messages/conversation`, 
        { recipientId: inChargeUserId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      navigate('/candidate/messages', { state: { conversationId: res.data._id } });
    } catch (err) {
      toast.error('Failed to start conversation');
    }
  };

  const registerForDrive = async () => {
    setRegistering(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/college/me/drives/${id}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Registered for drive!');
      fetchDrive();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-[#34B678]" /></div>;
  }

  if (!drive) return null;

  const rawCompanies = drive.companies?.length > 0 ? drive.companies : drive.companyName ? [{ name: drive.companyName, packageLPA: drive.packageLPA }] : [];
  const companies = [...new Map(rawCompanies.map(company => [company.name?.trim().toLowerCase(), company])).values()];
  const inCharges = [...new Map((drive.inCharges || []).map(inCharge => {
    const normalizedEmail = inCharge.email?.trim().toLowerCase();
    const normalizedName = inCharge.name?.trim().toLowerCase();
    const userId = inCharge.user?._id || inCharge.user;
    return [normalizedEmail || userId || normalizedName, inCharge];
  })).values()];

  return (
    <Page>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/candidate/campus-drives')}
          aria-label="Back to campus drives"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-500 ring-1 ring-zinc-200 border-none cursor-pointer transition hover:text-[#10213D]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f8a57]">Campus drive</p>
          <h1 className="m-0 text-xl sm:text-[1.375rem] font-bold tracking-tight text-[#10213D]">{drive.title}</h1>
          <p className="m-0 mt-1 flex items-center gap-1.5 text-sm text-zinc-500"><Calendar size={14} /> Batch {drive.batchYear}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Panel title="About this drive">
            {drive.description
              ? <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{drive.description}</p>
              : <p className="m-0 text-sm text-zinc-400">No details added yet.</p>}

            {companies.length > 0 && (
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <h3 className="m-0 mb-3 text-sm font-bold text-[#10213D]">Companies hiring</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {companies.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl bg-[#f4faf7] p-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1f8a57] ring-1 ring-zinc-200"><Building2 size={16} /></span>
                      <div className="min-w-0">
                        <p className="m-0 truncate text-sm font-bold text-[#10213D]">{c.name}</p>
                        {c.packageLPA > 0 && <p className="m-0 text-xs font-semibold text-[#1f8a57]">{c.packageLPA} LPA</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {drive.announcements?.length > 0 && (
            <Panel title="Announcements">
              <ul className="m-0 list-none space-y-3 p-0">
                {drive.announcements.slice().reverse().map((a, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-zinc-50 p-4">
                    <Megaphone size={16} className="mt-0.5 shrink-0 text-[#1f8a57]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="m-0 text-sm font-bold text-[#10213D]">{a.title}</p>
                        {a.postedAt && <span className="shrink-0 text-[11px] text-zinc-400">{new Date(a.postedAt).toLocaleDateString('en-IN')}</span>}
                      </div>
                      {a.message && <p className="m-0 mt-1 text-xs leading-relaxed text-zinc-600">{a.message}</p>}
                      {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-xs font-bold text-[#1f8a57] hover:underline">{a.link}</a>}
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="grid min-w-0 content-start gap-6 md:grid-cols-2 xl:sticky xl:top-24 xl:grid-cols-1">
          <Panel title="Your registration">
            {drive.myApplication ? (
              <div className="flex items-center gap-3 rounded-xl bg-[#eaf7f0] p-4 text-[#1f8a57]">
                <CheckCircle2 size={20} className="shrink-0" />
                <div>
                  <p className="m-0 text-sm font-bold capitalize">{drive.myApplication.status || 'Registered'}</p>
                  <p className="m-0 text-xs text-[#1f8a57]/80">You are registered for this drive.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="m-0 mb-4 text-sm text-zinc-500">You have not registered for this drive yet.</p>
                <button type="button" onClick={registerForDrive} disabled={registering} className={`${btnPrimary} w-full`}>
                  {registering ? 'Registering…' : 'Register now'}
                </button>
              </>
            )}
          </Panel>

          <Panel title="Placement in-charge">
            {inCharges.length > 0 ? (
              <ul className="m-0 list-none space-y-2 p-0">
                {inCharges.map(ic => (
                  <li key={ic.user?._id || ic.user || ic.email} className="flex min-w-0 items-center gap-3 rounded-xl bg-zinc-50 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]"><UserIcon size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-bold text-[#10213D]">{ic.name}</p>
                      <p className="m-0 truncate text-[11px] text-zinc-500" title={ic.email}>{ic.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChat(ic.user)}
                      disabled={!ic.user}
                      aria-label={`Message ${ic.name}`}
                      title={ic.user ? 'Send a message' : 'Not on Velaivaaipu yet'}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1f8a57] ring-1 ring-zinc-200 border-none cursor-pointer transition hover:bg-[#eaf7f0] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <MessageCircle size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-zinc-400">No in-charge added yet.</p>
            )}
          </Panel>
        </aside>
      </div>
    </Page>
  );
};

export default CampusDriveDetails;
