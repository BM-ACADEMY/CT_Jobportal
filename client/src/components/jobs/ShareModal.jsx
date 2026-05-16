import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Copy, 
  Check, 
  MessageCircle,
  Share2
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
      color: 'bg-[#25D366] hover:bg-[#20ba59]',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'bg-[#0077B5] hover:bg-[#006399]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-[#000000] hover:bg-[#333333]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
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
      <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-white to-emerald-50/30 p-8">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Share2 size={24} />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Share Opportunity</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm">
              Know someone perfect for this role? Share it with them!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Job Preview Card */}
            <div className="bg-white/60 backdrop-blur-sm border border-white rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Position</p>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{jobTitle}</h4>
              <p className="text-xs font-bold text-primary mt-0.5">{companyName}</p>
            </div>

            {/* Social Share Grid */}
            <div className="grid grid-cols-3 gap-4">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-14 h-14 ${option.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 transition-all group-hover:scale-110 group-active:scale-95`}>
                    {option.icon}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                    {option.name}
                  </span>
                </a>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-black">
                <span className="bg-transparent px-4 text-slate-300 tracking-widest">Or copy link</span>
              </div>
            </div>

            {/* Copy Link Input */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-primary/20 transition-all">
              <div className="flex-1 px-3 text-xs font-bold text-slate-500 truncate">
                {shareUrl}
              </div>
              <Button
                size="sm"
                onClick={handleCopy}
                className={`rounded-xl h-10 px-4 font-black text-xs transition-all ${
                  copied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-primary'
                }`}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 mr-2" /> Copied</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 mr-2" /> Copy</>
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
