import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  CreditCard, CheckCircle2, XCircle, Clock, Receipt,
  Search, Download, Filter
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const STATUS_CONFIG = {
  completed:  { label: 'Active',       badge: 'bg-blue-50 text-blue-600', icon: CheckCircle2 },
  superseded: { label: 'Deactivated',  badge: 'bg-slate-50 text-slate-400',     icon: Clock },
  failed:     { label: 'Failed',       badge: 'bg-rose-50 text-rose-600',       icon: XCircle },
  pending:    { label: 'Pending',      badge: 'bg-amber-50 text-amber-600',     icon: Clock },
  cancelled:  { label: 'Cancelled',    badge: 'bg-rose-50 text-rose-400',       icon: XCircle },
};

const FILTER_OPTIONS = [
  { key: 'all',       label: 'All Transactions' },
  { key: 'completed', label: 'Active' },
  { key: 'superseded',label: 'Deactivated' },
  { key: 'failed',    label: 'Failed' },
  { key: 'pending',   label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

const generateInvoiceHTML = (payment, user) => {
  const invoiceNo   = payment.razorpay_payment_id || payment._id?.slice(-8).toUpperCase();
  const orderId     = payment.razorpay_order_id   || '—';
  const date        = new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isPayPer      = payment.paymentType === 'pay-per-feature';
  const planName      = isPayPer ? (payment.payPerFeature?.name || 'A-la-carte Feature') : (payment.plan?.name || 'Subscription Plan');
  const duration      = isPayPer ? (payment.payPerFeature?.days ? `${payment.payPerFeature.days} Days` : 'N/A') : (payment.plan?.duration || 'N/A');
  const description   = isPayPer ? 'Pay-Per Feature Unlock' : 'Velaivaaipu Premium Access';
  const method        = payment.paymentMethod || 'Razorpay';
  const statusLabel   = STATUS_CONFIG[payment.status]?.label || payment.status;
  const userName      = user?.name  || '—';
  const userEmail     = user?.email || '—';

  const baseAmt   = payment.baseAmount   || payment.amount || 0;
  const gstPct    = payment.gstPercentage || 0;
  const gstAmt    = payment.gstAmount    || 0;
  const totalAmt  = payment.amount       || 0;
  const isFree    = totalAmt === 0;

  const fmtINR = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';
  const amountDisplay = isFree ? '₹0 (Free)' : fmtINR(totalAmt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice – ${invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #e2e8f0; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; }
    .invoice-label { text-align: right; }
    .invoice-label h1 { font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px; text-transform: uppercase; }
    .invoice-label p  { font-size: 12px; color: #94a3b8; margin-top: 4px; }

    /* Meta grid */
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-block h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 10px; }
    .meta-block p  { font-size: 13px; color: #334155; line-height: 1.7; }
    .meta-block p strong { font-weight: 700; color: #1e293b; }

    /* Table */
    .table-wrap { margin-bottom: 32px; border-radius: 0; overflow: hidden; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; }
    th { padding: 12px 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; text-align: left; }
    th.right, td.right { text-align: right; }
    td { padding: 16px 20px; font-size: 13px; color: #334155; border-top: 1px solid #f1f5f9; }
    td strong { font-weight: 700; color: #1e293b; }
    tbody tr:hover { background: #fafafa; }

    /* Totals */
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { width: 280px; border: 1px solid #e2e8f0; border-radius: 0; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 20px; font-size: 13px; border-top: 1px solid #f1f5f9; }
    .totals-row:first-child { border-top: none; }
    .totals-row.total { background: #eff6ff; font-weight: 800; font-size: 14px; color: #3b82f6; }

    /* Status badge */
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 0; font-size: 11px; font-weight: 700; }
    .status-completed  { background: #dbeafe; color: #2563eb; }
    .status-superseded { background: #f1f5f9; color: #94a3b8; }
    .status-failed     { background: #fee2e2; color: #dc2626; }
    .status-pending    { background: #fef9c3; color: #ca8a04; }
    .status-cancelled  { background: #fee2e2; color: #f87171; }

    /* Footer */
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #94a3b8; }
    .footer .thanks { font-size: 13px; font-weight: 700; color: #3b82f6; }

    @media print {
      body { padding: 20px; }
      @page { margin: 12mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span class="brand-name">Velaivaaipu</span>
      <span class="brand-sub">Professional Hub</span>
    </div>
    <div class="invoice-label">
      <h1>Invoice</h1>
      <p>#${invoiceNo}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-block">
      <h3>Billed To</h3>
      <p><strong>${userName}</strong></p>
      <p>${userEmail}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <h3>Invoice Details</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Method:</strong> ${method}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${payment.status}">${statusLabel}</span></p>
      <p><strong>Total Paid:</strong> ${amountDisplay}</p>
    </div>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Plan</th>
          <th>Duration</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>${isPayPer ? 'Feature' : 'Subscription'} — ${planName}</strong><br/><span style="font-size:11px;color:#94a3b8;">${description}</span></td>
          <td>${planName}</td>
          <td>${duration}</td>
          <td class="right"><strong>${isFree ? '₹0 (Free)' : fmtINR(baseAmt)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Base Amount</span><span>${isFree ? '₹0' : fmtINR(baseAmt)}</span></div>
      <div class="totals-row"><span>GST (${gstPct}%)</span><span>${isFree ? '₹0' : fmtINR(gstAmt)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${amountDisplay}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>Velaivaaipu &bull; Professional Hub<br/>Thank you for your subscription.</p>
    <p class="thanks">Payment Verified ✓</p>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
};

const downloadInvoice = (payment, user) => {
  const html   = generateInvoiceHTML(payment, user);
  const blob   = new Blob([html], { type: 'text/html' });
  const url    = URL.createObjectURL(blob);
  const win    = window.open(url, '_blank');
  if (!win) toast.error('Allow popups to download the invoice');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(res.data);
    } catch {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const isPayPer = p.paymentType === 'pay-per-feature';
    const itemName = isPayPer ? p.payPerFeature?.name : p.plan?.name;
    const matchesSearch =
      itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeFilterLabel = FILTER_OPTIONS.find(f => f.key === statusFilter)?.label || 'All Transactions';

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-xs">Retrieving transaction history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Payment History</h1>
          <p className="text-xs text-slate-500 mt-1">View and download invoices for your subscription transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search by plan or ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#d9d9d9] hover:border-blue-500 focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.15)] transition-all outline-none rounded-none text-xs"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded border-[#d9d9d9] text-slate-700 hover:text-blue-500 hover:border-blue-500 hover:bg-white text-xs font-medium gap-2 px-4 h-9 cursor-pointer shrink-0">
                <Filter size={14} />
                {activeFilterLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded p-1 border-slate-200 shadow-xl bg-white">
              {FILTER_OPTIONS.map(f => (
                <DropdownMenuItem
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`rounded font-medium text-xs py-2 cursor-pointer hover:bg-slate-50 ${statusFilter === f.key ? 'bg-blue-50 text-blue-700 hover:bg-blue-50' : ''}`}
                >
                  {f.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8e8e8] rounded-none overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8e8e8] bg-slate-50/50">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Plan</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction ID</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8e8]">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map(payment => {
                  const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-blue-50/60 flex items-center justify-center text-blue-600 shrink-0">
                            <CreditCard size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-tight">
                              {payment.paymentType === 'pay-per-feature' ? (payment.payPerFeature?.name || 'A-la-carte Feature') : (payment.plan?.name || 'N/A')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 capitalize">
                              {payment.paymentType === 'pay-per-feature' 
                                ? (payment.payPerFeature?.days ? `${payment.payPerFeature.days} Days` : 'Feature') 
                                : (payment.plan?.duration ? `${payment.plan.duration} Plan` : '— Plan')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-none block w-fit max-w-[160px] truncate border border-slate-200">
                          {payment.razorpay_payment_id || 'FREE_PLAN'}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-1 block truncate max-w-[160px]">
                          {payment.razorpay_order_id || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-800">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-800">
                          {payment.amount > 0 ? `₹${Number(payment.amount).toLocaleString('en-IN')}` : 'FREE'}
                        </span>
                        {payment.gstPercentage > 0 && payment.amount > 0 && (
                          <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                            incl. {payment.gstPercentage}% GST
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${cfg.badge} border-none px-2.5 py-0.5 rounded-none flex items-center gap-1 w-fit shadow-none text-[10px] font-semibold`}>
                          <StatusIcon size={9} /> {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(payment, user)}
                          className="rounded text-blue-600 hover:bg-blue-50 text-xs font-medium gap-1.5 h-8 px-3 cursor-pointer"
                        >
                          <Download size={13} /> Invoice
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-none flex items-center justify-center mb-4 border border-slate-200">
                        <CreditCard size={28} className="text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-medium text-xs">No payment records found</p>
                      <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">
                        {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'No transactions yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Showing {paginatedPayments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} transactions
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 px-3 text-[11px] font-semibold rounded border-[#d9d9d9] text-slate-700 hover:text-blue-500 hover:border-blue-500 hover:bg-white cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs font-semibold text-slate-600 px-2">{currentPage} / {Math.max(1, totalPages)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="h-8 px-3 text-[11px] font-semibold rounded border-[#d9d9d9] text-slate-700 hover:text-blue-500 hover:border-blue-500 hover:bg-white cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
