import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const CHECKLIST = [
  { key: 25, label: 'Add your headline, location & bio' },
  { key: 50, label: 'List your skills & qualifications' },
  { key: 75, label: 'Upload your resume' },
  { key: 100, label: 'Set your job preferences' },
];

const ProfileCompletionDialog = ({ open, onDismiss, completion = 0 }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onDismiss()}>
      <DialogContent className="max-w-md rounded-3xl border-2 border-slate-900 p-0 overflow-hidden">
        <div className="bg-slate-950 p-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="8"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - completion / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">{completion}%</span>
          </div>
          <h2 className="text-white font-bold text-xl">Your profile isn't complete yet</h2>
          <p className="text-slate-400 text-sm mt-2">Complete profiles get up to 3x more recruiter views.</p>
        </div>

        <div className="p-6 space-y-3">
          {CHECKLIST.map((item) => {
            const done = completion >= item.key;
            return (
              <div key={item.key} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 shrink-0" />
                )}
                <span className={`text-sm font-medium ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.label}</span>
              </div>
            );
          })}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onDismiss} className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 font-bold">
              Later
            </Button>
            <Button
              onClick={() => { onDismiss(); navigate('/jobseeker/settings'); }}
              className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-1.5"
            >
              Complete Now <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionDialog;
