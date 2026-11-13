import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageCircle, Loader2, Send, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const when = (iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const WhatsAppInbox = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openPhone, setOpenPhone] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/admin/whatsapp`);
      setThreads(res.data.threads || []);
    } catch {
      toast.error('Failed to load WhatsApp messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async (t) => {
    setBusy(true);
    try {
      await axios.post(`${API}/admin/whatsapp/reply`, { phone: t.phone, text });
      toast.success('Reply sent');
      setText('');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send');
    } finally {
      setBusy(false);
    }
  };

  const done = async (t) => {
    try {
      await axios.put(`${API}/admin/whatsapp/${t.phone}/done`);
      await load();
    } catch {
      toast.error('Could not update');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 py-6 px-2">
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><MessageCircle className="text-emerald-600" /> WhatsApp messages</h1>
        <p className="text-sm text-slate-500 mt-1">What people send to our business number. Free replies work for 24 hours after their last message. After that, call them.</p>
      </div>

      {threads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-500">No messages in the last 30 days.</div>
      ) : threads.map((t) => {
        const open = openPhone === t.phone;
        return (
          <div key={t.phone} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <button onClick={() => { setOpenPhone(open ? null : t.phone); setText(''); }} className="w-full text-left p-4 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{t.matched?.name || t.name || `+91 ${t.phone}`}
                  {t.matched?.kind && <span className="ml-2 text-[10px] font-bold uppercase text-slate-400">{t.matched.kind}</span>}</p>
                <p className="text-xs text-slate-500 truncate">{t.messages.at(-1)?.body}</p>
              </div>
              {t.newCount > 0 && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">{t.newCount} new</span>}
              <span className="text-[11px] text-slate-400 shrink-0">{when(t.messages.at(-1).at)}</span>
            </button>
            {open && (
              <div className="border-t border-slate-50 p-4 space-y-3">
                <p className="text-xs text-slate-400">+91 {t.phone}</p>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {t.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-xl px-3 py-2 text-sm max-w-[80%] ${m.direction === 'out' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-800'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{when(m.at)}{m.sentBy ? ` · ${m.sentBy}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {t.canReply ? (
                  <div className="space-y-2">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="Write a reply" className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
                    <p className="text-[11px] text-slate-400">You can reply until {when(t.replyUntil)}.</p>
                    <div className="flex gap-2">
                      <button disabled={busy || text.trim().length < 2} onClick={() => send(t)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold px-5 h-10 disabled:opacity-50"><Send size={14} /> Send</button>
                      {t.newCount > 0 && <button onClick={() => done(t)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-sm font-bold px-5 h-10"><Check size={14} /> Mark handled</button>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3">More than 24 hours since their last message, so WhatsApp will not take a free reply. Call +91 {t.phone}.</p>
                    {t.newCount > 0 && <button onClick={() => done(t)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 text-sm font-bold px-5 h-10"><Check size={14} /> Mark handled</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WhatsAppInbox;
