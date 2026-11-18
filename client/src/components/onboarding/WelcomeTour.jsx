import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { TOUR } from '../../data/onboardingTour';
import { useOnboarding } from '../../context/OnboardingContext';

// First-login walkthrough. Skippable, and can be replayed from the checklist card.
const WelcomeTour = () => {
  const { data, tourOpen, closeTour } = useOnboarding();
  const navigate = useNavigate();
  const [i, setI] = useState(0);

  if (!data?.enabled) return null;
  const slides = TOUR[data.group] || [];
  if (!slides.length) return null;
  const last = i === slides.length - 1;
  const slide = slides[Math.min(i, slides.length - 1)];

  const finish = () => {
    const next = data.nextStep;
    closeTour();
    setI(0);
    if (next?.path) navigate(next.path);
  };
  const skip = () => { closeTour(); setI(0); };

  return (
    <Dialog open={tourOpen} onOpenChange={(v) => !v && skip()}>
      <DialogContent className="max-w-md rounded-2xl border border-zinc-200 p-0 overflow-hidden">
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-[#eaf7f0] p-7 border-b border-zinc-100">
          <svg className="pointer-events-none absolute -right-20 -top-20 h-56 w-56" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            {[60, 75, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} stroke="#34B678" strokeOpacity="0.2" strokeWidth="0.6" />)}
          </svg>
          <p className="relative m-0 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f8a57]">
            {data.firstName ? `Vanakkam, ${data.firstName}` : 'Welcome'} · Step {i + 1} of {slides.length}
          </p>
          <DialogTitle className="relative text-[#10213D] font-bold text-lg">{slide.title}</DialogTitle>
          <DialogDescription className="relative text-zinc-600 text-[13px] mt-2 leading-relaxed">{slide.body}</DialogDescription>
          <div className="relative flex gap-1.5 mt-5">
            {slides.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-8 bg-[#34B678]' : 'w-3 bg-zinc-200'}`} />
            ))}
          </div>
        </div>
        <div className="px-5 py-4 flex items-center gap-2.5">
          <button type="button" onClick={skip} className="text-[13px] font-medium text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer mr-auto">
            Skip
          </button>
          {i > 0 && (
            <Button variant="outline" onClick={() => setI(i - 1)} className="h-10 rounded-xl border-zinc-200 text-zinc-700 text-[13px] font-semibold gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
          )}
          {last ? (
            <Button onClick={finish} className="h-10 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-[13px] font-semibold gap-1.5">
              {data.complete ? 'Done' : 'Start my checklist'} <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={() => setI(i + 1)} className="h-10 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] text-white text-[13px] font-semibold gap-1.5">
              Next <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeTour;
