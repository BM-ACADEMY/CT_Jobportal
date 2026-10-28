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
      <DialogContent className="max-w-md rounded-3xl border-2 border-slate-900 p-0 overflow-hidden">
        <div className="bg-slate-950 p-8">
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
            {data.firstName ? `Hi ${data.firstName}` : 'Welcome'} · Step {i + 1} of {slides.length}
          </p>
          <DialogTitle className="text-white font-bold text-xl">{slide.title}</DialogTitle>
          <DialogDescription className="text-slate-300 text-sm mt-3 leading-relaxed">{slide.body}</DialogDescription>
          <div className="flex gap-1.5 mt-6">
            {slides.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? 'w-8 bg-emerald-400' : 'w-3 bg-white/20'}`} />
            ))}
          </div>
        </div>
        <div className="p-5 flex items-center gap-3">
          <button type="button" onClick={skip} className="text-sm font-semibold text-slate-500 hover:text-slate-700 bg-transparent border-none cursor-pointer mr-auto">
            Skip
          </button>
          {i > 0 && (
            <Button variant="outline" onClick={() => setI(i - 1)} className="h-11 rounded-xl border-slate-200 text-slate-600 font-bold gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
          )}
          {last ? (
            <Button onClick={finish} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5">
              {data.complete ? 'Done' : 'Start my checklist'} <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={() => setI(i + 1)} className="h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5">
              Next <ArrowRight size={15} />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeTour;
