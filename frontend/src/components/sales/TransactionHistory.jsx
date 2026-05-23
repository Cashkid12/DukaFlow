import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  Search, Download, X, Printer, Share2,
  Banknote, Smartphone, User, ChevronLeft, ChevronRight,
  Clock, MoreVertical, CheckCircle, AlertCircle,
  FileText, Calendar, Loader2, Hash, Phone, Filter,
} from 'lucide-react';
import ReceiptView, { printReceipt, generateWhatsAppMessage } from './ReceiptView';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const PAYMENT_CONFIG = {
  cash: { icon: Banknote, dot: 'bg-[#10B981]', label: 'Cash' },
  mpesa: { icon: Smartphone, dot: 'bg-[#3B82F6]', label: 'M-Pesa' },
  card: { icon: User, dot: 'bg-[#F59E0B]', label: 'Credit' },
};

const DATE_RANGES = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

const getDateRange = (key) => {
  const now = new Date();
  const start = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (key) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week': {
      const day = start.getDay();
      start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      return { startDate: '', endDate: '' };
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const fetchSales = async ({ token, page, limit, search, paymentMethod, startDate, endDate, worker }) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  if (paymentMethod && paymentMethod !== 'all') params.append('paymentMethod', paymentMethod);
  if (worker && worker !== 'all') params.append('worker', worker);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await fetch(`${API_BASE_URL}/sales?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  const result = await res.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
};

const EmptyHistory = ({ onNewSale }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
      <FileText size={40} className="text-neutral-200" />
    </div>
    <h2 className="text-xl font-bold text-[#1E293B] mb-2">No transactions yet</h2>
    <p className="text-[15px] text-[#64748B] max-w-md mb-6">
      Sales you record will appear here. Go to New Sale to record your first sale.
    </p>
    <button onClick={onNewSale} className="px-6 py-3 bg-[#312E81] text-white rounded-xl hover:bg-[#1E1B4B] transition-colors font-medium text-sm">
      Record Your First Sale →
    </button>
  </div>
);

const StatusBadge = ({ status, dueDate: due }) => {
  const isOverdue = status === 'pending' && due && new Date(due) < new Date();

  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
        <CheckCircle size={11} /> {due ? 'Paid' : 'Completed'}
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#991B1B]">
        <AlertCircle size={11} /> Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
      <Clock size={11} /> Pending
    </span>
  );
};

const TransactionHistory = ({ shopInfo, workers, onBackToNew, workerName }) => {
  const { userId, getToken } = useAuth();
  const queryClient = useQueryClient();

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [workerFilter, setWorkerFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const limit = 20;

  // Receipt panel
  const [selectedSale, setSelectedSale] = useState(null);
  const [showReceiptPanel, setShowReceiptPanel] = useState(false);

  // Mark as paid modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Action menu
  const [actionMenuId, setActionMenuId] = useState(null);

  const dateFilter = dateRange === 'custom'
    ? { startDate: customStartDate ? new Date(customStartDate).toISOString() : '', endDate: customEndDate ? new Date(customEndDate + 'T23:59:59.999Z').toISOString() : '' }
    : getDateRange(dateRange);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales', 'history', page, search, paymentFilter, workerFilter, dateFilter.startDate, dateFilter.endDate],
    queryFn: async () => {
      const token = await getToken();
      return fetchSales({ token, page, limit, search, paymentMethod: paymentFilter, worker: workerFilter, ...dateFilter });
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/sales/${selectedSale._id}/pay`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentDate: payDate, paymentMethod: payMethod, notes: payNotes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to mark as paid');
      }
      return res.json();
    },
    onSuccess: () => {
      setShowPayModal(false);
      setPayError('');
      setSelectedSale((prev) => prev ? { ...prev, paymentStatus: 'paid', amountPaid: prev.total, paidAt: payDate || new Date().toISOString() } : null);
      queryClient.invalidateQueries({ queryKey: ['sales', 'history'] });
    },
    onError: (err) => {
      setPayError(err.message || 'Failed to mark as paid');
    },
  });

  // Keyboard — Escape to close panels
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (showPayModal) setShowPayModal(false);
        else if (showReceiptPanel) setShowReceiptPanel(false);
        else if (actionMenuId) setActionMenuId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPayModal, showReceiptPanel, actionMenuId]);

  // Socket for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
    socket.on('sale:completed', () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'history'] });
    });
    socket.on('transaction:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'history'] });
    });
    return () => { if (socket.connected) socket.disconnect(); };
  }, [queryClient]);

  const handleExportCSV = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (paymentFilter !== 'all') params.append('paymentMethod', paymentFilter);
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);

      const res = await fetch(`${API_BASE_URL}/sales/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-export-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [getToken, paymentFilter, dateFilter]);

  const openReceipt = useCallback((sale) => {
    setSelectedSale(sale);
    setShowReceiptPanel(true);
    setActionMenuId(null);
  }, []);

  const openPayModal = useCallback((sale) => {
    const today = new Date().toISOString().split('T')[0];
    setPayDate(today);
    setPayMethod('cash');
    setPayNotes('');
    setPayError('');
    setSelectedSale(sale);
    setShowPayModal(true);
    setShowReceiptPanel(false);
    setActionMenuId(null);
  }, []);

  const handleMarkPaid = useCallback(() => {
    setPaying(true);
    markAsPaidMutation.mutate();
  }, [markAsPaidMutation]);

  useEffect(() => {
    if (!markAsPaidMutation.isPending) setPaying(false);
  }, [markAsPaidMutation.isPending]);

  const sales = data?.sales || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;
  const showing = sales.length > 0 ? `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} transactions` : '';

  // Action menu click outside
  useEffect(() => {
    if (!actionMenuId) return;
    const close = () => setActionMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [actionMenuId]);

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-0">
        <button onClick={onBackToNew} className="px-5 py-3 text-sm font-medium text-[#64748B] border-b-[3px] border-transparent hover:text-[#334155]">New Sale</button>
        <button className="px-5 py-3 text-sm font-medium text-[#312E81] border-b-[3px] border-[#312E81]">Transaction History</button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[#1E293B]">Transaction History</h2>
        <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#CBD5E1] text-[#64748B] rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3">
        {/* Date range */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {DATE_RANGES.map((dr) => (
            <button
              key={dr.key}
              onClick={() => { setDateRange(dr.key); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                dateRange === dr.key
                  ? 'bg-[#312E81] text-white border-[#312E81]'
                  : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#312E81]'
              }`}
            >
              {dr.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-neutral-400" />
              <input type="date" value={customStartDate} onChange={(e) => { setCustomStartDate(e.target.value); setPage(1); }} className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-1.5 outline-none focus:border-[#312E81]" />
            </div>
            <span className="text-xs text-neutral-400">to</span>
            <input type="date" value={customEndDate} onChange={(e) => { setCustomEndDate(e.target.value); setPage(1); }} className="text-xs border border-[#CBD5E1] rounded-lg px-3 py-1.5 outline-none focus:border-[#312E81]" />
          </div>
        )}

        {/* Payment method + Worker + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {[{ key: 'all', label: 'All' }, ...Object.entries(PAYMENT_CONFIG).map(([k, v]) => ({ key: k, label: v.label }))].map((pm) => (
              <button
                key={pm.key}
                onClick={() => { setPaymentFilter(pm.key); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                  paymentFilter === pm.key
                    ? 'bg-[#312E81] text-white border-[#312E81]'
                    : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#312E81]'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          <select
            value={workerFilter}
            onChange={(e) => { setWorkerFilter(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#312E81] bg-white text-[#64748B]"
          >
            <option value="all">All Workers</option>
            {workers.map((w) => (
              <option key={w._id} value={w._id}>{w.fullName}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by receipt number or product..."
              className="w-full h-9 pl-9 pr-3 border border-[#CBD5E1] rounded-lg text-xs outline-none focus:border-[#312E81]"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#312E81] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <EmptyHistory onNewSale={onBackToNew} />
      )}

      {/* Desktop Table */}
      {!isLoading && sales.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 border-b-2 border-neutral-200 text-[13px] font-semibold text-[#64748B] uppercase">
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Receipt #</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Worker</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const pm = PAYMENT_CONFIG[sale.paymentMethod] || PAYMENT_CONFIG.cash;
                  const Icon = pm.icon;
                  const workerObj = typeof sale.soldBy === 'object' ? sale.soldBy : workers.find((w) => w._id === sale.soldBy);
                  const wName = workerObj?.fullName || '';
                  const wInitials = wName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  const itemCount = (sale.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
                  const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <tr
                      key={sale._id}
                      onClick={() => openReceipt(sale)}
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-[13px] text-[#64748B] whitespace-nowrap">{timeStr}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm font-mono font-medium text-[#312E81]">{sale.saleNumber}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[13px] text-[#334155]">{itemCount} item{itemCount !== 1 ? 's' : ''}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[15px] font-semibold text-[#1E293B]">{formatCurrency(sale.total)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${pm.dot}`} />
                          <Icon size={14} className="text-[#64748B]" />
                          <span className="text-[13px] text-[#334155]">{pm.label}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#312E81] text-[11px] font-semibold flex items-center justify-center shrink-0">
                            {wInitials}
                          </span>
                          <span className="text-[13px] text-[#334155]">{wName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={sale.paymentStatus} dueDate={sale.dueDate} />
                      </td>
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(actionMenuId === sale._id ? null : sale._id);
                          }}
                          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <MoreVertical size={16} className="text-[#64748B]" />
                        </button>

                        {actionMenuId === sale._id && (
                          <div
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 z-50 py-1 animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openReceipt(sale)}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#334155] hover:bg-neutral-50 text-left"
                            >
                              <FileText size={15} /> View Receipt
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSale(sale);
                                setActionMenuId(null);
                                setTimeout(() => printReceipt(sale, shopInfo, wName), 100);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#334155] hover:bg-neutral-50 text-left"
                            >
                              <Printer size={15} /> Print Receipt
                            </button>
                            <button
                              onClick={() => {
                                const msg = generateWhatsAppMessage(sale, shopInfo);
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#334155] hover:bg-neutral-50 text-left"
                            >
                              <Share2 size={15} /> Share via WhatsApp
                            </button>
                            {sale.paymentMethod === 'card' && sale.paymentStatus === 'pending' && (
                              <button
                                onClick={() => openPayModal(sale)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#312E81] hover:bg-[#EEF2FF] text-left font-medium border-t border-neutral-100"
                              >
                                <CheckCircle size={15} /> Mark as Paid
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sales.map((sale) => {
              const pm = PAYMENT_CONFIG[sale.paymentMethod] || PAYMENT_CONFIG.cash;
              const Icon = pm.icon;
              const workerObj = typeof sale.soldBy === 'object' ? sale.soldBy : workers.find((w) => w._id === sale.soldBy);
              const wName = workerObj?.fullName || '';
              const itemCount = (sale.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
              const timeStr = sale.createdAt ? new Date(sale.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={sale._id}
                  onClick={() => openReceipt(sale)}
                  className="bg-white rounded-xl border border-neutral-200 p-4 active:scale-[0.99] transition-transform cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-mono font-medium text-[#312E81]">{sale.saleNumber}</span>
                      <span className="text-xs text-[#64748B] ml-2">{timeStr}</span>
                    </div>
                    <StatusBadge status={sale.paymentStatus} dueDate={sale.dueDate} />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[13px] text-[#64748B]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${pm.dot}`} />
                        <Icon size={13} className="text-[#64748B]" />
                        <span className="text-xs text-[#64748B]">{pm.label}</span>
                        <span className="text-xs text-neutral-300">·</span>
                        <span className="text-xs text-[#64748B]">{wName}</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#1E293B]">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[#64748B]">{showing}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-xs text-neutral-400 px-1">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-[#312E81] text-white'
                            : 'border border-[#CBD5E1] text-[#64748B] hover:bg-neutral-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#CBD5E1] text-[#64748B] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Receipt Slide-Out Panel */}
      {showReceiptPanel && selectedSale && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 hidden md:block" onClick={() => setShowReceiptPanel(false)} />
          <div
            className={`fixed inset-y-0 right-0 z-50 bg-white shadow-2xl flex flex-col animate-slideRight ${
              'w-full md:w-[450px] h-full'
            }`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 shrink-0">
              <h3 className="font-semibold text-[#1E293B]">Receipt</h3>
              <button onClick={() => setShowReceiptPanel(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                <X size={20} className="text-[#64748B]" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <ReceiptView sale={selectedSale} shop={shopInfo} workerName={workerName || (typeof selectedSale.soldBy === 'object' ? selectedSale.soldBy?.fullName : '')} />

              {/* Payment Status for Credit */}
              {selectedSale.paymentMethod === 'card' && (
                <div className="mt-4 p-4 rounded-xl border border-neutral-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${selectedSale.paymentStatus === 'paid' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} />
                    <span className="text-sm font-semibold text-[#1E293B]">
                      Payment Status: {selectedSale.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  {selectedSale.paymentStatus === 'pending' && selectedSale.dueDate && (
                    <p className="text-sm text-[#64748B] ml-5">
                      Due {formatDateTime(selectedSale.dueDate)}
                      {new Date(selectedSale.dueDate) < new Date() && (
                        <span className="text-[#EF4444] font-medium ml-1">(Overdue)</span>
                      )}
                    </p>
                  )}
                  {selectedSale.paymentStatus === 'paid' && selectedSale.paidAt && (
                    <p className="text-sm text-[#64748B] ml-5">Paid on {formatDateTime(selectedSale.paidAt)}</p>
                  )}
                  {selectedSale.paymentHistory && selectedSale.paymentHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <p className="text-xs font-medium text-[#64748B] mb-2">Payment History</p>
                      {selectedSale.paymentHistory.map((ph, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-[#64748B] py-1">
                          <span>{formatDateTime(ph.date)}</span>
                          <span>{formatCurrency(ph.amount)} · {ph.method}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel Actions */}
            <div className="p-4 border-t border-neutral-200 flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => printReceipt(selectedSale, shopInfo, workerName || (typeof selectedSale.soldBy === 'object' ? selectedSale.soldBy?.fullName : ''))}
                className="flex-1 min-w-[100px] py-2.5 border border-[#CBD5E1] text-[#334155] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={() => {
                  const msg = generateWhatsAppMessage(selectedSale, shopInfo);
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="flex-1 min-w-[100px] py-2.5 border border-[#CBD5E1] text-[#334155] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
              >
                <Share2 size={16} /> Share
              </button>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  const receiptHTML = document.getElementById('receipt-content')?.outerHTML;
                  if (!receiptHTML) return;
                  const blob = new Blob([`<!DOCTYPE html><html><head><title>Receipt ${selectedSale.saleNumber}</title><script src="https://cdn.tailwindcss.com"><\/script></head><body class="bg-white p-4">${receiptHTML}</body></html>`], { type: 'text/html' });
                  a.href = URL.createObjectURL(blob);
                  a.download = `Receipt-${selectedSale.saleNumber}.html`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                className="flex-1 min-w-[100px] py-2.5 border border-[#CBD5E1] text-[#334155] rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
              >
                <Download size={16} /> Download
              </button>
              {selectedSale.paymentMethod === 'card' && selectedSale.paymentStatus === 'pending' && (
                <button
                  onClick={() => openPayModal(selectedSale)}
                  className="w-full py-2.5 bg-[#312E81] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1E1B4B] transition-colors"
                >
                  <CheckCircle size={16} /> Mark as Paid
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mark as Paid Modal */}
      {showPayModal && selectedSale && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPayModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[20px] p-6 max-w-[420px] w-full shadow-2xl animate-fadeIn">
              <h2 className="text-xl font-bold text-[#1E293B] mb-1">Mark Credit as Paid</h2>

              <div className="bg-neutral-50 rounded-xl p-4 mb-5 space-y-1 text-sm">
                <p className="text-[#64748B]">Customer: <span className="font-medium text-[#1E293B]">{selectedSale.customerName}</span></p>
                <p className="text-[#64748B]">Amount: <span className="font-bold text-[#E8835C]">{formatCurrency(selectedSale.total)}</span></p>
                {selectedSale.dueDate && (
                  <p className="text-[#64748B]">Due: <span className="font-medium">{formatDateTime(selectedSale.dueDate)}</span></p>
                )}
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-sm font-medium text-[#334155] block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full h-11 px-3 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#334155] block mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-11 px-3 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#334155] block mb-1">Notes (Optional)</label>
                  <textarea
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-[#CBD5E1] rounded-[10px] text-sm outline-none focus:border-[#312E81] resize-none"
                  />
                </div>
              </div>

              {payError && (
                <p className="text-sm text-[#EF4444] mb-4 p-3 bg-[#FEF2F2] rounded-lg">{payError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-3 border border-[#CBD5E1] text-[#64748B] rounded-xl font-medium text-sm hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={paying}
                  className="flex-1 py-3 bg-[#312E81] text-white rounded-xl font-semibold text-sm hover:bg-[#1E1B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
