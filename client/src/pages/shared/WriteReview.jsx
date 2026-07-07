import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Star, MessageSquareQuote, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;

const WriteReview = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(null); // 'pending', 'approved', 'rejected', null
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyReview();
  }, []);

  const fetchMyReview = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/reviews/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setRating(res.data.rating);
        setComment(res.data.comment);
        setStatus(res.data.status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      return toast.error('Please select a star rating');
    }
    if (!comment.trim()) {
      return toast.error('Please write a comment');
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/reviews`, { rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus(res.data.status);
      toast.success('Review submitted successfully!');
    } catch (err) {
      toast.error('Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">Share your experience with Velaivaaipu.</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {status === 'approved' && <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" />}
          {status === 'rejected' && <AlertCircle className="text-rose-500 shrink-0 mt-0.5" />}
          {status === 'pending' && <AlertCircle className="text-blue-500 shrink-0 mt-0.5" />}
          
          <div>
            <p className="font-bold text-sm capitalize">Status: {status}</p>
            <p className="text-xs opacity-80 mt-0.5">
              {status === 'approved' && 'Your review has been approved and may be featured on our homepage!'}
              {status === 'rejected' && 'Your review was rejected because it did not meet our community guidelines. You can edit and resubmit.'}
              {status === 'pending' && 'Your review is currently pending moderation. It will be reviewed by our team shortly.'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Rating */}
          <div className="space-y-3 text-center">
            <label className="block text-sm font-bold text-slate-700">How would you rate your experience?</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs font-medium text-amber-600">
                {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <MessageSquareQuote size={16} /> Your Review
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved or how we can improve..."
              className="w-full h-32 p-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              maxLength={500}
            />
            <div className="flex justify-end">
              <span className="text-xs text-slate-400 font-medium">
                {comment.length}/500
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              disabled={saving || (status === 'approved' && !comment)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 font-bold"
            >
              {saving ? 'Submitting...' : status ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReview;
