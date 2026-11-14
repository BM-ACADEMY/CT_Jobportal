import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { LifeBuoy, X } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// A small "Help" pill on every signed-in dashboard (above the Feedback pill). The message and the page the person is on
// go to the team's Needs action list.
const HelpButton = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => { setOpen(false); setMessage(''); };

  const send = async (e) => {
    e.preventDefault();
    if (message.trim().length < 5) { toast.error('Please tell us a little about what you need'); return; }
    setSending(true);
    try {
      await axios.post(`${API}/help-requests`, { message, pageUrl: pathname });
      toast.success('Thank you. Our team will get back to you.');
      close();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-16 left-4 z-40 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-white border border-slate-200 shadow-md text-xs font-bold text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
        aria-label="Ask for help"
      >
        <LifeBuoy size={14} /> Help
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Ask for help">
          <form onSubmit={send} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">How can we help?</h2>
              <button type="button" onClick={close} aria-label="Close" className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell us what you need help with"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800"
            />
            <button type="submit" disabled={sending} className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-60">
              {sending ? 'Sending...' : 'Send to our team'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default HelpButton;
