import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Mail, Download, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, Receipt, Package, Users, CreditCard,
  ChevronLeft, ChevronRight, BarChart3, PieChart, Loader2,
  AlertCircle, FileText, Clock, Zap, ArrowUpRight, ArrowDownRight,
  Home, Wrench, Circle, Plus, Send, X, CheckCircle, ArrowRight,
  Award, Filter, Star, Medal, Eye, Link, Printer, Image, GripHorizontal,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, PieChart as RPieChart, Pie, Cell, Legend,
} from 'recharts';
import { reportService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { ROLES } from '../utils/permissions';

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = ['#312E81', '#E8835C', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];
const TABS = [
  { key: 'daily', label: 'Daily Summary' },
  { key: 'weekly', label: 'Weekly Overview' },
  { key: 'monthly', label: 'Monthly P&L' },
  { key: 'products', label: 'Products' },
  { key: 'workers', label: 'Workers' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (n) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);
};

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
};

const toDateStr = (d) => {
  if (typeof d === 'string') return d;
  return d.toISOString().slice(0, 10);
};

const getWeekRange = (offset = 0) => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
};

const EXPENSE_ICONS = {
  rent: Home,
  electricity: Zap,
  salary: Users,
  utilities: Wrench,
  supplies: Package,
  other: Circle,
};

const formatDateDisplay = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const datePart = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  if (d.toDateString() === today.toDateString()) return `Today, ${datePart}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${datePart}`;
  const dayName = DAY_NAMES[d.getDay()];
  return `${dayName}, ${datePart}`;
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const TabButton = ({ tab, active, onClick }) => (
  <button
    onClick={() => onClick(tab.key)}
    className={`px-4 py-2.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
      active
        ? 'bg-[#312E81] text-white shadow-sm'
        : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
    }`}
  >
    {tab.label}
  </button>
);

const StatCard = ({ icon: Icon, label, value, trend, trendLabel, color = 'neutral' }) => {
  const colorMap = {
    neutral: 'text-neutral-500',
    success: 'text-[#10B981]',
    danger: 'text-[#EF4444]',
    warning: 'text-[#F59E0B]',
    primary: 'text-[#312E81]',
    accent: 'text-[#E8835C]',
  };

  const bgMap = {
    neutral: 'bg-neutral-50',
    success: 'bg-green-50',
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
    primary: 'bg-[#EEF2FF]',
    accent: 'bg-orange-50',
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgMap[color]}`}>
          <Icon size={20} className={colorMap[color]} />
        </div>
        <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-neutral-900">{value}</p>
      {trend != null && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend > 0 ? (
            <ArrowUpRight size={14} className="text-[#10B981]" />
          ) : trend < 0 ? (
            <ArrowDownRight size={14} className="text-[#EF4444]" />
          ) : (
            <Minus size={14} className="text-neutral-400" />
          )}
          <span className={`text-xs font-medium ${trend > 0 ? 'text-[#10B981]' : trend < 0 ? 'text-[#EF4444]' : 'text-neutral-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && <span className="text-xs text-neutral-400 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
      <Icon size={28} className="text-neutral-400" />
    </div>
    <h3 className="text-lg font-semibold text-neutral-700 mb-1">{title}</h3>
    <p className="text-sm text-neutral-500 max-w-sm">{description}</p>
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
      <AlertCircle size={28} className="text-[#EF4444]" />
    </div>
    <h3 className="text-lg font-semibold text-neutral-700 mb-1">Failed to load report</h3>
    <p className="text-sm text-neutral-500 max-w-sm mb-4">{message || 'Something went wrong. Please try again.'}</p>
    {onRetry && (
      <button onClick={onRetry} className="px-4 py-2 bg-[#312E81] text-white text-sm font-medium rounded-lg hover:bg-[#1E1B4B]">
        Retry
      </button>
    )}
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <Loader2 size={32} className="text-[#312E81] animate-spin mb-3" />
    <p className="text-sm text-neutral-500">Loading report...</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-neutral-200 p-3 text-sm">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.stroke }} className="text-xs">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Email Report Modal ──────────────────────────────────────────────────────

const EmailModal = ({ isOpen, onClose, reportType, reportTitle, userEmail }) => {
  const [recipient, setRecipient] = useState(userEmail || '');
  const [format, setFormat] = useState('pdf');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const emailMutation = useMutation({
    mutationFn: (payload) => reportService.emailReport(payload),
    onSuccess: () => setSent(true),
  });

  React.useEffect(() => {
    if (isOpen) {
      setRecipient(userEmail || '');
      setFormat('pdf');
      setMessage('');
      setSent(false);
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleSend = () => {
    if (!recipient.trim()) return;
    emailMutation.mutate({ type: reportType, format, email: recipient, message });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="text-lg font-bold text-neutral-900">Email Report</h3>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {sent ? (
            /* Success state */
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-[#10B981]" />
              </div>
              <h4 className="text-lg font-bold text-neutral-900 mb-1">Report Sent!</h4>
              <p className="text-sm text-neutral-500">
                Report sent to <strong>{recipient}</strong>
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-[#312E81] text-white text-sm font-medium rounded-lg hover:bg-[#1E1B4B] transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form */
            <div className="p-6 space-y-4">
              {/* Recipient */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Recipient</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent"
                />
              </div>

              {/* Report type (info) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Report</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <FileText size={16} className="text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-700 capitalize">{reportType} — {reportTitle}</span>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${format === 'pdf' ? 'bg-[#312E81] text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                  Additional message <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Here's the report for this period..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#312E81] focus:border-transparent resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={!recipient.trim() || emailMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#312E81] rounded-lg hover:bg-[#1E1B4B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {emailMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Send Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Date Range Selector (shared) ────────────────────────────────────────────

const QUICK_SELECTS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

const DateRangeSelector = ({ startDate, endDate, onApply }) => {
  const [quick, setQuick] = useState('all');
  const [from, setFrom] = useState(startDate ? startDate.slice(0, 10) : '');
  const [to, setTo] = useState(endDate ? endDate.slice(0, 10) : '');

  const handleQuickSelect = (key) => {
    setQuick(key);
    const now = new Date();
    let s = '', e = '';
    switch (key) {
      case 'today':
        s = now.toISOString().slice(0, 10);
        e = s;
        break;
      case 'week': {
        const mon = new Date(now);
        mon.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        s = mon.toISOString().slice(0, 10);
        e = now.toISOString().slice(0, 10);
        break;
      }
      case 'month':
        s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        e = now.toISOString().slice(0, 10);
        break;
      case 'year':
        s = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        e = now.toISOString().slice(0, 10);
        break;
      default:
        s = ''; e = '';
    }
    setFrom(s);
    setTo(e);
    onApply(s, e);
  };

  const handleApply = () => {
    onApply(from, to);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
      {/* Quick selects */}
      <div className="flex gap-1 flex-wrap">
        {QUICK_SELECTS.map((qs) => (
          <button
            key={qs.key}
            onClick={() => handleQuickSelect(qs.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              quick === qs.key
                ? 'bg-[#312E81] text-white'
                : 'text-neutral-500 bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            {qs.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => { setQuick(''); setFrom(e.target.value); }}
          className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#312E81]"
        />
        <span className="text-neutral-400 text-sm">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setQuick(''); setTo(e.target.value); }}
          className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#312E81]"
        />
        <button
          onClick={handleApply}
          className="px-4 py-1.5 text-sm font-medium text-white bg-[#312E81] rounded-lg hover:bg-[#1E1B4B] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

// ─── Daily Report Tab ────────────────────────────────────────────────────────

const DailyTab = () => {
  const today = fmtDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const dateInputRef = useRef(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'daily', selectedDate],
    queryFn: () => reportService.getDailyReport(selectedDate),
    staleTime: 2 * 60 * 1000,
  });

  const report = data?.data;
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(fmtDate(d));
  };

  const goToNextDay = () => {
    if (isFuture) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (fmtDate(d) <= today) setSelectedDate(fmtDate(d));
  };

  const netProfit = report?.summary?.netProfit || 0;
  const trendPct = report?.salesTrend;
  const totalSalesCount = report?.summary?.totalSales || 0;
  const grossMarginRatio = report?.summary?.revenue > 0
    ? report.summary.grossProfit / report.summary.revenue : 0;

  // Pie chart data for payment methods
  const pieData = useMemo(() => {
    if (!report?.paymentBreakdown) return [];
    const colorMap = { cash: '#10B981', mpesa: '#3B82F6', card: '#F59E0B', credit: '#F59E0B' };
    return report.paymentBreakdown.map((p) => ({
      name: p.method.charAt(0).toUpperCase() + p.method.slice(1),
      value: p.total,
      count: p.count,
      color: colorMap[p.method] || '#94A3B8',
    }));
  }, [report]);

  return (
    <div className="space-y-6">
      {/* ── Date Navigation ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevDay}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="flex items-center gap-2"
          >
            <Calendar size={18} className="text-neutral-500" />
            <span className="text-base font-semibold text-neutral-900">
              {formatDateDisplay(selectedDate)}
            </span>
          </button>

          <button
            onClick={goToNextDay}
            disabled={isToday || isFuture}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              isToday || isFuture
                ? 'text-neutral-300 cursor-not-allowed'
                : 'hover:bg-neutral-100 text-neutral-500'
            }`}
          >
            <ChevronRight size={18} />
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="sr-only"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(today)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isToday
                ? 'bg-[#312E81] text-white'
                : 'bg-[#EEF2FF] text-[#312E81] hover:bg-[#DDD6FE]'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              setSelectedDate(fmtDate(d));
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedDate === fmtDate(new Date(new Date().setDate(new Date().getDate() - 1)))
                ? 'bg-[#312E81] text-white'
                : 'bg-[#EEF2FF] text-[#312E81] hover:bg-[#DDD6FE]'
            }`}
          >
            Yesterday
          </button>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {report && !isLoading && !isError && (
        <>
          {/* ── Hero Profit Card ─────────────────────────────── */}
          <div
            className="bg-white rounded-3xl p-6 sm:p-9 shadow-md border-l-[5px] text-center"
            style={{ borderLeftColor: netProfit > 0 ? '#E8835C' : netProfit < 0 ? '#EF4444' : '#E5E7EB' }}
          >
            <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wider">
              Today's Net Profit
            </p>

            <p
              className={`text-[36px] sm:text-[48px] font-bold mt-1 ${
                netProfit > 0
                  ? 'text-[#E8835C]'
                  : netProfit < 0
                  ? 'text-[#EF4444]'
                  : 'text-neutral-900'
              }`}
            >
              {netProfit < 0 ? `−${formatCurrency(Math.abs(netProfit))}` : formatCurrency(netProfit)}
            </p>

            {trendPct != null && (
              <div className="flex justify-center mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                    trendPct > 0
                      ? 'bg-green-50 text-[#10B981]'
                      : trendPct < 0
                      ? 'bg-red-50 text-[#EF4444]'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {trendPct > 0 ? <TrendingUp size={14} /> : trendPct < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                  {trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : ''}{Math.abs(trendPct)}% vs yesterday
                </span>
              </div>
            )}

            {/* Divider */}
            <hr className="my-6 border-neutral-200" />

            {/* 3-column breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Sales</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-900 mt-1">
                  +{formatCurrency(report.summary.revenue)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Cost</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-500 mt-1">
                  −{formatCurrency(report.summary.costOfGoods)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Expenses</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-500 mt-1">
                  −{formatCurrency(report.summary.expenses)}
                </p>
              </div>
            </div>
          </div>

          {/* ── Two Column Layout: Pie + Expenses ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Breakdown Pie Chart */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4">Sales Breakdown</h3>

              {pieData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <div className="relative" style={{ width: 220, height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          strokeWidth={0}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </RPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-neutral-900">{totalSalesCount}</span>
                      <span className="text-xs text-neutral-500">{totalSalesCount === 1 ? 'sale' : 'sales'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 flex-wrap justify-center">
                    {pieData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm text-neutral-600">{entry.name}</span>
                        <span className="text-sm font-medium text-neutral-900">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState icon={PieChart} title="No sales today" description="Payment breakdown will appear here once sales are recorded." />
              )}
            </div>

            {/* Today's Expenses */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
              <h3 className="text-base font-semibold text-neutral-900 mb-4">Today's Expenses</h3>

              {report.expenseBreakdown?.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {report.expenseBreakdown.map((e, i) => {
                      const IconComp = EXPENSE_ICONS[e._id] || Circle;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <IconComp size={16} className="text-neutral-500" />
                            </div>
                            <span className="text-sm font-medium text-neutral-700 capitalize">{e._id}</span>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900">
                            {formatCurrency(e.total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-700">Total</span>
                    <span className="text-base font-bold text-neutral-900">
                      {formatCurrency(report.summary.expenses)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3">
                    <Receipt size={24} className="text-neutral-400" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-700 mb-1">No expenses recorded today</h3>
                  <a href="/dashboard/settings" className="inline-flex items-center gap-1 text-sm font-medium text-[#312E81] hover:text-[#1E1B4B] mt-1">
                    Add Expense <Plus size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ── Top Selling Products Table ───────────────────── */}
          {report.topProducts?.length > 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-4 sm:p-6 pb-3">
                <h3 className="text-base font-semibold text-neutral-900">Top Selling Products Today</h3>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-neutral-200 bg-neutral-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">#</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sold</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Profit</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, i) => {
                      const estProfit = Math.round(p.revenue * grossMarginRatio);
                      const margin = p.revenue > 0 ? Math.round((estProfit / p.revenue) * 100) : 0;
                      const rankColor = i === 0 ? 'text-[#E8835C]' : i === 1 ? 'text-neutral-400' : 'text-neutral-300';
                      const marginBadge = margin >= 30
                        ? 'bg-green-50 text-[#10B981]'
                        : margin >= 15
                        ? 'bg-amber-50 text-[#F59E0B]'
                        : 'bg-red-50 text-[#EF4444]';
                      return (
                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-3.5">
                            <span className={`text-sm font-bold ${rankColor}`}>#{i + 1}</span>
                          </td>
                          <td className="px-6 py-3.5 text-sm font-medium text-neutral-900">{p.name}</td>
                          <td className="px-6 py-3.5 text-sm text-right text-neutral-900">{p.quantity}</td>
                          <td className="px-6 py-3.5 text-sm text-right text-neutral-900 font-medium">{formatCurrency(p.revenue)}</td>
                          <td className={`px-6 py-3.5 text-sm text-right font-semibold ${estProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {formatCurrency(estProfit)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${marginBadge}`}>
                              {margin}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden px-4 pb-4 space-y-2">
                {report.topProducts.map((p, i) => {
                  const estProfit = Math.round(p.revenue * grossMarginRatio);
                  const margin = p.revenue > 0 ? Math.round((estProfit / p.revenue) * 100) : 0;
                  const marginBadge = margin >= 30
                    ? 'bg-green-50 text-[#10B981]'
                    : margin >= 15
                    ? 'bg-amber-50 text-[#F59E0B]'
                    : 'bg-red-50 text-[#EF4444]';
                  return (
                    <div key={i} className="rounded-lg p-4 border border-neutral-100 bg-neutral-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${i === 0 ? 'text-[#E8835C]' : 'text-neutral-400'}`}>#{i + 1}</span>
                          <span className="text-sm font-semibold text-neutral-900">{p.name}</span>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${marginBadge}`}>
                          {margin}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-neutral-500">Sold</p>
                          <p className="font-medium text-neutral-900">{p.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Revenue</p>
                          <p className="font-medium text-neutral-900">{formatCurrency(p.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Profit</p>
                          <p className={`font-medium ${estProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{formatCurrency(estProfit)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {report.topProducts?.length === 0 && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
              <EmptyState icon={Package} title="No products sold today" description="Product sales will appear here once transactions are recorded." />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Weekly Report Tab ───────────────────────────────────────────────────────

const WeeklyTab = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'weekly', toDateStr(start), toDateStr(end)],
    queryFn: () => reportService.getWeeklyReport(toDateStr(start), toDateStr(end)),
    staleTime: 5 * 60 * 1000,
  });

  const report = data?.data;
  const hasData = report && report.summary.totalSales > 0;
  const isCurrentWeek = weekOffset === 0;
  const isFutureWeek = weekOffset > 0;

  // Format week display
  const weekLabel = useMemo(() => {
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} — ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }, [start, end]);

  // Compute derived data
  const bestDay = useMemo(() => {
    if (!report?.dailyBreakdown?.length) return null;
    const daysWithSales = report.dailyBreakdown.filter((d) => d.revenue > 0);
    if (!daysWithSales.length) return null;
    return daysWithSales.reduce((best, d) => (d.revenue > best.revenue ? d : best), daysWithSales[0]);
  }, [report]);

  const avgDailySales = useMemo(() => {
    if (!report?.dailyBreakdown?.length) return 0;
    const daysWithSales = report.dailyBreakdown.filter((d) => d.revenue > 0);
    return daysWithSales.length > 0
      ? Math.round(report.summary.revenue / daysWithSales.length)
      : 0;
  }, [report]);

  // Chart data
  const chartData = useMemo(() => {
    if (!report?.dailyBreakdown) return [];
    return report.dailyBreakdown.map((d) => ({
      day: d.day,
      Sales: d.revenue,
      Profit: d.profit,
    }));
  }, [report]);

  return (
    <div className="space-y-6">
      {/* ── Week Selector ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-base font-semibold text-neutral-900 min-w-[200px] text-center">
          {weekLabel}
        </span>

        <button
          onClick={() => { if (!isCurrentWeek && !isFutureWeek) setWeekOffset((o) => o + 1); }}
          disabled={isCurrentWeek || isFutureWeek}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
            isCurrentWeek || isFutureWeek
              ? 'text-neutral-300 cursor-not-allowed'
              : 'hover:bg-neutral-100 text-neutral-500'
          }`}
        >
          <ChevronRight size={18} />
        </button>

        {!isCurrentWeek && (
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 text-xs font-semibold bg-[#EEF2FF] text-[#312E81] rounded-lg hover:bg-[#DDD6FE] transition-colors"
          >
            This Week
          </button>
        )}
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {report && !isLoading && !isError && (
        <>
          {/* ── Summary Cards (4 cards) ─────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Sales */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Total Sales</p>
              <p className="text-2xl sm:text-[28px] font-bold text-neutral-900 mt-1">
                {formatCurrency(report.summary.revenue)}
              </p>
              {report.trend?.revenueChange != null && (
                <div className="flex items-center gap-1 mt-1.5">
                  <ArrowUpRight size={14} className="text-[#10B981]" />
                  <span className="text-xs font-medium text-[#10B981]">
                    ↑{report.trend.revenueChange}% vs last week
                  </span>
                </div>
              )}
            </div>

            {/* Total Profit */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Total Profit</p>
              <p className="text-2xl sm:text-[28px] font-bold text-[#E8835C] mt-1">
                {formatCurrency(report.summary.netProfit)}
              </p>
              {report.summary.revenue > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <TrendingUp size={14} className="text-[#10B981]" />
                  <span className="text-xs font-medium text-[#10B981]">
                    {Math.round((report.summary.netProfit / report.summary.revenue) * 100)}% margin
                  </span>
                </div>
              )}
            </div>

            {/* Avg Daily Sales */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Avg Daily Sales</p>
              <p className="text-2xl sm:text-[28px] font-bold text-neutral-900 mt-1">
                {formatCurrency(avgDailySales)}
              </p>
              <p className="text-xs text-neutral-400 mt-1.5">
                Over {report.dailyBreakdown?.filter((d) => d.revenue > 0).length || 0} active days
              </p>
            </div>

            {/* Best Day */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">Best Day</p>
              {bestDay ? (
                <>
                  <p className="text-xl sm:text-[22px] font-bold text-neutral-900 mt-1">{bestDay.day}</p>
                  <p className="text-sm font-semibold text-[#312E81] mt-1">
                    {formatCurrency(bestDay.revenue)}
                  </p>
                </>
              ) : (
                <p className="text-xl sm:text-[22px] font-bold text-neutral-400 mt-1">—</p>
              )}
            </div>
          </div>

          {!hasData ? (
            <EmptyState icon={BarChart3} title="No sales this week" description="Sales recorded this week will appear here with a day-by-day breakdown." />
          ) : (
            <>
              {/* ── Weekly Chart (Combo Bar + Line) ──────────────────── */}
              {chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">Sales & Profit This Week</h3>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-[#312E81]" />
                      <span className="text-xs text-neutral-500">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 rounded-full bg-[#E8835C]" style={{ width: 16 }} />
                      <span className="text-xs text-neutral-500">Profit</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Sales" fill="#312E81" radius={[4, 4, 0, 0]} barSize={32} />
                      <Line type="monotone" dataKey="Profit" stroke="#E8835C" strokeWidth={2.5} dot={{ r: 4, fill: '#E8835C', strokeWidth: 0 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Daily Breakdown Table ────────────────────────────── */}
              {report.dailyBreakdown?.length > 0 && (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  <div className="p-4 sm:p-6 pb-3">
                    <h3 className="text-base font-semibold text-neutral-900">Daily Breakdown</h3>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-y border-neutral-200 bg-neutral-50">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Day</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Sales</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Cost</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Expenses</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Profit</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Margin %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.dailyBreakdown.map((d, i) => {
                          const isBest = bestDay && d.date === bestDay.date;
                          return (
                            <tr
                              key={i}
                              className={`border-b border-neutral-100 transition-colors ${
                                isBest ? 'bg-[#EEF2FF]' : 'hover:bg-neutral-50'
                              }`}
                            >
                              <td className="px-6 py-3.5 text-sm font-medium text-neutral-900">
                                {d.day}
                                {isBest && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#312E81] text-white">
                                    BEST
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-3.5 text-sm text-right text-neutral-900">{formatCurrency(d.revenue)}</td>
                              <td className="px-6 py-3.5 text-sm text-right text-neutral-500">{formatCurrency(d.cost)}</td>
                              <td className="px-6 py-3.5 text-sm text-right text-neutral-500">{formatCurrency(d.expenses)}</td>
                              <td className={`px-6 py-3.5 text-sm text-right font-semibold ${d.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                                {d.profit < 0 ? `−${formatCurrency(Math.abs(d.profit))}` : formatCurrency(d.profit)}
                              </td>
                              <td className="px-6 py-3.5 text-sm text-right">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  d.margin >= 30 ? 'bg-green-50 text-[#10B981]' :
                                  d.margin >= 10 ? 'bg-amber-50 text-[#F59E0B]' :
                                  d.revenue > 0 ? 'bg-red-50 text-[#EF4444]' :
                                  'bg-neutral-100 text-neutral-400'
                                }`}>
                                  {d.revenue > 0 ? `${d.margin}%` : '—'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {/* Totals row */}
                      <tfoot>
                        <tr className="bg-neutral-50 font-semibold">
                          <td className="px-6 py-3.5 text-sm text-neutral-900">Total</td>
                          <td className="px-6 py-3.5 text-sm text-right text-neutral-900">{formatCurrency(report.summary.revenue)}</td>
                          <td className="px-6 py-3.5 text-sm text-right text-neutral-500">{formatCurrency(report.summary.costOfGoods)}</td>
                          <td className="px-6 py-3.5 text-sm text-right text-neutral-500">{formatCurrency(report.summary.expenses)}</td>
                          <td className={`px-6 py-3.5 text-sm text-right ${report.summary.netProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {report.summary.netProfit < 0 ? `−${formatCurrency(Math.abs(report.summary.netProfit))}` : formatCurrency(report.summary.netProfit)}
                          </td>
                          <td className="px-6 py-3.5 text-sm text-right">
                            {report.summary.revenue > 0
                              ? `${Math.round((report.summary.netProfit / report.summary.revenue) * 100)}%`
                              : '—'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden px-4 pb-4 space-y-2">
                    {report.dailyBreakdown.map((d, i) => {
                      const isBest = bestDay && d.date === bestDay.date;
                      return (
                        <div
                          key={i}
                          className={`rounded-lg p-4 border ${isBest ? 'border-[#312E81] bg-[#EEF2FF]' : 'border-neutral-100 bg-neutral-50'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-neutral-900">{d.day}</span>
                            {isBest && (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#312E81] text-white">
                                BEST
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <span className="text-neutral-500">Sales</span>
                            <span className="text-right font-medium text-neutral-900">{formatCurrency(d.revenue)}</span>
                            <span className="text-neutral-500">Cost</span>
                            <span className="text-right text-neutral-500">{formatCurrency(d.cost)}</span>
                            <span className="text-neutral-500">Expenses</span>
                            <span className="text-right text-neutral-500">{formatCurrency(d.expenses)}</span>
                            <span className="text-neutral-500">Profit</span>
                            <span className={`text-right font-semibold ${d.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {d.profit < 0 ? `−${formatCurrency(Math.abs(d.profit))}` : formatCurrency(d.profit)}
                            </span>
                            <span className="text-neutral-500">Margin</span>
                            <span className={`text-right font-medium ${d.margin >= 30 ? 'text-[#10B981]' : d.revenue > 0 ? 'text-[#F59E0B]' : 'text-neutral-400'}`}>
                              {d.revenue > 0 ? `${d.margin}%` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── Monthly Report Tab ──────────────────────────────────────────────────────

const MonthlyTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'monthly', selectedYear, selectedMonth],
    queryFn: () => reportService.getMonthlyReport(selectedMonth, selectedYear),
    staleTime: 5 * 60 * 1000,
  });

  const report = data?.data;
  const s = report?.summary;

  const now = new Date();
  const isFutureMonth = selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth > now.getMonth() + 1);

  const goToPrevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else { setSelectedMonth((m) => m - 1); }
  };

  const goToNextMonth = () => {
    if (isFutureMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else { setSelectedMonth((m) => m + 1); }
  };

  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = `${fullMonths[selectedMonth - 1]} ${selectedYear}`;

  const hasData = s && s.totalSales > 0;
  const totalRevenue = (s?.revenue || 0) + (s?.otherIncome || 0);
  const grossMargin = s && s.revenue > 0 ? Math.round((s.grossProfit / s.revenue) * 100) : 0;
  const netMargin = s && s.revenue > 0 ? Math.round((s.netProfit / s.revenue) * 100) : 0;

  const prevMonthName = selectedMonth === 1 ? fullMonths[11] : fullMonths[selectedMonth - 2];

  // ── Weekly chart data
  const weeklyChartData = useMemo(() => {
    if (!report?.weeklyBreakdown) return [];
    return report.weeklyBreakdown.map((w, i) => ({
      name: `Week ${i + 1}`,
      Sales: w.revenue,
      Profit: w.profit,
    }));
  }, [report]);

  // ── Expense rows for P&L statement
  const expenseRows = hasData && report?.expenseBreakdown
    ? report.expenseBreakdown.map((e) => ({
        label: e.category.charAt(0).toUpperCase() + e.category.slice(1),
        value: -(e.total),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-neutral-900 text-center select-none">{monthLabel}</h2>
        <button
          onClick={goToNextMonth}
          disabled={isFutureMonth}
          className={`p-2 rounded-lg transition-colors ${isFutureMonth ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'}`}
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#312E81] bg-[#EEF2FF] rounded-lg hover:bg-[#DDD6FE] transition-colors"
          >
            <Calendar size={15} />
            <span className="hidden sm:inline">Pick Month</span>
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl border border-neutral-200 shadow-xl p-4 w-[260px]">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setSelectedYear((y) => y - 1)} className="p-1 hover:bg-neutral-100 rounded text-neutral-500">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-neutral-900">{selectedYear}</span>
                  <button onClick={() => setSelectedYear((y) => y + 1)} className="p-1 hover:bg-neutral-100 rounded text-neutral-500">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {shortMonths.map((m, i) => {
                    const monthNum = i + 1;
                    const isFuture = selectedYear > now.getFullYear() || (selectedYear === now.getFullYear() && monthNum > now.getMonth() + 1);
                    const isActive = monthNum === selectedMonth && selectedYear === selectedYear;
                    return (
                      <button
                        key={m}
                        disabled={isFuture}
                        onClick={() => { setSelectedMonth(monthNum); setShowPicker(false); }}
                        className={`py-2 text-xs font-medium rounded-lg transition-colors ${
                          monthNum === selectedMonth
                            ? 'bg-[#312E81] text-white'
                            : isFuture
                            ? 'text-neutral-300 cursor-not-allowed'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {report && !isLoading && !isError && (
        <>
          {/* ── P&L Statement Card ──────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-md p-9">
            <h3 className="text-xl font-bold text-center text-neutral-900 mb-8" style={{ fontSize: '20px' }}>
              Profit & Loss Statement — {monthLabel}
            </h3>

            <div className="max-w-[640px] mx-auto" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
              {/* REVENUE */}
              <div className="mb-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Revenue</div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-neutral-600">Sales Revenue</span>
                  <span className="text-sm font-medium text-neutral-900 tabular-nums">{formatCurrency(s?.revenue)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-neutral-600">Other Income</span>
                  <span className="text-sm font-medium text-neutral-900 tabular-nums">{formatCurrency(s?.otherIncome || 0)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-t border-neutral-200">
                  <span className="text-sm font-bold text-neutral-800">TOTAL REVENUE</span>
                  <span className="text-sm font-bold text-neutral-900 tabular-nums">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              <div className="my-6" />

              {/* COST OF GOODS SOLD */}
              <div className="mb-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Cost of Goods Sold</div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-neutral-600">Opening Stock</span>
                  <span className="text-sm font-medium text-neutral-900 tabular-nums">{formatCurrency(report.stockData?.openingStock || 0)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-neutral-600">Purchases</span>
                  <span className="text-sm font-medium text-neutral-900 tabular-nums">{formatCurrency(report.stockData?.purchases || 0)}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-sm text-neutral-600">Closing Stock</span>
                  <span className="text-sm font-medium text-neutral-500 tabular-nums">−{formatCurrency(report.stockData?.closingStock || 0)}</span>
                </div>
                <div className="flex justify-between py-2.5 border-t border-neutral-200">
                  <span className="text-sm font-bold text-neutral-500">COST OF GOODS SOLD</span>
                  <span className="text-sm font-bold text-neutral-500 tabular-nums">−{formatCurrency(s?.costOfGoods)}</span>
                </div>
              </div>

              <div className="my-6" />

              {/* GROSS PROFIT */}
              <div className="flex justify-between items-center py-3 border-t border-neutral-200">
                <span className="text-base font-bold text-neutral-900">GROSS PROFIT</span>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-neutral-900 tabular-nums">{formatCurrency(s?.grossProfit)}</span>
                  <span className="text-xs text-neutral-500 tabular-nums">Gross Margin: {grossMargin}%</span>
                </div>
              </div>

              <div className="my-6" />

              {/* EXPENSES */}
              <div className="mb-2">
                <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-3">Expenses</div>
                {hasData && expenseRows.length > 0 ? (
                  <>
                    {expenseRows.map((row, i) => (
                      <div key={i} className="flex justify-between py-2.5">
                        <span className="text-sm text-neutral-600">{row.label}</span>
                        <span className="text-sm font-medium text-neutral-500 tabular-nums">{formatCurrency(row.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2.5 border-t border-neutral-200">
                      <span className="text-sm font-bold text-neutral-500">TOTAL EXPENSES</span>
                      <span className="text-sm font-bold text-neutral-500 tabular-nums">−{formatCurrency(s?.expenses)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-neutral-400">No expenses recorded</p>
                  </div>
                )}
              </div>

              <div className="my-6" />

              {/* NET PROFIT */}
              <div className="border-t-2 border-neutral-900 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-neutral-900">NET PROFIT</span>
                  <span className={`text-2xl font-bold tabular-nums ${(s?.netProfit || 0) >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {formatCurrency(s?.netProfit)}
                  </span>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-sm text-neutral-500 tabular-nums">Net Margin: {netMargin}%</span>
                </div>
              </div>

              {/* MONTH-OVER-MONTH */}
              {report.comparison?.revenueChange != null && (
                <div className="border-t border-neutral-200 mt-5 pt-4 flex items-center gap-2">
                  {report.comparison.revenueChange > 0 ? (
                    <>
                      <TrendingUp size={16} className="text-[#10B981]" />
                      <span className="text-xs text-[#10B981] font-semibold">
                        vs {prevMonthName} {selectedYear}: ↑{report.comparison.revenueChange}% increase
                      </span>
                    </>
                  ) : report.comparison.revenueChange < 0 ? (
                    <>
                      <TrendingDown size={16} className="text-[#EF4444]" />
                      <span className="text-xs text-[#EF4444] font-semibold">
                        vs {prevMonthName} {selectedYear}: ↓{Math.abs(report.comparison.revenueChange)}% decrease
                      </span>
                    </>
                  ) : (
                    <>
                      <Minus size={16} className="text-neutral-400" />
                      <span className="text-xs text-neutral-500">No change vs previous month</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!hasData ? (
            <EmptyState icon={BarChart3} title="No sales this month" description="Sales recorded this month will appear here with a full P&L breakdown." />
          ) : (
            /* Weekly Breakdown Chart */
            <div className="bg-white rounded-3xl shadow-md p-9">
              <h3 className="text-base font-semibold text-neutral-900 mb-6">
                Weekly Breakdown — {monthLabel}
              </h3>
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Sales" fill="#312E81" radius={[4, 4, 0, 0]} barSize={36} />
                    <Bar dataKey="Profit" fill="#E8835C" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 size={40} className="text-neutral-200 mb-3" />
                  <p className="text-sm text-neutral-400">No weekly data available</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Product Performance Tab ─────────────────────────────────────────────────

const ProductPerformanceTab = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [sortBy, setSortBy] = useState('profit');
  const [productDetail, setProductDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'products', dateRange.startDate, dateRange.endDate, sortBy],
    queryFn: () => reportService.getProductsReport({ startDate: dateRange.startDate, endDate: dateRange.endDate, sort: sortBy }),
    staleTime: 5 * 60 * 1000,
  });

  const report = data?.data;

  const handleDateApply = (start, end) => {
    setDateRange({ startDate: start || '', endDate: end || '' });
  };

  const openProductDetail = async (product) => {
    setShowDetails(true);
    setLoadingDetail(true);
    try {
      const res = await reportService.getSingleProductReport(product._id);
      setProductDetail(res.data);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const sortedProducts = useMemo(() => {
    if (!report?.products) return [];
    const list = [...report.products];
    if (sortBy === 'revenue') return list.sort((a, b) => b.revenue - a.revenue);
    if (sortBy === 'profit') return list.sort((a, b) => b.profit - a.profit);
    if (sortBy === 'units') return list.sort((a, b) => b.unitsSold - a.unitsSold);
    if (sortBy === 'margin') return list.sort((a, b) => b.margin - a.margin);
    return list;
  }, [report, sortBy]);

  const marginEmoji = (m) => m >= 30 ? '🟢' : m >= 10 ? '🟡' : '🔴';
  const stockEmoji = (s) => s === 'In Stock' ? '🟢' : s === 'Low Stock' ? '🟠' : '🔴';

  return (
    <div className="space-y-6">
      <DateRangeSelector startDate={dateRange.startDate} endDate={dateRange.endDate} onApply={handleDateApply} />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {report && !isLoading && !isError && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                  <Package size={16} className="text-[#312E81]" />
                </div>
              </div>
              <p className="text-[13px] text-neutral-500">Total Products</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{report.totalProducts}</p>
              <p className="text-xs text-neutral-400 mt-0.5">In inventory</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                  <ShoppingCart size={16} className="text-[#312E81]" />
                </div>
              </div>
              <p className="text-[13px] text-neutral-500">Products Sold</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{report.soldCount} <span className="text-base font-normal text-neutral-400">of {report.totalProducts}</span></p>
              <p className="text-xs text-neutral-400 mt-0.5">{report.soldPercentage}% sold</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award size={16} className="text-[#E8835C]" />
                </div>
              </div>
              <p className="text-[13px] text-neutral-500">Top Product</p>
              <p className="text-base font-bold text-neutral-900 mt-1 truncate">{report.topProduct?.name || '—'}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{report.topProduct ? formatCurrency(report.topProduct.revenue) : 'No sales yet'}</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#10B981]" />
                </div>
              </div>
              <p className="text-[13px] text-neutral-500">Top Profit Maker</p>
              <p className="text-base font-bold text-neutral-900 mt-1 truncate">{report.topProfitMaker?.name || '—'}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{report.topProfitMaker ? formatCurrency(report.topProfitMaker.profit) + ' profit' : 'No sales yet'}</p>
            </div>
          </div>

          {report.products?.length === 0 ? (
            <EmptyState icon={Package} title="No product sales data yet" description="Record sales to see which products perform best →" />
          ) : (
            <>
              {/* Product Table */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-semibold text-neutral-900">All Products</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#312E81]"
                    >
                      <option value="profit">Highest Profit</option>
                      <option value="revenue">Highest Revenue</option>
                      <option value="units">Most Sold</option>
                      <option value="margin">Best Margin</option>
                    </select>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                        <th className="px-6 py-3 w-10">#</th>
                        <th className="px-6 py-3">Product</th>
                        <th className="px-6 py-3 text-right">Sold</th>
                        <th className="px-6 py-3 text-right">Revenue</th>
                        <th className="px-6 py-3 text-right">Cost</th>
                        <th className="px-6 py-3 text-right">Profit</th>
                        <th className="px-6 py-3 text-right">Margin</th>
                        <th className="px-6 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {sortedProducts.map((p, i) => (
                        <tr key={p._id} className="hover:bg-[#EEF2FF]/20 cursor-pointer transition-colors" onClick={() => openProductDetail(p)}>
                          <td className="px-6 py-3.5 text-xs text-neutral-400">{i + 1}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-neutral-400" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-neutral-900 truncate max-w-[180px]">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-right text-sm font-medium text-neutral-900">{p.unitsSold}</td>
                          <td className="px-6 py-3.5 text-right text-sm text-neutral-900">{formatCurrency(p.revenue)}</td>
                          <td className="px-6 py-3.5 text-right text-sm text-neutral-400">{formatCurrency(p.cost)}</td>
                          <td className={`px-6 py-3.5 text-right text-sm font-semibold ${p.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{formatCurrency(p.profit)}</td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm tabular-nums">{marginEmoji(p.margin)} {p.margin}%</span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm">{stockEmoji(p.stockStatus)} {p.stockStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-neutral-100 px-4 pb-4">
                  {sortedProducts.map((p, i) => (
                    <div key={p._id} className="py-3" onClick={() => openProductDetail(p)}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-neutral-400 w-5">{i + 1}</span>
                          <span className="text-sm font-medium text-neutral-900 truncate">{p.name}</span>
                        </div>
                        <span className="text-xs flex-shrink-0 ml-2">{stockEmoji(p.stockStatus)} {p.stockStatus}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm ml-7">
                        <span className="text-neutral-500">{p.unitsSold} sold</span>
                        <span className="font-semibold text-[#10B981]">{formatCurrency(p.profit)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slow Movers - At Bottom */}
              {report.slowMovers?.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-200 p-5 sm:p-6">
                  <h3 className="text-base font-semibold text-amber-600 mb-4 flex items-center gap-2">
                    <AlertCircle size={18} /> Slow Movers — No Sales in 30 Days
                  </h3>
                  <div className="space-y-2">
                    {report.slowMovers.map((p) => {
                      const daysAgo = p.lastSoldDate
                        ? Math.floor((new Date() - new Date(p.lastSoldDate)) / (1000 * 60 * 60 * 24))
                        : 30;
                      return (
                        <div key={p._id} className="flex items-center gap-3 text-sm text-neutral-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="flex-1">
                            <strong className="text-neutral-800">{p.name}</strong>
                            <span className="text-neutral-400"> ({p.stock} in stock)</span>
                            <span className="text-neutral-400"> — Last sold {daysAgo} days ago</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Product Detail Slide-Out Panel */}
      {showDetails && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDetails(false)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full"><Loader2 size={32} className="text-[#312E81] animate-spin" /></div>
            ) : productDetail ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">{productDetail.product.name}</h3>
                  <button onClick={() => setShowDetails(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                    <X size={20} />
                  </button>
                </div>

                {/* Product image */}
                {productDetail.product.image && (
                  <img src={productDetail.product.image} alt={productDetail.product.name} className="w-full h-48 object-cover rounded-xl mb-4" />
                )}

                {/* Period stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Units Sold</p>
                    <p className="text-xl font-bold text-neutral-900">{productDetail.summary.unitsSold}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Revenue</p>
                    <p className="text-xl font-bold text-[#10B981]">{formatCurrency(productDetail.summary.revenue)}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Total Profit</p>
                    <p className="text-xl font-bold text-[#10B981]">{formatCurrency(productDetail.summary.profit)}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Avg Margin</p>
                    <p className="text-xl font-bold text-neutral-900">{productDetail.summary.avgMargin}%</p>
                  </div>
                </div>

                {/* Sales trend */}
                {productDetail.trend?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Sales Trend (30 days)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={productDetail.trend.map((d) => ({ ...d, label: d.date.slice(5) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#312E81" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Sales history */}
                {productDetail.salesHistory?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Last 20 Sales</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {productDetail.salesHistory.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 text-xs">
                          <span className="text-neutral-500">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>Qty: {s.quantity}</span>
                          <span className="font-medium">{formatCurrency(s.total)}</span>
                          <span className={`font-medium ${s.profit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{formatCurrency(s.profit)}</span>
                          <span className="text-neutral-400">{s.soldBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={`/inventory`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-[#312E81] bg-[#EEF2FF] rounded-lg hover:bg-[#DDD6FE] transition-colors"
                >
                  View in Inventory <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <AlertCircle size={32} className="text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">Failed to load product details</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Worker Performance Tab ──────────────────────────────────────────────────

const WorkerPerformanceTab = () => {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [workerDetail, setWorkerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'workers', dateRange.startDate, dateRange.endDate],
    queryFn: () => reportService.getWorkersReport({ startDate: dateRange.startDate, endDate: dateRange.endDate }),
    staleTime: 5 * 60 * 1000,
  });

  const report = data?.data;

  const handleDateApply = (start, end) => {
    setDateRange({ startDate: start || '', endDate: end || '' });
  };

  const openWorkerDetail = async (worker) => {
    setShowDetails(true);
    setLoadingDetail(true);
    try {
      const res = await reportService.getSingleWorkerReport(worker._id);
      setWorkerDetail(res.data);
    } catch (err) {
      console.error('Failed to load worker detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const podiumWorkers = (report?.workers || []).filter((w) => w.salesCount > 0).slice(0, 3);

  return (
    <div className="space-y-6">
      <DateRangeSelector startDate={dateRange.startDate} endDate={dateRange.endDate} onApply={handleDateApply} />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {report && !isLoading && !isError && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-2">
                <Users size={16} className="text-[#312E81]" />
              </div>
              <p className="text-[13px] text-neutral-500">Total Workers</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{report.totalWorkers}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Active this period</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center mb-2">
                <ShoppingCart size={16} className="text-[#312E81]" />
              </div>
              <p className="text-[13px] text-neutral-500">Total Sales</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{report.totalSales}</p>
              <p className="text-xs text-neutral-400 mt-0.5">This period</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                <Award size={16} className="text-[#E8835C]" />
              </div>
              <p className="text-[13px] text-neutral-500">Top Performer</p>
              <p className="text-base font-bold text-neutral-900 mt-1 truncate">{report.topPerformer?.name || '—'}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{report.topPerformer ? `${report.topPerformer.salesCount} sales · ${formatCurrency(report.topPerformer.totalValue)}` : 'No sales yet'}</p>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-2">
                <DollarSign size={16} className="text-[#10B981]" />
              </div>
              <p className="text-[13px] text-neutral-500">Avg Sale Value</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{formatCurrency(report.avgSaleValue)}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Per transaction</p>
            </div>
          </div>

          {report.totalSales === 0 ? (
            /* No Sales Yet Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
                <BarChart3 size={32} className="text-neutral-300" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700 mb-1">No reports yet</h3>
              <p className="text-sm text-neutral-500 max-w-sm mb-6">Record your first sale to see reports →</p>
              <button
                onClick={() => navigate('/sales')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#312E81] text-white text-sm font-medium rounded-lg hover:bg-[#1E1B4B] transition-colors"
              >
                <DollarSign size={16} />
                Record a Sale
              </button>
            </div>
          ) : report.workers?.length === 0 ? (
            <EmptyState icon={Users} title="No worker data yet" description="Add workers and record sales to see performance →" />
          ) : (
            <>
              {/* Podium / Leaderboard — Card-based */}
              {podiumWorkers.length > 0 && (
                <div className="space-y-4">
                  {/* 1st Place — Gold, centered */}
                  {podiumWorkers[0] && (
                    <div className="bg-[#FDF2EC] rounded-2xl border border-[#E8835C]/20 p-6 text-center max-w-md mx-auto">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 ring-4 ring-[#E8835C]/10">
                        <Star size={28} className="text-[#E8835C]" />
                      </div>
                      <p className="text-lg font-bold text-neutral-900">
                        🥇 {podiumWorkers[0].name}
                      </p>
                      <p className="text-sm text-neutral-600 mt-1">
                        {podiumWorkers[0].salesCount} sales — {formatCurrency(podiumWorkers[0].totalValue)}
                      </p>
                    </div>
                  )}

                  {/* 2nd & 3rd — side by side on desktop, stacked on mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 2nd Place */}
                    {podiumWorkers[1] ? (
                      <div className="bg-white rounded-2xl border border-neutral-100 p-5 text-center">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                          <Medal size={22} className="text-neutral-400" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900">
                          🥈 {podiumWorkers[1].name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {podiumWorkers[1].salesCount} sales
                        </p>
                        <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                          {formatCurrency(podiumWorkers[1].totalValue)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-neutral-100 p-5 text-center opacity-40">
                        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                          <Medal size={22} className="text-neutral-300" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400">🥈 —</p>
                        <p className="text-xs text-neutral-400 mt-0.5">No data</p>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {podiumWorkers[2] ? (
                      <div className="bg-white rounded-2xl border border-neutral-100 p-5 text-center">
                        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-2">
                          <Medal size={22} className="text-amber-600" />
                        </div>
                        <p className="text-sm font-bold text-neutral-900">
                          🥉 {podiumWorkers[2].name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {podiumWorkers[2].salesCount} sales
                        </p>
                        <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                          {formatCurrency(podiumWorkers[2].totalValue)}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-neutral-100 p-5 text-center opacity-40">
                        <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-2">
                          <Medal size={22} className="text-neutral-300" />
                        </div>
                        <p className="text-sm font-bold text-neutral-400">🥉 —</p>
                        <p className="text-xs text-neutral-400 mt-0.5">No data</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Worker Table */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-neutral-100">
                  <h3 className="text-lg font-semibold text-neutral-900">All Workers</h3>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        <th className="px-6 py-3">Worker</th>
                        <th className="px-6 py-3 text-right">Sales</th>
                        <th className="px-6 py-3 text-right">Total Value</th>
                        <th className="px-6 py-3 text-right">Avg Sale</th>
                        <th className="px-6 py-3 text-right">Items Sold</th>
                        <th className="px-6 py-3 text-right">% of Shop</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {report.workers.map((w, i) => {
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                        return (
                          <tr key={w._id} className="hover:bg-[#EEF2FF]/20 cursor-pointer transition-colors" onClick={() => openWorkerDetail(w)}>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className="text-sm w-5">{medal || ''}</span>
                                <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                                  {w.avatar ? (
                                    <img src={w.avatar} alt={w.name} className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    <Users size={14} className="text-[#312E81]" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-neutral-900">{w.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-right text-sm font-semibold">{w.salesCount}</td>
                            <td className="px-6 py-3.5 text-right text-sm font-semibold text-[#312E81]">{formatCurrency(w.totalValue)}</td>
                            <td className="px-6 py-3.5 text-right text-sm text-neutral-500">{formatCurrency(w.avgSale)}</td>
                            <td className="px-6 py-3.5 text-right text-sm text-neutral-500">{w.totalItems}</td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#E8835C] rounded-full" style={{ width: `${Math.min(w.percentOfTotal, 100)}%` }} />
                                </div>
                                <span className="text-xs font-semibold text-neutral-500 tabular-nums">{w.percentOfTotal}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-neutral-100 px-4 pb-4">
                  {report.workers.map((w, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                    return (
                      <div key={w._id} className="py-3" onClick={() => openWorkerDetail(w)}>
                        <div className="flex items-center gap-3 mb-2">
                          {medal && <span className="text-sm">{medal}</span>}
                          <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center flex-shrink-0">
                            {w.avatar ? <img src={w.avatar} alt={w.name} className="w-full h-full rounded-full object-cover" /> : <Users size={14} className="text-[#312E81]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{w.name}</p>
                            <p className="text-xs text-neutral-500">{w.salesCount} sales</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm ml-11">
                          <span className="font-semibold text-[#312E81]">{formatCurrency(w.totalValue)}</span>
                          <span className="text-neutral-400">Avg: {formatCurrency(w.avgSale)}</span>
                        </div>
                        <div className="mt-2 ml-11 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#E8835C] rounded-full" style={{ width: `${Math.min(w.percentOfTotal, 100)}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-neutral-500">{w.percentOfTotal}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Worker Detail Slide-Out Panel */}
      {showDetails && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowDetails(false)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-full"><Loader2 size={32} className="text-[#312E81] animate-spin" /></div>
            ) : workerDetail ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                      <Users size={24} className="text-[#312E81]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">{workerDetail.worker.name}</h3>
                      <p className="text-xs text-neutral-500 capitalize">{workerDetail.worker.role}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetails(false)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100">
                    <X size={20} />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Total Sales</p>
                    <p className="text-xl font-bold text-neutral-900">{workerDetail.summary.salesCount}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Total Value</p>
                    <p className="text-xl font-bold text-[#312E81]">{formatCurrency(workerDetail.summary.totalValue)}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Items Sold</p>
                    <p className="text-xl font-bold text-neutral-900">{workerDetail.summary.totalItems}</p>
                  </div>
                  <div className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500">Avg Sale</p>
                    <p className="text-xl font-bold text-neutral-900">{formatCurrency(workerDetail.summary.avgSale)}</p>
                  </div>
                </div>

                {/* Sales trend */}
                {workerDetail.trend?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">30-Day Sales Trend</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={workerDetail.trend.map((d) => ({ ...d, label: d.date.slice(5) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="salesCount" name="Sales" stroke="#312E81" strokeWidth={2} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="totalValue" name="Value" stroke="#E8835C" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Recent sales */}
                {workerDetail.recentSales?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Recent Sales</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {workerDetail.recentSales.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 text-xs">
                          <span className="text-neutral-500">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>{s.items} items</span>
                          <span className="font-medium">{formatCurrency(s.total)}</span>
                          <span className="capitalize text-neutral-400">{s.paymentMethod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <AlertCircle size={32} className="text-neutral-300 mb-3" />
                <p className="text-sm text-neutral-500">Failed to load worker details</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main ReportsPage ────────────────────────────────────────────────────────

const ReportsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const role = user?.role;
  const shopId = user?.shop || user?.shopId;

  // Route guard: only managers and admins can access reports
  useEffect(() => {
    if (role && role === ROLES.CASHIER) {
      navigate('/dashboard', { replace: true });
    }
  }, [role, navigate]);

  // ── Socket real-time updates
  useSocket(shopId, {
    onSaleCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onStockUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  // Get current report title for email modal
  const emailReportTitle = useMemo(() => {
    const now = new Date();
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (activeTab === 'daily') {
      return now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (activeTab === 'monthly') {
      return `${fullMonths[now.getMonth()]} ${now.getFullYear()}`;
    }
    return 'Current Week';
  }, [activeTab]);

  const handleEmail = () => {
    setShowEmailModal(true);
  };

  const handleExport = async () => {
    try {
      const now = new Date();
      await reportService.exportReport(
        activeTab,
        activeTab === 'daily' ? now.toISOString().slice(0, 10) : undefined,
        activeTab !== 'daily' ? now.getMonth() + 1 : undefined,
        activeTab !== 'daily' ? now.getFullYear() : undefined
      );
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
        {/* Header with subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
          <p className="text-sm text-neutral-500 mt-1">Understand how your duka is performing</p>
        </div>

        {/* Tab bar with inline actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          {/* Scrollable tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 flex-1">
            {TABS.map((tab) => (
              <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onClick={setActiveTab} />
            ))}
          </div>

          {/* Action buttons — desktop inline, mobile stacked */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEmail}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Mail size={16} />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'daily' && <DailyTab />}
        {activeTab === 'weekly' && <WeeklyTab />}
        {activeTab === 'monthly' && <MonthlyTab />}
        {activeTab === 'products' && <ProductPerformanceTab />}
        {activeTab === 'workers' && <WorkerPerformanceTab />}
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        reportType={activeTab}
        reportTitle={emailReportTitle}
      />
    </div>
  );
};

export default ReportsPage;
