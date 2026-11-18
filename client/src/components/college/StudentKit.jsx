import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Copy, QrCode, MessageCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const messageFor = (lang, college, link) => (lang === 'ta'
  ? `வணக்கம்! ${college} வேலைவாய்ப்புப் பிரிவு, Velaivaaipu மூலம் வேலை வாய்ப்புகளையும் இலவச திறன் தேர்வுகளையும் வழங்குகிறது. இலவசமாகப் பதிவு செய்ய: ${link}\nபதிவு செய்யும்போது உங்கள் கல்லூரியைத் தேர்ந்தெடுக்கவும்.`
  : `Hello! The placement cell of ${college} is now on Velaivaaipu. You can find jobs and take free skill tests there. Register free here: ${link}\nChoose your college when you register.`);

// A ready-to-use kit for the TPO's first week: the CSV template, a message to forward to students, and the QR page.
const StudentKit = ({ collegeName }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const link = `${window.location.origin}/register`;
  const text = messageFor(lang, collegeName || 'our college', link);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast.success('Message copied. Paste it in your students’ WhatsApp group.'); }
    catch (e) { toast.error('Could not copy. Press and hold the message to copy it.'); }
  };
  const template = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/college/students/csv-template`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a'); a.href = url; a.download = 'student_import_template.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error('Could not download the template'); }
  };

  return (
    <div className="border border-slate-200 bg-white p-5">
      <p className="m-0 font-black text-slate-800 text-sm uppercase tracking-wider">Bring your students in: 3 easy ways</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="space-y-2">
          <p className="m-0 font-bold text-slate-700">1. Upload the list you already have</p>
          <p className="m-0 text-slate-500 text-xs">Fill our CSV template once. Accounts are created for you.</p>
          <button type="button" onClick={template} className="inline-flex items-center gap-1 text-xs font-bold text-[#1b496d] bg-transparent border-0 cursor-pointer p-0"><Download size={14} /> Download the template</button>
        </div>
        <div className="space-y-2">
          <p className="m-0 font-bold text-slate-700">2. Send a message to students</p>
          <textarea readOnly value={text} rows={5} className="w-full text-xs border border-slate-200 p-2 text-slate-600" />
          <div className="flex items-center gap-3">
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-xs font-bold text-[#1b496d] bg-transparent border-0 cursor-pointer p-0"><Copy size={14} /> Copy message</button>
            <button type="button" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')} className="inline-flex items-center gap-1 text-xs text-slate-500 bg-transparent border-0 cursor-pointer p-0"><MessageCircle size={14} /> {lang === 'en' ? 'தமிழில்' : 'In English'}</button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="m-0 font-bold text-slate-700">3. Put a QR on the notice board</p>
          <p className="m-0 text-slate-500 text-xs">Every drive has its own QR code. Students scan it and join in seconds.</p>
          <button type="button" onClick={() => navigate('/college/drives')} className="inline-flex items-center gap-1 text-xs font-bold text-[#1b496d] bg-transparent border-0 cursor-pointer p-0"><QrCode size={14} /> Open drives and get the QR</button>
        </div>
      </div>
    </div>
  );
};

export default StudentKit;
