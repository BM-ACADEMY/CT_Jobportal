import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { LifeBuoy, MessageSquarePlus, Star, X, HelpCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const textareaCls = 'w-full rounded-xl bg-white p-3 text-[13px] text-zinc-800 ring-1 ring-zinc-200 border-none outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#34B678]';
const sendCls = 'w-full h-10 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-[13px] font-semibold border-none cursor-pointer transition disabled:opacity-60';

const Sheet = ({ label, title, onClose, onSubmit, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10213D]/40 p-4 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
    <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-zinc-200">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[15px] font-semibold text-[#10213D]">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"><X size={16} /></button>
      </div>
      {children}
    </form>
  </div>
);

const HelpSheet = ({ onClose }) => {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (message.trim().length < 5) { toast.error('Please tell us a little about what you need'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/help-requests`, { message, pageUrl: pathname });
      toast.success('Thank you. Our team will get back to you.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };
  return (
    <Sheet label="Ask for help" title="How can we help?" onClose={onClose} onSubmit={send}>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={4} autoFocus placeholder="Tell us what you need help with" className={textareaCls} />
      <button type="submit" disabled={sending} className={sendCls}>{sending ? 'Sending…' : 'Send to our team'}</button>
    </Sheet>
  );
};

const FeedbackSheet = ({ onClose }) => {
  const { pathname } = useLocation();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const send = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please tap a star rating first'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/feedback`, { rating, text, page: pathname });
      toast.success('Thank you for your feedback');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };
  return (
    <Sheet label="Send feedback" title="How is Velaivaaipu working for you?" onClose={onClose} onSubmit={send}>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="rounded-lg border-none bg-transparent p-1 cursor-pointer hover:bg-amber-50">
            <Star size={26} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'} />
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="Tell us in one line what worked or what did not (optional)" className={textareaCls} />
      <button type="submit" disabled={sending} className={sendCls}>{sending ? 'Sending…' : 'Send feedback'}</button>
    </Sheet>
  );
};

// One "Help" button in the corner of every signed-in dashboard. It opens a small menu with
// "Ask for help" (goes to the team's Needs action list) and "Give feedback" (1–5 rating).
const SupportMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const box = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const open = (kind) => { setMenuOpen(false); setSheet(kind); };
  const itemCls = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-zinc-700 border-none bg-transparent cursor-pointer hover:bg-zinc-100 hover:text-[#10213D]';

  return (
    <>
      <div ref={box} className="fixed bottom-[calc(var(--bottom-bar-h,0px)+1rem)] right-4 z-40 sm:bottom-[calc(var(--bottom-bar-h,0px)+1.25rem)] sm:right-5">
        {menuOpen && (
          <div role="menu" className="absolute bottom-11 right-0 w-48 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-zinc-200">
            <button type="button" role="menuitem" onClick={() => open('help')} className={itemCls}><LifeBuoy size={15} className="text-[#1f8a57]" /> Ask for help</button>
            <button type="button" role="menuitem" onClick={() => open('feedback')} className={itemCls}><MessageSquarePlus size={15} className="text-[#1f8a57]" /> Give feedback</button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-zinc-600 shadow-md ring-1 ring-zinc-200 border-none cursor-pointer transition hover:text-[#1f8a57] hover:ring-[#34B678]/40"
        >
          <HelpCircle size={15} /> Help
        </button>
      </div>
      {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
      {sheet === 'feedback' && <FeedbackSheet onClose={() => setSheet(null)} />}
    </>
  );
};

export default SupportMenu;
