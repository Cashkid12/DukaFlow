import React, { useState, useMemo } from 'react';
import {
  TrendingUp, DollarSign, AlertTriangle, Users,
  ArrowUpRight, ArrowDownRight, Plus, X,
  Package, UserPlus, Store, Minus, BarChart3,
  ShoppingCart, CheckCircle, Banknote, Smartphone, CreditCard, AlertCircle,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { BarChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useSocket } from '../hooks/useSocket';
import { DashboardSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/formatters';

const DashboardOverview = () => {
  const [fabOpen, setFabOpen] = useState(false);
  const { data, isLoading, isError, error, invalidate, refetch } = useDashboardQuery();
  const { user } = useUser();
  const firstName = user?.firstName || '';

  // ── Socket.io real-time updates ──────────────────────────────
  const shopId = data?.shopId;
  const socketCallbacks = useMemo(() => ({
    onSaleCompleted: () => { invalidate(); },
    onStockUpdated: () => { invalidate(); },
    onWorkerLogin: () => { invalidate(); },
    onAlertNew: () => { invalidate(); },
  }), [invalidate]);
  useSocket(shopId, socketCallbacks);

  // ── Detect first-time users (just completed onboarding) ──────
  const isFirstTime = useMemo(() => {
    try {
      const step2 = localStorage.getItem('onboarding_step2');
      return !!step2;
    } catch {
      return false;
    }
  }, []);

  // ── Chart time range ────────────────────────────────────────
  const [chartRange, setChartRange] = useState('7D');

  // ── Payment method icon helper ──────────────────────────────
  const getPaymentIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return <Banknote size={16} style={{ color: '#10B981' }} />;
      case 'mpesa':
      case 'm-pesa':
        return <Smartphone size={16} style={{ color: '#3B82F6' }} />;
      case 'card':
      case 'credit':
        return <CreditCard size={16} style={{ color: '#F59E0B' }} />;
      default:
        return <Banknote size={16} style={{ color: '#10B981' }} />;
    }
  };

  // ── Loading: skeleton screen ─────────────────────────────────
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // ── Error: network failure ──────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[600px] animate-fade-in">
        <div className="text-center max-w-md px-4">
          <AlertCircle size={48} className="mx-auto mb-4 text-neutral-300" />
          <p className="text-lg font-semibold text-neutral-900 mb-1">
            Unable to load dashboard data
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Please check your connection and try again
          </p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-[#312E81] text-white font-medium rounded-xl hover:bg-[#1E1B4B] transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const {
    hasData,
    shopName,
    todaySales,
    todaySalesTrend,
    todayProfit,
    todayProfitTrend,
    lowStockCount,
    activeWorkers,
    onlineWorkers,
    chartData,
    recentTransactions,
    alerts,
    workerPerformance,
  } = data;

  // ── Trend helpers ────────────────────────────────────────────
  const renderTrend = (trend) => {
    if (trend === null || trend === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
          <Minus size={14} />
          —
        </span>
      );
    }
    const isUp = trend >= 0;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}>
        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {isUp ? '+' : ''}{trend}%
      </span>
    );
  };

  // ── Empty state — no data yet ────────────────────────────────
  if (!hasData) {
    const welcomeName = firstName || 'there';

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#312E81] to-[#6366F1] rounded-2xl p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Store size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                Welcome, {welcomeName}!
              </h2>
              <p className="text-white/80 text-sm sm:text-base">
                {shopName !== 'Your Shop'
                  ? `${shopName} is all set up. `
                  : 'Your shop is all set up. '}
                Start by adding products to your inventory.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <button
              onClick={() => window.location.href = '/dashboard/inventory'}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#312E81] font-semibold rounded-xl hover:bg-white/90 transition-all text-sm"
            >
              <Plus size={18} />
              Add Your First Product
            </button>
            <button
              onClick={() => window.location.href = '/dashboard/workers'}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm border border-white/30"
            >
              <UserPlus size={18} />
              Invite Workers
            </button>
          </div>
        </div>

        {/* Centered Welcome Message */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[450px] text-center px-4 sm:px-0 py-8 sm:py-12">
            <Package size={48} className="mx-auto text-neutral-300 sm:hidden" />
            <Package size={64} className="mx-auto text-neutral-300 hidden sm:block" />
            <h3 className="text-[20px] sm:text-2xl font-bold text-neutral-900 mt-5">
              Welcome to Your Dashboard, {welcomeName}!
            </h3>
            <p className="text-[14px] sm:text-base text-neutral-500 mt-2 max-w-[450px] mx-auto text-center">
              Your shop is set up and ready to go. Add your first product to start tracking inventory and sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
              <button
                onClick={() => window.location.href = '/dashboard/inventory'}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-semibold rounded-xl transition-all text-sm shadow-md w-full sm:w-auto"
              >
                <Package size={18} />
                Add Your First Product
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/workers'}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-[1.5px] border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all text-sm w-full sm:w-auto"
              >
                <Users size={18} />
                Invite Workers
              </button>
            </div>
            <a
              href="#"
              className="inline-block mt-6 text-[14px] text-[#312E81] font-medium hover:underline"
              onClick={(e) => { e.preventDefault(); }}
            >
              Need help? View our quick start guide &rarr;
            </a>
          </div>
        </div>

        {/* Stat Cards — all zeros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Today's Sales */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today&apos;s Sales</p>
                <p className="text-2xl font-bold text-neutral-400 mt-1">KSh 0</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                <TrendingUp size={20} style={{ color: '#312E81' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderTrend(null)}
              <span className="text-xs text-neutral-500">vs yesterday</span>
            </div>
          </div>

          {/* Today's Profit */}
          <div
            className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5"
            style={{
              borderLeft: '4px solid #E8835C',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today&apos;s Profit</p>
                <p className="text-2xl font-bold mt-1 text-neutral-400">KSh 0</p>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
                <DollarSign size={20} style={{ color: '#E8835C' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderTrend(null)}
              <span className="text-xs text-neutral-500">vs yesterday</span>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Low Stock</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">0 items</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <AlertTriangle size={20} style={{ color: '#10B981' }} />
              </div>
            </div>
            <p className="text-xs font-medium text-green-600">All good &#10003;</p>
          </div>

          {/* Active Workers */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Workers</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">1 online</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users size={20} style={{ color: '#8B5CF6' }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-neutral-500">You</span>
            </div>
          </div>
        </div>

        {/* Empty Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Last 7 Days Performance</h2>
          </div>
          <div className="h-64 flex flex-col items-center justify-center">
            <BarChart3 size={48} className="text-neutral-200 mb-4" />
            <p className="text-[14px] text-neutral-400 font-medium">No sales data yet</p>
            <p className="text-[13px] text-neutral-400 mt-1">Sales will appear here once you start recording</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Data state — full dashboard ──────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* First-time Welcome Banner (dismissible) */}
      {isFirstTime && (
        <div className="bg-gradient-to-r from-[#312E81] to-[#6366F1] rounded-2xl p-6 sm:p-8 text-white relative">
          <button
            onClick={() => {
              localStorage.removeItem('onboarding_step2');
              window.location.reload();
            }}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Dismiss welcome banner"
          >
            <X size={16} />
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Store size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                Welcome, {firstName || 'there'}!
              </h2>
              <p className="text-white/80 text-sm sm:text-base">
                {shopName} is live. Keep adding products and recording sales!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-600 mt-1">Here&apos;s how your duka is performing today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wide">Today&apos;s Sales</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{formatCurrency(todaySales)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
              <TrendingUp size={20} style={{ color: '#312E81' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderTrend(todaySalesTrend)}
            <span className="text-[13px] text-neutral-500">vs yesterday</span>
          </div>
        </div>

        {/* Today's Profit (Highlighted) */}
        <div
          className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          style={{
            borderLeft: '4px solid #E8835C',
            background: 'linear-gradient(135deg, #FDF2EC 0%, #FFFFFF 100%)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wide">Today&apos;s Profit</p>
              <p className="text-[28px] font-bold mt-1" style={{ color: '#E8835C' }}>{formatCurrency(todayProfit)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FDF2EC' }}>
              <DollarSign size={20} style={{ color: '#E8835C' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderTrend(todayProfitTrend)}
            <span className="text-[13px] text-neutral-500">vs yesterday</span>
          </div>
        </div>

        {/* Low Stock Items */}
        <div
          className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          onClick={() => window.location.href = '/dashboard/inventory?filter=low-stock'}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wide">Low Stock Items</p>
              <p className={`text-[28px] font-bold mt-1 ${
                lowStockCount > 0 ? 'text-orange-600' : 'text-neutral-900'
              }`}>
                {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              lowStockCount > 0 ? 'bg-orange-50' : 'bg-green-50'
            }`}>
              <AlertTriangle size={20} style={{ color: lowStockCount > 0 ? '#F59E0B' : '#10B981' }} />
            </div>
          </div>
          {lowStockCount > 0 ? (
            <p className="text-[13px] font-medium text-orange-600">Need restock</p>
          ) : (
            <p className="text-[13px] font-medium text-green-600">All stocked &#10003;</p>
          )}
        </div>

        {/* Active Workers */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-500 uppercase tracking-wide">Active Workers</p>
              <p className="text-[28px] font-bold text-neutral-900 mt-1">{activeWorkers} Online</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={20} style={{ color: '#8B5CF6' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Overlapping avatar circles */}
            {onlineWorkers > 0 ? (
              <div className="flex items-center -space-x-2">
                {Array.from({ length: Math.min(onlineWorkers, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                    style={{
                      backgroundColor: i === 0 ? '#312E81' : i === 1 ? '#E8835C' : '#8B5CF6',
                      zIndex: 3 - i,
                    }}
                  >
                    <span className="text-[8px] font-bold text-white">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
                {onlineWorkers > 3 && (
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white bg-neutral-400 flex items-center justify-center"
                    style={{ zIndex: 0 }}
                  >
                    <span className="text-[7px] font-bold text-white">+{onlineWorkers - 3}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-green-500" />
            )}
            <span className="text-[13px] text-neutral-500">{onlineWorkers} Active now</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-neutral-900">Last 7 Days Performance</h2>
          {/* Time Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            {['7D', '30D', '3M'].map((range) => (
              <button
                key={range}
                onClick={() => setChartRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  chartRange === range
                    ? 'bg-white text-[#312E81] shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <BarChart3 size={48} className="text-neutral-200 mb-4" />
            <p className="text-[14px] text-neutral-400 font-medium">No sales data yet</p>
            <p className="text-[13px] text-neutral-400 mt-1">Sales will appear here once you start recording</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px' }}
                    iconType="rect"
                  />
                  <Bar dataKey="sales" fill="#312E81" name="Sales" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                  <Line dataKey="profit" stroke="#E8835C" name="Profit" strokeWidth={3} dot={false} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
            <a href="/dashboard/sales" className="text-sm text-[#312E81] hover:underline font-medium">
              View All &rarr;
            </a>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart size={20} className="text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-400">No sales recorded today</p>
              </div>
            ) : (
              recentTransactions.map((txn) => (
                <div
                  key={txn._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => {/* Navigate to receipt */}}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      txn.paymentMethod === 'mpesa' || txn.paymentMethod === 'm-pesa' ? 'bg-blue-50' :
                      txn.paymentMethod === 'card' ? 'bg-orange-50' :
                      'bg-green-50'
                    }`}>
                      {getPaymentIcon(txn.paymentMethod)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{txn.productName}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-2">
                        <span className="text-[13px] text-neutral-500">{txn.time}</span>
                        <span>&bull;</span>
                        <span>Qty: {txn.quantity}</span>
                        {txn.worker?.name && (
                          <>
                            <span>&bull;</span>
                            <span>{txn.worker.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 flex-shrink-0 ml-3">
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-neutral-900">Alerts &amp; Warnings</h2>
            {alerts.length > 0 && (
              <button className="text-sm text-neutral-500 hover:text-[#312E81] transition-colors">
                Mark All Read
              </button>
            )}
          </div>

          <div className="space-y-0 divide-y divide-neutral-100">
            {alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} style={{ color: '#10B981' }} />
                </div>
                <p className="text-sm text-neutral-400">All clear! &#10003;</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{alert.icon}</span>
                        <span className={`text-xs font-semibold uppercase ${
                          alert.type === 'low_stock' ? 'text-orange-600' :
                          alert.type === 'expiry' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {alert.type?.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-neutral-400 ml-auto">{alert.time}</span>
                      </div>
                      <p className="text-sm text-neutral-700 mt-1">{alert.message}</p>
                      {alert.action && (
                        <button
                          onClick={() => alert.action.link && (window.location.href = alert.action.link)}
                          className="mt-2 px-3 py-1.5 text-xs font-medium text-[#312E81] border border-[#312E81] rounded-lg hover:bg-[#312E81] hover:text-white transition-all duration-200"
                        >
                          {alert.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Worker Performance */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Worker Performance Today</h2>
          </div>
          <a href="/dashboard/workers" className="text-sm text-[#312E81] hover:underline font-medium">
            View All Workers &rarr;
          </a>
        </div>

        {activeWorkers <= 1 ? (
          /* No workers — only owner */
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <UserPlus size={20} className="text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              You haven&apos;t added workers yet.
            </p>
            <a
              href="/dashboard/workers"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#312E81] hover:underline"
            >
              Invite your staff &rarr;
            </a>
          </div>
        ) : workerPerformance.length === 0 ? (
          /* Workers exist but no sales today */
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-400">No worker sales recorded today</p>
          </div>
        ) : (
          <>
            {/* Desktop: Horizontal Scroll Cards */}
            <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
              {workerPerformance.map((worker) => (
                <div
                  key={worker._id}
                  className="flex-shrink-0 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
                  style={{ minWidth: '160px' }}
                >
                  <div className="text-center mb-3">
                    <div className="relative inline-block">
                      <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                        <span className="text-base font-semibold text-[#312E81]">
                          {(worker.name || '?').charAt(0)}
                        </span>
                      </div>
                      {worker.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <p className="text-base font-semibold text-neutral-900">{worker.name}</p>
                    <p className={`text-xs mt-0.5 ${
                      worker.status === 'online' ? 'text-green-600' : 'text-neutral-400'
                    }`}>
                      {worker.status === 'online' ? 'Active' : 'Offline'}
                    </p>
                  </div>
                  <div className="text-center mb-3">
                    <p className="text-sm text-neutral-600">{worker.salesCount} Sales</p>
                    <p className="text-base font-semibold" style={{ color: '#312E81' }}>
                      {formatCurrency(worker.salesValue)}
                    </p>
                  </div>
                  <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${worker.percentageOfTop || 0}%`,
                        backgroundColor: '#E8835C',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Stacked List */}
            <div className="md:hidden space-y-3">
              {workerPerformance.slice(0, 3).map((worker) => (
                <div
                  key={worker._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                      <span className="text-xs font-semibold text-[#312E81]">
                        {(worker.name || '?').charAt(0)}
                      </span>
                    </div>
                    {worker.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{worker.name}</p>
                      <span className={`text-xs ${
                        worker.status === 'online' ? 'text-green-600' : 'text-neutral-400'
                      }`}>
                        ({worker.status === 'online' ? 'Active' : 'Offline'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-neutral-600">{worker.salesCount} sales</p>
                      <p className="text-xs font-semibold" style={{ color: '#312E81' }}>
                        {formatCurrency(worker.salesValue)}
                      </p>
                    </div>
                  </div>
                  <div className="w-24 h-1 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${worker.percentageOfTop || 0}%`,
                        backgroundColor: '#E8835C',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 space-y-2">
            <button
              onClick={() => { setFabOpen(false); window.location.href = '/dashboard/sales'; }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            >
              <ShoppingCart size={18} style={{ color: '#10B981' }} />
              <span className="text-sm font-medium text-neutral-900">Quick Sale</span>
            </button>
            <button
              onClick={() => { setFabOpen(false); window.location.href = '/dashboard/inventory'; }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            >
              <Package size={18} style={{ color: '#312E81' }} />
              <span className="text-sm font-medium text-neutral-900">Add Product</span>
            </button>
            <button
              onClick={() => { setFabOpen(false); window.location.href = '/dashboard/workers'; }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            >
              <UserPlus size={18} style={{ color: '#8B5CF6' }} />
              <span className="text-sm font-medium text-neutral-900">Add Worker</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-12 h-12 rounded-[14px] shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
          style={{
            backgroundColor: fabOpen ? '#1E1B4B' : '#312E81',
          }}
          aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
        >
          {fabOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <Plus size={24} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardOverview;
