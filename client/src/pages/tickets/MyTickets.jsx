import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Plus, AlertCircle, CheckCircle2, RefreshCw,
  ChevronDown, ChevronUp, MessageCircle, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_LABELS = {
  subscription_gating: 'Subscription & Plan Gating',
  payment_checkout: 'Payment Processing & Checkout',
  refunds_invoicing: 'Refunds & Invoicing',
  platform_errors: 'Core Features & Platform Errors',
  others: 'Others',
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-blue-50 text-blue-600',       icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-50 text-amber-600',     icon: RefreshCw },
  resolved:    { label: 'Resolved',    color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'bg-slate-50 text-slate-400',     icon: CheckCircle2 },
};

const SEV_BADGE = {
  critical: 'bg-red-50 text-red-600',
  major:    'bg-amber-50 text-amber-600',
  minor:    'bg-blue-50 text-blue-600',
};

const ACTIVE_STATUSES = ['open', 'in_progress'];

const MyTickets = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/tickets/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTickets(res.data);
      } catch {
        toast.error('Failed to load your tickets');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // True if the user has ANY active ticket (determines global chat eligibility)
  const hasActiveTicket = tickets.some(t => ACTIVE_STATUSES.includes(t.status));

  // Get the admin user ID — we POST to /conversation with the admin's userId.
  // We resolve the admin dynamically via the backend (no hardcoded ID needed).
  const handleChatWithSupport = async (ticketId) => {
    setChatLoading(ticketId);
    try {
      const token = localStorage.getItem('token');

      // Step 1: Ask backend who the admin is for this ticket's conversation
      // Backend: POST /api/messages/conversation with recipientId = admin user id
      // We use a dedicated endpoint to get the admin's user id
      const adminRes = await axios.get(`${API}/tickets/${ticketId}/support-contact`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const adminUserId = adminRes.data.adminId;

      // Step 2: Get or create conversation (backend will validate active ticket)
      const convRes = await axios.post(`${API}/messages/conversation`, { recipientId: adminUserId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/candidate/messages', { state: { conversationId: convRes.data._id } });
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (err.response?.data?.noActiveTicket) {
        toast.error('You need an active (open or in-progress) ticket to chat with support.');
      } else {
        toast.error(msg || 'Failed to open chat with support');
      }
    } finally {
      setChatLoading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Support Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} raised</p>
        </div>
        <Button
          onClick={() => navigate('/tickets/raise')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
        >
          <Plus size={15} className="mr-1.5" /> New Ticket
        </Button>
      </div>

      {/* Chat eligibility banner */}
      {tickets.length > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium border ${
          hasActiveTicket
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          {hasActiveTicket
            ? <><MessageCircle size={16} className="flex-shrink-0" /> You have an active ticket — you can chat with support directly from the ticket card below.</>
            : <><Lock size={16} className="flex-shrink-0" /> Chat with support is only available when you have an open or in-progress ticket.</>
          }
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No tickets raised yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Ticket" to raise your first support request.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => {
            const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
            const Icon = statusCfg.icon;
            const isActive = ACTIVE_STATUSES.includes(t.status);

            return (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group"
              >
                <div 
                  className="flex items-start justify-between gap-4 p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                >
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${statusCfg.color}`}>
                        <Icon size={10} /> {statusCfg.label}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${SEV_BADGE[t.severity]}`}>
                        {t.severity === 'critical' ? '🔴' : t.severity === 'major' ? '🟡' : '🔵'} {t.severity}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono rounded">
                        #{t._id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800 text-sm">{CATEGORY_LABELS[t.category]}</p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">
                      Role: {t.userRole} &bull; {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {t.conclusion && (
                      <p className="mt-2 text-xs text-slate-600 bg-emerald-50 rounded-lg px-3 py-1.5 border-l-2 border-emerald-400">
                        <span className="font-semibold text-emerald-700">Resolution: </span>{t.conclusion}
                      </p>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Chat with Support — only on active tickets */}
                    {isActive ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleChatWithSupport(t._id); }}
                        disabled={chatLoading === t._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-60"
                      >
                        {chatLoading === t._id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : <MessageCircle size={12} />
                        }
                        Chat with Support
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                        <Lock size={10} /> Chat locked
                      </span>
                    )}

                    {expanded === t._id ? (
                      <ChevronUp
                        size={15}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors"
                      />
                    ) : (
                      <ChevronDown
                        size={15}
                        className="text-slate-300 group-hover:text-slate-500 transition-colors"
                      />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === t._id && (
                  <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/30">
                    {/* Diagnostics */}
                    {Object.keys(t.diagnostics || {}).length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Diagnostics Provided</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(t.diagnostics).map(([k, v]) => v ? (
                            <div key={k} className="bg-white rounded-xl border border-slate-200 p-3">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <p className="text-xs font-semibold text-slate-700 break-words">{v}</p>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold">Diagnostics Consent:</span> {t.diagnosticsConsent ? '✅ Granted' : '❌ Not Granted'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTickets;
