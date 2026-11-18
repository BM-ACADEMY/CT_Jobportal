import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

// Pulls the pass code out of what the QR holds: the bare code, or a link that ends with it.
export const codeFromQr = (raw) => {
  const t = String(raw || '').trim();
  if (!t) return '';
  const noQuery = t.split(/[?#]/)[0].replace(/\/+$/, '');
  return (noQuery.includes('/') ? noQuery.split('/').pop() : noQuery).trim().toUpperCase();
};

// Camera scan for desk check-in. Uses the phone browser's built-in QR reader (Android Chrome and most Chromium browsers).
// Where the browser has none (for example iPhone Safari) the button is hidden and the desk types the code, as before.
const QrScanButton = ({ onCode }) => {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const video = useRef(null);
  const supported = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!open) return undefined;
    let stream; let timer; let stopped = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.current.srcObject = stream; await video.current.play();
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          try {
            const found = await detector.detect(video.current);
            const code = codeFromQr(found[0]?.rawValue);
            if (code) { clearInterval(timer); setOpen(false); onCode(code); }
          } catch { /* keep scanning */ }
        }, 400);
      } catch { setErr('Could not open the camera. Allow camera access, or type the code.'); }
    })();
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [open, onCode]);

  if (!supported) return null;
  return (
    <>
      <button type="button" onClick={() => { setErr(''); setOpen(true); }} className="w-full h-11 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-black flex items-center justify-center gap-2"><Camera size={16} /> Scan pass with camera</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 text-white"><X size={28} /></button>
          <video ref={video} playsInline muted className="w-full max-w-sm rounded-2xl" />
          <p className="text-white text-sm mt-3">{err || 'Hold the pass QR inside the frame'}</p>
        </div>
      )}
    </>
  );
};
export default QrScanButton;
