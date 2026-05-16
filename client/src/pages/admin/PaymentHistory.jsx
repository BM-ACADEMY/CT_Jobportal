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
  Filter,
  User,
  Shield
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminPaymentHistory = () => {
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
      const res = await axios.get(`${API_BASE_URL}/payments/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load global payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Retrieving master transaction records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Payment Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">Audit and monitor all platform-wide subscription transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search user, plan, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <Button variant="outline" className="rounded-xl h-10 border-slate-200 text-slate-600 hover:bg-slate-50">
            <Filter size={16} className="mr-2" /> Filter
          </Button>
          <Button className="rounded-xl h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 uppercase tracking-widest">
            <Download size={14} className="mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats (Optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900">₹{payments.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed Payments</p>
          <p className="text-2xl font-bold text-emerald-600">{payments.filter(p => p.status === 'completed').length}</p>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/30">
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">User / Account</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction Details</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 rounded-xl border border-slate-100">
                          <AvatarImage src={payment.user?.avatar} />
                          <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                            {payment.user?.name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {payment.user?.name || 'Deleted User'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate max-w-[150px]">
                            {payment.user?.email || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900">{payment.plan?.name || 'N/A'}</p>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 rounded-md border-slate-100 text-slate-400 mt-1 w-fit">
                          {payment.user?.role || 'user'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                          {payment.razorpay_payment_id || 'FREE'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Shield size={10} className="text-slate-300" />
                          <span className="text-[9px] text-slate-400 font-medium">Order: {payment.razorpay_order_id || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900">
                        ₹{payment.amount?.toLocaleString() || 0}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">
                        {payment.paymentMethod || 'Razorpay'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {payment.status === 'completed' ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <CheckCircle2 size={10} /> Verified
                        </Badge>
                      ) : payment.status === 'superseded' ? (
                        <Badge className="bg-slate-50 text-slate-400 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <Shield size={10} /> Superseded
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-50 text-rose-600 border-none px-2.5 py-0.5 rounded-lg flex items-center gap-1 w-fit shadow-none">
                          <XCircle size={10} /> Failed
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(payment.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Receipt size={28} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-semibold">No transaction records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentHistory;
