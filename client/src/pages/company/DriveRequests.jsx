import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { GraduationCap, CheckCircle2, XCircle, MessageSquare, Clock, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  requested: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700'
};

const STATUS_LABELS = {
  requested: 'Awaiting Your Response',
  accepted: 'Accepted',
  rejected: 'Rejected'
};

const DriveRequests = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const token = auth?.token || localStorage.getItem('token');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/company/drive-requests`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(res.data);
    } catch { toast.error('Failed to load campus drive requests'); }
    finally { setLoading(false); }
  };

  const respond = async (req, action) => {
    setRespondingId(req.companyEntryId);
    try {
      await axios.post(
        `${API}/company/drive-requests/${req.driveId}/${req.companyEntryId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === 'accept' ? 'Invite accepted' : 'Invite rejected');
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to respond'); }
    finally { setRespondingId(null); }
  };

  const messageCollege = (conversationId) => {
    navigate('/company/messages', { state: { conversationId } });
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-sm text-slate-400">Loading campus drive requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ClipboardList size={22} className="text-emerald-600" /> Campus Drive Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">Colleges inviting your company to participate in a campus placement drive.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center text-sm text-slate-400">
          No campus drive requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.companyEntryId} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden">
                {req.collegeLogo ? (
                  <img src={req.collegeLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap size={22} className="text-emerald-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{req.driveTitle}</p>
                <p className="text-xs text-slate-500">{req.collegeName} · Batch {req.batchYear}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[req.requestStatus] || 'bg-slate-100 text-slate-600'}`}>
                  {STATUS_LABELS[req.requestStatus] || req.requestStatus}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {req.conversation && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs font-bold gap-1.5 h-9"
                    onClick={() => messageCollege(req.conversation)}
                  >
                    <MessageSquare size={13} /> Message
                  </Button>
                )}
                {req.requestStatus === 'requested' && (
                  <>
                    <Button
                      size="sm"
                      disabled={respondingId === req.companyEntryId}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 h-9"
                      onClick={() => respond(req, 'accept')}
                    >
                      <CheckCircle2 size={13} /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondingId === req.companyEntryId}
                      className="rounded-lg text-xs font-bold gap-1.5 h-9 text-rose-600 border-rose-200 hover:bg-rose-50"
                      onClick={() => respond(req, 'reject')}
                    >
                      <XCircle size={13} /> Reject
                    </Button>
                  </>
                )}
                {req.requestStatus !== 'requested' && req.respondedAt && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> {new Date(req.respondedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriveRequests;
