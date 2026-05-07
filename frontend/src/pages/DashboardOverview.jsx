import React, { useState, useCallback, useMemo } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, Users, ArrowUpRight, ArrowDownRight, Plus, X, Package, UserPlus, RefreshCw, Store } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { useDashboardSocket } from '../hooks/useDashboardSocket';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DashboardOverview = () => {
  const [fabOpen, setFabOpen] = useState(false);
  const { data, loading, error, refetch } = useDashboard();

  // Real-time Socket.io updates
  const handleSocketUpdate = useCallback((updateData) => {
    console.log('Dashboard update received:', updateData.type);
    // Refetch dashboard data when update received
    refetch();
  }, [refetch]);

  // Subscribe to real-time updates (shopId would come from user context)
  // eslint-disable-next-line no-unused-vars
  const shopId = data?.shopId; // Uncomment when shopId is available
  // useDashboardSocket(shopId, handleSocketUpdate);

  // Get shop name for welcome banner
  const shopName = useMemo(() => {
    const data = localStorage.getItem('onboarding_step2');
    if (data) {
      return JSON.parse(data).shopName || '';
    }
    return '';
  }, []);

  const isFirstTime = !!shopName; // Just completed onboarding

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw size={48} className="mx-auto mb-4 text-[#312E81] animate-spin" />
          <p className="text-lg font-medium text-neutral-900">Loading dashboard...</p>
          <p className="text-sm text-neutral-500 mt-1">Fetching your latest data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium text-neutral-900">Failed to load dashboard</p>
          <p className="text-sm text-neutral-500 mt-2 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-6 py-2 bg-[#312E81] text-white rounded-lg hover:bg-[#1E1B4B] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-neutral-400" />
          <p className="text-lg font-medium text-neutral-900">No data available</p>
          <p className="text-sm text-neutral-500 mt-2">Start making sales to see your dashboard</p>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${amount.toLocaleString()}`;
  };

  // Stats from API
  const stats = {
    todaySales: {
      value: formatCurrency(data.todaySales),
      change: `${data.todaySalesTrend > 0 ? '+' : ''}${data.todaySalesTrend}%`,
      trend: data.todaySalesTrend >= 0 ? 'up' : 'down',
    },
    profit: {
      value: formatCurrency(data.todayProfit),
      change: `${data.todayProfitTrend > 0 ? '+' : ''}${data.todayProfitTrend}%`,
      trend: data.todayProfitTrend >= 0 ? 'up' : 'down',
    },
    lowStock: {
      value: data.lowStockCount,
    },
    activeWorkers: {
      value: data.activeWorkers,
      online: data.onlineWorkers,
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner — First-time users */}
      {isFirstTime && (
        <div className="bg-gradient-to-r from-[#312E81] to-[#6366F1] rounded-2xl p-6 sm:p-8 text-white animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Store size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-1">
                🎉 Welcome to {shopName || 'DukaFlow'}!
              </h2>
              <p className="text-white/80 text-sm sm:text-base">
                Your shop is all set up. Start by adding products to your inventory or make your first sale.
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
              onClick={() => window.location.href = '/dashboard/sales'}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm border border-white/30"
            >
              <DollarSign size={18} />
              Make a Sale
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-sm text-neutral-600 mt-1">Here's how your duka is performing today</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today's Sales</p>
              <p className="text-3xl font-bold text-neutral-900 mt-1">{stats.todaySales.value}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
              <TrendingUp size={20} style={{ color: '#312E81' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stats.todaySales.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {stats.todaySales.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stats.todaySales.change}
            </span>
            <span className="text-xs text-neutral-500">vs yesterday</span>
          </div>
        </div>

        {/* Today's Profit (Highlighted) */}
        <div 
          className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          style={{
            borderLeft: '4px solid #E8835C',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Today's Profit</p>
              <p className="text-3xl font-bold mt-1" style={{ color: '#E8835C' }}>{stats.profit.value}</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF7ED' }}>
              <DollarSign size={20} style={{ color: '#E8835C' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stats.profit.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {stats.profit.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {stats.profit.change}
            </span>
            <span className="text-xs text-neutral-500">vs yesterday</span>
          </div>
        </div>

        {/* Low Stock Items */}
        <div 
          className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          onClick={() => window.location.href = '/dashboard/inventory?filter=low-stock'}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Low Stock</p>
              <p className={`text-3xl font-bold mt-1 ${
                parseInt(stats.lowStock.value) > 0 ? 'text-orange-600' : 'text-neutral-900'
              }`}>
                {stats.lowStock.value} Items
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle size={20} style={{ color: '#F59E0B' }} />
            </div>
          </div>
          <p className="text-xs font-medium text-orange-600">⚠️ Need restock</p>
        </div>

        {/* Active Workers */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Active Workers</p>
              <p className="text-3xl font-bold text-neutral-900 mt-1">{stats.activeWorkers.value} Online</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={20} style={{ color: '#8B5CF6' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-neutral-500">{stats.activeWorkers.online || 0} Active now</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Sales & Profit Trend</h2>
            <p className="text-sm text-neutral-500">Last 7 days performance</p>
          </div>
        </div>
        
        {/* Recharts Integration */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
              />
              <Legend />
              <Bar dataKey="sales" fill="#312E81" name="Sales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#E8835C" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
            <a href="/dashboard/sales" className="text-sm text-[#312E81] hover:underline font-medium">
              View All →
            </a>
          </div>
          
          <div className="space-y-4">
            {data.recentTransactions.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">No transactions yet</p>
            ) : (
              data.recentTransactions.map((transaction) => (
                <div 
                  key={transaction._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <TrendingUp size={18} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{transaction.productName}</p>
                      <p className="text-xs text-neutral-500">Qty: {transaction.quantity} • {transaction.time}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{formatCurrency(transaction.amount)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-neutral-900">Alerts & Warnings</h2>
            <button className="text-sm text-neutral-500 hover:text-[#312E81] transition-colors duration-200">
              Mark All Read
            </button>
          </div>
          
          <div className="space-y-0 divide-y divide-neutral-100">
            {data.alerts.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">No alerts</p>
            ) : (
              data.alerts.map((alert) => (
                <div 
                  key={alert._id}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{alert.icon}</span>
                        <span className={`text-xs font-semibold uppercase ${
                          alert.type === 'low_stock' ? 'text-orange-600' :
                          alert.type === 'expiry' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-xs text-neutral-400 ml-auto">{alert.time}</span>
                      </div>
                      <p className="text-sm text-neutral-700 mt-1">{alert.message}</p>
                      {alert.action && (
                        <button className="mt-2 px-3 py-1.5 text-xs font-medium text-[#312E81] border border-[#312E81] rounded-lg hover:bg-[#312E81] hover:text-white transition-all duration-200">
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
            View All Workers →
          </a>
        </div>
        
        {/* Desktop: Horizontal Scroll Cards */}
        <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
          {data.workerPerformance.length === 0 ? (
            <p className="text-center text-neutral-500 py-8 w-full">No worker data available</p>
          ) : (
            data.workerPerformance.map((worker) => (
              <div 
                key={worker._id}
                className="flex-shrink-0 bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
                style={{ minWidth: '160px' }}
              >
                <div className="text-center mb-3">
                  <div className="relative inline-block">
                    <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#312E81]">{worker.name.charAt(0)}</span>
                    </div>
                    {worker.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                </div>
                <div className="text-center mb-3">
                  <p className="text-sm font-semibold text-neutral-900">{worker.name}</p>
                  <p className={`text-xs mt-0.5 ${
                    worker.status === 'online' ? 'text-green-600' : 'text-neutral-400'
                  }`}>
                    {worker.status === 'online' ? 'Active' : 'Offline'}
                  </p>
                </div>
                <div className="text-center mb-3">
                  <p className="text-sm text-neutral-600">{worker.salesCount} Sales</p>
                  <p className="text-base font-semibold" style={{ color: '#312E81' }}>{formatCurrency(worker.salesValue)}</p>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${worker.percentageOfTop}%`,
                      backgroundColor: '#E8835C'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile: Stacked List */}
        <div className="md:hidden space-y-3">
          {data.workerPerformance.slice(0, 3).map((worker) => (
            <div 
              key={worker._id}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#312E81]">{worker.name.charAt(0)}</span>
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
                  <p className="text-xs font-semibold" style={{ color: '#312E81' }}>{formatCurrency(worker.salesValue)}</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-24 h-1 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${worker.percentageOfTop}%`,
                    backgroundColor: '#E8835C'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
        {/* Speed Dial Menu */}
        {fabOpen && (
          <div className="absolute bottom-16 right-0 space-y-2">
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap">
              <DollarSign size={18} style={{ color: '#10B981' }} />
              <span className="text-sm font-medium text-neutral-900">Quick Sale</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap">
              <Package size={18} style={{ color: '#312E81' }} />
              <span className="text-sm font-medium text-neutral-900">Add Product</span>
            </button>
            <button className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-all duration-200 whitespace-nowrap">
              <UserPlus size={18} style={{ color: '#8B5CF6' }} />
              <span className="text-sm font-medium text-neutral-900">Add Worker</span>
            </button>
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-14 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          style={{
            backgroundColor: fabOpen ? '#1E1B4B' : '#312E81',
            transform: fabOpen ? 'scale(1.05)' : 'scale(1)',
          }}
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
