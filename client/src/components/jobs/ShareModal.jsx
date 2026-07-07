import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  MessageCircle,
  Share2,
  Mail
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const ShareModal = ({ isOpen, onClose, jobTitle, companyName, shareUrl }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out this job opportunity: ${jobTitle} at ${companyName}`;
  
  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M11.944 0C5.344 0 0 5.344 0 11.944c0 6.6 5.344 11.944 11.944 11.944 6.6 0 11.944-5.344 11.944-11.944C23.888 5.344 18.544 0 11.944 0zm5.82 8.358l-1.936 9.127c-.143.639-.523.797-1.057.498l-2.95-2.175-1.423 1.37c-.158.158-.29.29-.595.29l.21-2.99 5.44-4.914c.237-.21-.052-.328-.368-.117l-6.726 4.23-2.9-.908c-.63-.198-.643-.63.13-.93l11.35-4.375c.526-.198.986.117.768.919z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      action: (e) => {
        e.preventDefault();
        // Trigger copying directly
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopied(true);
          toast.success("Link copied! Instagram doesn't support web share links. You can now paste the link in your Stories or DMs.");
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
          // Fallback copy
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            toast.success("Link copied! Instagram doesn't support web share links. You can now paste the link in your Stories or DMs.");
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            toast.error("Failed to copy link");
          }
          document.body.removeChild(textArea);
        });
      }
    },
    {
      name: 'Reddit',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.41-4.43 3.86.83c.03.92.8 1.66 1.73 1.66 1.02 0 1.85-.83 1.85-1.85s-.83-1.85-1.85-1.85c-.82 0-1.52.54-1.76 1.27l-4.32-.93c-.22-.05-.44.09-.5.3l-1.6 5c-2.48.06-4.73.7-6.39 1.71-.56-.73-1.44-1.19-2.44-1.19-1.65 0-3 1.35-3 3 0 1.15.65 2.14 1.62 2.63-.03.25-.05.5-.05.75 0 3.86 5.01 7 11.2 7s11.2-3.14 11.2-7c0-.25-.02-.5-.05-.75.97-.49 1.62-1.48 1.62-2.63zm-18 1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm11.2 4.96c-1.01 1.01-2.92 1.1-3.2 1.1-.28 0-2.19-.09-3.2-1.1-.11-.11-.11-.3 0-.41.11-.11.3-.11.41 0 .82.82 2.37.9 2.79.9.42 0 1.97-.08 2.79-.9.11-.11.3-.11.41 0 .11.11.11.29 0 .41zm-.8-3.46c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      url: `mailto:?subject=${encodeURIComponent(jobTitle + ' - Job Opportunity')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      // Fallback for non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(textArea);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-white to-emerald-50/30 p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <Share2 size={20} />
              </div>
              <div className="text-left">
                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Share Opportunity</DialogTitle>
                <DialogDescription className="text-slate-500 font-bold text-xs">
                  Know someone perfect for this role? Share it with them!
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 w-full max-w-full">
            {/* Job Preview Card */}
            <div className="bg-white/60 backdrop-blur-sm border border-white rounded-2xl p-3 shadow-sm w-full overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Position</p>
              <h4 className="text-sm font-bold text-slate-900 truncate">{jobTitle}</h4>
              <p className="text-xs font-bold text-primary mt-0.5 truncate">{companyName}</p>
            </div>

            {/* Social Share Grid */}
            <div className="grid grid-cols-4 gap-3 w-full">
              {shareOptions.map((option) => {
                const ItemTag = option.url ? 'a' : 'button';
                const extraProps = option.url 
                  ? { href: option.url, target: "_blank", rel: "noopener noreferrer" } 
                  : { onClick: option.action };

                return (
                  <ItemTag
                    key={option.name}
                    className="flex flex-col items-center gap-1.5 group focus:outline-none w-full"
                    {...extraProps}
                  >
                    <div className="w-12 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 group-hover:scale-105 group-active:scale-95">
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors truncate w-full text-center">
                      {option.name}
                    </span>
                  </ItemTag>
                );
              })}
            </div>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black w-full">
                <span className="bg-white/80 backdrop-blur-sm px-4 text-slate-300 tracking-widest">Or copy link</span>
              </div>
            </div>

            {/* Copy Link Input */}
            <div className="flex flex-row items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-primary/20 transition-all w-full max-w-full overflow-hidden">
              <div className="flex-1 min-w-0 px-2 text-xs font-bold text-slate-500 truncate select-all">
                {shareUrl}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                className={`flex-shrink-0 rounded-xl h-9 px-4 font-black text-xs transition-all ${
                  copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-primary'
                }`}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 mr-1" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
