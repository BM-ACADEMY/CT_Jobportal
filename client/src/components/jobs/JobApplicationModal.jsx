import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const JobApplicationModal = ({ isOpen, onClose, job, user }) => {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleInputChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    const missingFields = job.applicationQuestions.filter(q => 
      q.isRequired && (!answers[q._id] || (Array.isArray(answers[q._id]) && answers[q._id].length === 0))
    );

    if (missingFields.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }

    setSubmitting(true);
    try {
      // Map answers to the format expected by the backend
      const formattedAnswers = job.applicationQuestions.map(q => ({
        questionId: q._id,
        questionText: q.questionText,
        answer: answers[q._id] || ''
      }));

      const res = await axios.post(`${API_BASE_URL}/applications/apply`, { 
        jobId: job._id, 
        answers: formattedAnswers 
      });
      
      setSubmitted(true);
      toast.success(res.data.msg || "Application submitted successfully!");
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setAnswers({});
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.msg || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Apply for <span className="text-primary italic">{job.title}</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Please provide the details requested by {job.company?.name}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Application Sent!</h3>
            <p className="text-slate-500 max-w-xs">Your application has been successfully delivered. The recruiter will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {job.applicationQuestions?.map((question, index) => (
              <div key={question._id || index} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  {question.questionText}
                  {question.isRequired && <span className="text-destructive">*</span>}
                </Label>

                {question.type === 'text' && (
                  <Input 
                    placeholder={`Enter your ${question.questionText.toLowerCase()}`}
                    value={answers[question._id] || ''}
                    onChange={(e) => handleInputChange(question._id, e.target.value)}
                    required={question.isRequired}
                    className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 font-medium"
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea 
                    placeholder={`Your answer for ${question.questionText.toLowerCase()}...`}
                    value={answers[question._id] || ''}
                    onChange={(e) => handleInputChange(question._id, e.target.value)}
                    required={question.isRequired}
                    className="min-h-[100px] rounded-xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 font-medium leading-relaxed"
                  />
                )}

                {question.type === 'multiple-choice' && (
                  <Select 
                    onValueChange={(value) => handleInputChange(question._id, value)}
                    required={question.isRequired}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 focus-visible:ring-primary/20 font-medium text-left">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1">
                      {question.options?.map((option, oIdx) => (
                        <SelectItem key={oIdx} value={option} className="rounded-md cursor-pointer py-2 font-medium">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {question.type === 'checkbox' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {question.options?.map((option, oIdx) => {
                      const currentAnswers = answers[question._id] || [];
                      const isChecked = currentAnswers.includes(option);
                      
                      return (
                        <div 
                          key={oIdx} 
                          onClick={() => {
                            const newSelection = isChecked 
                              ? currentAnswers.filter(a => a !== option)
                              : [...currentAnswers, option];
                            handleInputChange(question._id, newSelection);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked 
                              ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' 
                              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <Checkbox checked={isChecked} className="rounded-md pointer-events-none" />
                          <span className="text-xs font-bold uppercase tracking-tight">{option}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {(!job.applicationQuestions || job.applicationQuestions.length === 0) && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                  The recruiter hasn't added specific screening questions. Clicking submit will send your profile directly.
                </p>
              </div>
            )}

            <DialogFooter className="pt-6 border-t border-slate-50">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="rounded-xl px-10 h-11 bg-slate-900 hover:bg-primary text-white font-bold transition-all shadow-lg shadow-slate-900/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationModal;
