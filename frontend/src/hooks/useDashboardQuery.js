import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Default empty dashboard structure — returned when backend is unavailable
 * or when the shop has no data yet. NEVER shows an error to the user.
 */
const EMPTY_DASHBOARD = {
  hasData: false,
  shopId: null,
  shopName: 'Your Shop',
  todaySales: 0,
  todaySalesTrend: null,
  todayProfit: 0,
  todayProfitTrend: null,
  lowStockCount: 0,
  activeWorkers: 0,
  onlineWorkers: 0,
  chartData: [],
  recentTransactions: [],
  alerts: [],
  workerPerformance: [],
  date: new Date().toISOString().split('T')[0],
};

/**
 * Transform chart data from backend format to recharts format.
 * Backend: [{ _id: { date, day }, sales, profit }]
 * Recharts: [{ day, sales, profit }]
 */
const transformChartData = (chartData) => {
  if (!chartData || chartData.length === 0) return [];
  return chartData.map((item) => ({
    day: item._id?.day || item.day || '',
    date: item._id?.date || item.date || '',
    sales: item.sales || 0,
    profit: item.profit || 0,
  }));
};

/**
 * Compute hasData from API response — true if shop has any products or sales.
 */
const computeHasData = (data) => {
  if (!data) return false;
  return (
    data.todaySales > 0 ||
    data.recentTransactions?.length > 0 ||
    data.chartData?.length > 0 ||
    data.lowStockCount > 0 ||
    data.activeWorkers > 0
  );
};

/**
 * React Query hook for dashboard data.
 * - Fetches GET /api/dashboard with Clerk Bearer token
 * - On network error: throws so component can show error UI with retry
 * - On HTTP error (4xx/5xx): returns EMPTY_DASHBOARD gracefully
 * - On success: transforms chart data and computes hasData
 * - 60s stale time, refetches on window focus
 */
export const useDashboardQuery = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        // No token yet — return empty, Clerk will redirect to sign-in
        return EMPTY_DASHBOARD;
      }

      let response;
      try {
        response = await fetch(`${API_BASE_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (networkErr) {
        // Network failure (offline, DNS, timeout) → throw so error UI appears
        console.error('Dashboard network error:', networkErr.message);
        throw new Error('Unable to load dashboard data');
      }

      if (!response.ok) {
        // Backend error — log it but return empty state to user
        console.warn('Dashboard API returned', response.status);
        return EMPTY_DASHBOARD;
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        return EMPTY_DASHBOARD;
      }

      const raw = result.data;

      return {
        hasData: computeHasData(raw),
        shopId: raw.shopId || null,
        shopName: raw.shopName || 'Your Shop',
        todaySales: raw.todaySales ?? 0,
        todaySalesTrend: raw.todaySalesTrend ?? null,
        todayProfit: raw.todayProfit ?? 0,
        todayProfitTrend: raw.todayProfitTrend ?? null,
        lowStockCount: raw.lowStockCount ?? 0,
        activeWorkers: raw.activeWorkers ?? 0,
        onlineWorkers: raw.onlineWorkers ?? 0,
        chartData: transformChartData(raw.chartData),
        recentTransactions: raw.recentTransactions || [],
        alerts: raw.alerts || [],
        workerPerformance: raw.workerPerformance || [],
        date: raw.date || EMPTY_DASHBOARD.date,
      };
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    placeholderData: (prev) => prev,
  });

  /**
   * Force-refresh dashboard (called by socket listeners).
   */
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  return {
    ...query,
    data: query.data || EMPTY_DASHBOARD,
    invalidate,
  };
};

export default useDashboardQuery;
