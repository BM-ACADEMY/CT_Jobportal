import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Loader2, Zap, CheckCircle2, Clock, ShoppingBag } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PayPerFeatures = () => {
  const { user, refreshUser } = useAuth();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/pay-per/features`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFeatures(res.data);
      } catch (err) {
        toast.error('Failed to load pay-per features');
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
  }, [API_BASE_URL]);

  const handlePurchase = async (feature) => {
    if (!user) {
      toast.error('Please log in to purchase features');
      return;
    }

    setProcessingId(feature._id);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Step 1: Create Razorpay order
      const orderRes = await axios.post(`${API_BASE_URL}/pay-per/purchase/create-order`, {
        featureId: feature._id,
      }, { headers });

      const { orderId, amount, currency, featureName, totalAmount, gstAmount, baseAmount } = orderRes.data;

      // Step 2: Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Velaivaaipu',
        description: `Pay-per: ${featureName}`,
        order_id: orderId,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/pay-per/purchase/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              featureId: feature._id,
            }, { headers });

            if (verifyRes.data.success) {
              toast.success(verifyRes.data.msg || 'Feature purchased successfully!');
              refreshUser(); // refresh user data so purchasedFeatures updates
            }
          } catch (err) {
            toast.error(err.response?.data?.msg || 'Payment verification failed');
          } finally {
            setProcessingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingId(null);
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setProcessingId(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.response?.data?.msg || 'Failed to initiate purchase');
      setProcessingId(null);
    }
  };

  // Check if user already has an active (non-expired) purchase for this feature
  const isPurchased = (featureId) => {
    if (!user?.purchasedFeatures) return false;
    return user.purchasedFeatures.some(pf => {
      if (pf.featureId !== featureId || !pf.isActive) return false;
      if (pf.expiresAt && new Date(pf.expiresAt) < new Date()) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Loading available features...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag size={20} className="text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pay-Per Features</h1>
          </div>
          <p className="text-sm text-slate-500">Buy individual features without a full subscription. Pay only for what you need.</p>
        </div>
      </div>

      {features.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <Zap size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">No features available for your role right now.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const purchased = isPurchased(f._id);
            const isProcessing = processingId === f._id;

            return (
              <Card key={f._id} className="relative overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                      <Sparkles size={20} />
                    </div>
                    {purchased ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold px-2.5 py-1">
                        <CheckCircle2 size={10} className="mr-1" /> Active
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold">{f.days} Days</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 leading-snug">{f.name}</CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-xs mt-1.5 line-clamp-2 min-h-[32px]">
                    {f.description || 'Enhance your experience with this premium feature.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Price + Usage */}
                  <div className="flex items-end justify-between mb-5 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-3xl font-black text-slate-900">₹{f.cost}</span>
                      <span className="text-xs text-slate-400 font-medium ml-1.5">+ GST</span>
                    </div>
                    {f.usageCount > 0 && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                        {f.usageCount} Use{f.usageCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {f.usageCount === 0 && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        Unlimited
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePurchase(f)}
                    disabled={isProcessing || purchased}
                    className={`w-full h-12 rounded-xl font-bold text-sm transition-all ${
                      purchased
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 cursor-default border border-emerald-200'
                        : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : purchased ? (
                      <>
                        <CheckCircle2 size={16} className="mr-2" />
                        Already Purchased
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} className="mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.4em]">
          Secure Payments via Razorpay &bull; Instant Activation
        </p>
      </div>
    </div>
  );
};

export default PayPerFeatures;
