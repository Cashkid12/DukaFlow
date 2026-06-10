import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, DollarSign, AlertTriangle, Users,
  ArrowUpRight, ArrowDownRight, Plus, X,
  Package, UserPlus, Store, Minus, BarChart3,
  ShoppingCart, CheckCircle, Banknote, Smartphone, CreditCard,
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { BarChart, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { useSocket } from '../hooks/useSocket';
import { DashboardSkeleton } from '../components/Skeleton';
import { formatCurrency } from '../utils/formatters';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { canViewProfit, canViewWorkers, ROLES } from '../utils/permissions';
import ErrorState from '../components/common/ErrorState';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);
  const { data, isLoading, isError, invalidate, refetch } = useDashboardQuery();
  const { user } = useUser();
  const { data: currentUser } = useCurrentUser();
  const role = currentUser?.role || ROLES.ADMIN;
  const isCashier = role === ROLES.CASHIER;
  const isManager = role === ROLES.MANAGER;
  const showProfit = canViewProfit(role);
  const showWorkers = canViewWorkers(role);
  const firstName = user?.firstName || '';

  // ── Socket.io real-time updates ──────────────────────────────
  const shopId = data?.shopId;
  const socketCallbacks = useMemo(() => ({
    onSaleCompleted: () => { invalidate(); },
    onStockUpdated: () => { invalidate(); },
    onWorkerLogin: () => { invalidate(); },
    onWorkerLogout: () => { invalidate(); },
    onAlertNew: () => { invalidate(); },
    onProductCreated: () => { invalidate(); },
    onProductUpdated: () => { invalidate(); },
    onProductDeleted: () => { invalidate(); },
  }), [invalidate]);
  useSocket(shopId, socketCallbacks);

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
      <ErrorState
        title="Unable to load dashboard data"
        message="Please check your connection and try again"
        onRetry={() => refetch()}
      />
    );
  }

  const {
    hasData,
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
  const renderTrendCompact = (trend) => {
    if (trend === null || trend === undefined) {
      return <span className="text-[11px] font-medium text-neutral-400">—</span>;
    }
    const isUp = trend >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {isUp ? '+' : ''}{trend}%
      </span>
    );
  };

  // ── Empty State: no products yet ─────────────────────────────
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] px-4 py-12 animate-fade-in">
        {/* Icon Circle */}
        <div className="w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full bg-[#EEF2FF] flex items-center justify-center mb-6 mx-auto">
          <Package size={56} className="sm:hidden" style={{ color: '#312E81' }} />
          <Package size={72} className="hidden sm:block" style={{ color: '#312E81' }} />
        </div>

        {/* Welcome Text */}
        <h2 className="text-[22px] sm:text-[28px] font-bold text-[#1E293B] mb-3 text-center">
          Welcome to Your Dashboard{firstName ? `, ${firstName}` : ''}!
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] mb-8 text-center max-w-[280px] sm:max-w-[480px]">
          Your shop is set up and ready to go. Add your first product to start tracking inventory and sales.
        </p>

        {/* Action Cards */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 justify-center mb-5 w-full sm:w-auto px-0 sm:px-0">
          {/* Add Product Card */}
          <div
            onClick={() => navigate('/dashboard/inventory/add')}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 w-full sm:w-[280px] cursor-pointer hover:shadow-md hover:border-[#312E81] hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center mb-4">
              <Package size={28} style={{ color: '#312E81' }} />
            </div>
            <h4 className="text-base font-semibold text-[#1E293B] mb-2">
              Add Your First Product
            </h4>
            <p className="text-sm text-[#64748B] mb-4 max-w-[220px]">
              Start tracking inventory, sales, and profits in minutes.
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/dashboard/inventory/add'); }}
              className="w-full h-12 bg-[#312E81] hover:bg-[#1E1B4B] text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Product &rarr;
            </button>
          </div>

          {/* Invite Workers Card (Admin only) */}
          {role === ROLES.ADMIN && (
            <div
              onClick={() => navigate('/dashboard/workers')}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 w-full sm:w-[280px] cursor-pointer hover:shadow-md hover:border-[#312E81] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                <Users size={28} style={{ color: '#8B5CF6' }} />
              </div>
              <h4 className="text-base font-semibold text-[#1E293B] mb-2">
                Invite Workers
              </h4>
              <p className="text-sm text-[#64748B] mb-4 max-w-[220px]">
                Add your staff to help manage the duka and record sales.
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/dashboard/workers'); }}
                className="w-full h-12 bg-white border-2 border-[#312E81] text-[#312E81] font-semibold rounded-xl hover:bg-[#EEF2FF] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <UserPlus size={18} /> Invite Workers &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Help Link */}
        <a href="#" className="text-sm text-[#312E81] hover:underline font-medium text-center">
          Need help? View our quick start guide &rarr;
        </a>
      </div>
    );
  }

  // ── Data state — full dashboard ──────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-600 mt-1">Here&apos;s how your duka is performing today</p>
      </div>

      {/* Stat Cards — 2×2 grid mobile, 4-col desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.5px]">{isCashier ? 'My Sales' : 'Sales'}</p>
            <TrendingUp size={18} className="text-neutral-400" />
          </div>
          <p className="text-[22px] font-bold text-neutral-900 leading-tight">{formatCurrency(todaySales)}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {renderTrendCompact(todaySalesTrend)}
            <span className="text-[11px] text-neutral-400">vs yesterday</span>
          </div>
        </div>

        {/* Today's Profit (Highlighted) — hidden for cashier, show "—" for manager */}
        {showProfit && (
        <div
          className="rounded-2xl border p-3.5 shadow-sm flex flex-col justify-between min-h-[100px]"
          style={{
            background: todayProfit > 0 ? 'linear-gradient(180deg, #FDF2EC 0%, #FFFFFF 100%)' : '#FFFFFF',
            borderColor: todayProfit > 0 ? '#E8835C40' : '#F1F5F9',
            borderBottom: todayProfit > 0 ? '3px solid #E8835C' : '3px solid #E5E7EB',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.5px]">Profit</p>
              <DollarSign size={18} style={{ color: todayProfit > 0 ? '#E8835C' : '#D1D5DB' }} />
            </div>
            <p className="text-[22px] font-bold leading-tight" style={{ color: isManager ? '#D1D5DB' : todayProfit > 0 ? '#E8835C' : '#9CA3AF' }}>
              {isManager ? '—' : formatCurrency(todayProfit)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isManager ? renderTrendCompact(null) : renderTrendCompact(todayProfitTrend)}
            <span className="text-[11px] text-neutral-400">vs yesterday</span>
          </div>
        </div>
        )}

        {/* Low Stock Items */}
        <div
          className="bg-white rounded-2xl border border-neutral-100 p-3.5 shadow-sm flex flex-col justify-between min-h-[100px] cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/dashboard/inventory?filter=low-stock')}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.5px]">Low Stock</p>
            <AlertTriangle size={18} style={{ color: lowStockCount > 0 ? '#F59E0B' : '#10B981' }} />
          </div>
          <p className="text-[22px] font-bold leading-tight" style={{ color: lowStockCount > 0 ? '#F59E0B' : '#9CA3AF' }}>
            {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'}
          </p>
          <p className="text-[11px] font-medium mt-0.5" style={{ color: lowStockCount > 0 ? '#F59E0B' : '#10B981' }}>
            {lowStockCount > 0 ? 'Need restock' : 'All good ✓'}
          </p>
        </div>

        {/* Active Workers */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 shadow-sm flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.5px]">Workers</p>
            <Users size={18} className="text-neutral-400" />
          </div>
          <p className="text-[22px] font-bold text-neutral-900 leading-tight">{activeWorkers} online</p>
          <div className="flex items-center gap-1 mt-1">
            {isCashier ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[11px] text-neutral-500">{onlineWorkers} active now</span>
              </>
            ) : (
              <>
                {onlineWorkers > 0 ? (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(onlineWorkers, 5) }).map((_, i) => (
                      <span
                        key={i}
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: ['#312E81', '#E8835C', '#8B5CF6', '#10B981', '#F59E0B'][i] }}
                      />
                    ))}
                    {onlineWorkers > 5 && (
                      <span className="text-[10px] text-neutral-400 ml-0.5">+{onlineWorkers - 5}</span>
                    )}
                    <span className="text-[11px] text-neutral-400 ml-1">{onlineWorkers} active</span>
                  </div>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[11px] text-neutral-400">{onlineWorkers} active now</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
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
          <div className="h-[200px] md:h-[300px] flex flex-col items-center justify-center">
            <BarChart3 size={48} className="text-neutral-200 mb-4" />
            <p className="text-[14px] text-neutral-500 font-medium">No sales data yet</p>
            <p className="text-[13px] text-neutral-400 mt-1">Sales will appear here once you start recording</p>
          </div>
        ) : (
          <>
            <div className="h-[200px] md:h-[300px]">
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
                  {showProfit && (
                  <Line dataKey="profit" stroke="#E8835C" name="Profit" strokeWidth={3} dot={false} type="monotone" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
            <button onClick={() => navigate('/dashboard/sales')} className="text-sm text-[#312E81] hover:underline font-medium">
              View All &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart size={20} className="text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-400 mb-3">No sales recorded today</p>
                <button
                  onClick={() => navigate('/dashboard/sales')}
                  className="text-sm text-[#312E81] font-medium hover:underline"
                >
                  Record your first sale &rarr;
                </button>
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
        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
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
                <p className="text-[13px] text-neutral-500 mt-1">No alerts right now</p>
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
                          onClick={() => alert.action.link && navigate(alert.action.link)}
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

      {/* Worker Performance — hidden for cashiers */}
      {showWorkers && (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Worker Performance Today</h2>
          </div>
          <button onClick={() => navigate('/dashboard/workers')} className="text-sm text-[#312E81] hover:underline font-medium">
            View All Workers &rarr;
          </button>
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
            <button
              onClick={() => navigate('/dashboard/workers')}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#312E81] hover:underline"
            >
              Invite your staff &rarr;
            </button>
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
            <div className="hidden md:flex gap-3 overflow-x-auto pb-2">
              {workerPerformance.map((worker) => (
                <div
                  key={worker._id}
                  className="flex-shrink-0 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
                  style={{ minWidth: '160px' }}
                >
                  <div className="text-center mb-3">
                    <div className="relative inline-block">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#312E81]">
                          {(worker.name || '?').charAt(0)}
                        </span>
                      </div>
                      {worker.status === 'online' && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
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
      )}

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50">
        {fabOpen && (
          <div className="absolute bottom-16 right-0 space-y-2 animate-[fadeSlideUp_0.2s_ease-out]">
            <button
              onClick={() => { setFabOpen(false); navigate('/dashboard/sales'); }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            > 
              <ShoppingCart size={18} style={{ color: '#10B981' }} />
              <span className="text-sm font-medium text-neutral-900">Quick Sale</span>
            </button>
            {!isCashier && (
            <button
              onClick={() => { setFabOpen(false); navigate('/dashboard/inventory'); }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            >
              <Package size={18} style={{ color: '#312E81' }} />
              <span className="text-sm font-medium text-neutral-900">Add Product</span>
            </button>
            )}
            {role === ROLES.ADMIN && (
            <button
              onClick={() => { setFabOpen(false); navigate('/dashboard/workers'); }}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap"
            >
              <UserPlus size={18} style={{ color: '#8B5CF6' }} />
              <span className="text-sm font-medium text-neutral-900">Add Worker</span>
            </button>
            )}
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
