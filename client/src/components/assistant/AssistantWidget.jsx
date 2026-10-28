import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;
const MAX_CHARS = 500;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// The assistant may point to pages of the app by path. Only these known prefixes become links; everything else stays plain text.
const PATH_RE = /(\/(?:jobs|job|candidate|refund-policy)[A-Za-z0-9\-_/?=&.]*)/g;
const renderReply = (text) => String(text).split(PATH_RE).map((part, i) => (
  i % 2 === 1 ? <Link key={i} to={part.replace(/[.,;:)]+$/, '')} className="underline text-emerald-700 font-semibold">{part}</Link> : <React.Fragment key={i}>{part}</React.Fragment>
));

// Chat for job seekers. Replies are shown as text only (never as HTML). Nothing is saved: closing the page ends the chat.
// It stays hidden unless the server says the assistant is switched on and configured.
const AssistantWidget = () => {
  const { user } = useAuth();
  const isSeeker = user?.role === 'jobseeker';
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', content }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    if (!isSeeker) return undefined;
    let cancelled = false;
    axios.get(`${API}/assistant/status`, authHeaders())
      .then((res) => { if (!cancelled) setEnabled(Boolean(res.data?.enabled)); })
      .catch(() => { /* hidden when anything is wrong */ });
    return () => { cancelled = true; };
  }, [isSeeker]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy, open]);

  if (!isSeeker || !enabled) return null;

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError('');
    setBusy(true);
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    try {
      const res = await axios.post(`${API}/assistant/chat`, { message: text, history }, authHeaders());
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
      setRemaining(res.data.remaining);
    } catch (err) {
      setError(err.response?.data?.msg || 'The assistant could not answer just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the Velaivaaipu assistant"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 h-12 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg border-none cursor-pointer"
        >
          <Sparkles size={16} /> Ask assistant
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Velaivaaipu assistant" className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[32rem] max-h-[80vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <p className="text-sm font-bold flex items-center gap-2"><Sparkles size={15} className="text-emerald-400" /> Velaivaaipu assistant</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" className="bg-transparent border-none text-white cursor-pointer p-1"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="text-slate-600 space-y-2">
                <p>Hi! I can help you find jobs, improve your profile and resume, and use Velaivaaipu.</p>
                <p>English-ல் அல்லது தமிழில் கேளுங்கள். Ask in English or Tamil.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p className={`max-w-[85%] px-3 py-2 rounded-2xl whitespace-pre-wrap break-words ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {m.role === 'assistant' ? renderReply(m.content) : m.content}
                </p>
              </div>
            ))}
            {busy && <p className="text-slate-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Thinking...</p>}
            {error && <p role="alert" className="text-rose-600 text-xs font-semibold">{error}</p>}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="border-t border-slate-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                // isComposing: pressing Enter to confirm a Tamil (or other IME) word must not send the message
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) send(e); }}
                rows={2}
                placeholder="Ask about jobs, your profile or your resume"
                aria-label="Your message"
                className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center border-none cursor-pointer">
                <Send size={15} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-snug">
              AI can make mistakes. Check important details before you act on them. Do not share passwords, OTPs or card details.
              {remaining !== null && ` ${remaining} message${remaining === 1 ? '' : 's'} left today.`}
            </p>
          </form>
        </div>
      )}
    </>
  );
};

export default AssistantWidget;
