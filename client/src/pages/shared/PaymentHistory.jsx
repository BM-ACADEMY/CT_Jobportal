import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Receipt,
  Search,
  Download,
  Filter
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Retrieving transaction history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage your past subscription transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search by plan or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <Button variant="outline" className="rounded-xl h-10 border-slate-200 text-slate-600 hover:bg-slate-50">
            <Filter size={16} className="mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan Details</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction ID</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Receipt size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {payment.plan?.name || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 capitalize">
                            {payment.plan?.duration || 'Unknown'} Plan
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md w-fit">
                          {payment.razorpay_payment_id || 'FREE_PLAN'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Order: {payment.razorpay_order_id || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {payment.status === 'superseded' && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Superseded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900">
                        {payment.amount > 0 ? `₹${payment.amount}` : 'FREE'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {payment.status === 'completed' ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <CheckCircle2 size={10} /> Active
                        </Badge>
                      ) : payment.status === 'superseded' ? (
                        <Badge className="bg-slate-50 text-slate-400 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <Clock size={10} /> Deactivated
                        </Badge>
                      ) : payment.status === 'failed' ? (
                        <Badge className="bg-rose-50 text-rose-600 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <XCircle size={10} /> Failed
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-600 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <Clock size={10} /> Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-lg h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download size={14} className="mr-1.5" /> Invoice
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <CreditCard size={28} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-semibold">No payment records found</p>
                      <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Try adjusting your search filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Showing {filteredPayments.length} transactions
        </p>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
          End of List
        </p>
      </div>
    </div>
  );
};

export default PaymentHistory;
