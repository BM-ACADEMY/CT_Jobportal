import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquarePlus, Star, X } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// A small "Feedback" pill on every signed-in dashboard: a rating from 1 to 5 and an optional line.
const FeedbackButton = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => { setOpen(false); setRating(0); setText(''); };

  const send = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please tap a star rating first'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/feedback`, { rating, text, page: pathname });
      toast.success('Thank you for your feedback');
      close();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-slate-200 shadow-md text-xs font-bold text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
        aria-label="Send feedback"
      >
        <MessageSquarePlus size={14} /> Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Send feedback">
          <form onSubmit={send} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">How is Velaivaaipu working for you?</h2>
              <button type="button" onClick={close} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1">
                  <Star size={28} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us in one line what worked or what did not (optional)"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800"
            />
            <button type="submit" disabled={sending} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60">
              {sending ? 'Sending...' : 'Send feedback'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
