import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, MessageCircle, User as UserIcon, Calendar, Building2, CheckCircle2, Megaphone, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>;
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
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6 px-1 sm:px-3 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/candidate/campus-drives')}
          className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all bg-white shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{drive.title}</h1>
          <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-1">
            <Calendar size={14} /> Batch {drive.batchYear}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6 min-w-0">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-emerald-500" /> Drive Details
            </h2>
            {drive.description ? (
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{drive.description}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">No description provided.</p>
            )}

            {companies.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Participating Companies</h3>
                <div className="flex flex-wrap gap-2">
                  {companies.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                      <Building2 size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{c.name}</p>
                        {c.packageLPA > 0 && <p className="text-[10px] font-bold text-emerald-600">{c.packageLPA} LPA</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {drive.announcements?.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Megaphone size={18} className="text-emerald-500" /> Announcements
              </h2>
              <div className="space-y-4">
                {drive.announcements.slice().reverse().map((a, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-900">{a.title}</p>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(a.postedAt).toLocaleDateString()}</span>
                    </div>
                    {a.message && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.message}</p>}
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline">
                        {a.link}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-6 min-w-0 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registration Status</h3>
            {drive.myApplication ? (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <CheckCircle2 size={20} />
                <div>
                  <p className="text-sm font-bold uppercase">{drive.myApplication.status}</p>
                  <p className="text-[10px] font-medium opacity-80">You are registered for this drive.</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-4">You have not registered for this drive yet.</p>
                <Button 
                  onClick={registerForDrive} 
                  disabled={registering}
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Placement In-charge</h3>
            {inCharges.length > 0 ? (
              <div className="space-y-3">
                {inCharges.map(ic => (
                  <div key={ic.user?._id || ic.user || ic.email} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        <UserIcon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{ic.name}</p>
                        <p className="text-[10px] text-slate-500 truncate" title={ic.email}>{ic.email}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleChat(ic.user)}
                      variant="ghost" 
                      size="icon"
                      className="w-8 h-8 shrink-0 rounded-lg text-emerald-600 hover:bg-emerald-100 disabled:opacity-40"
                      disabled={!ic.user}
                      title="Chat with In-charge"
                    >
                      <MessageCircle size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No in-charges assigned yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CampusDriveDetails;
