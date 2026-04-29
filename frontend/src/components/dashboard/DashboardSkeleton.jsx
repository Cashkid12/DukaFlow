import React from 'react';

/**
 * Skeleton loading components for dashboard
 */

// Skeleton for stat cards
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-100 p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-3 bg-neutral-200 rounded w-20 mb-2"></div>
        <div className="h-8 bg-neutral-200 rounded w-28"></div>
      </div>
      <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
    </div>
    <div className="h-5 bg-neutral-200 rounded w-24 mt-2"></div>
  </div>
);

// Skeleton for chart
export const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-5 bg-neutral-200 rounded w-40 mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-32"></div>
      </div>
      <div className="h-9 bg-neutral-200 rounded-lg w-24"></div>
    </div>
    <div className="h-64 bg-neutral-100 rounded-lg"></div>
  </div>
);

// Skeleton for transactions list
export const TransactionsSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-5 bg-neutral-200 rounded w-40"></div>
      <div className="h-4 bg-neutral-200 rounded w-20"></div>
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-neutral-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-neutral-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-4 bg-neutral-200 rounded w-20"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for alerts
export const AlertsSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-5 bg-neutral-200 rounded w-32"></div>
      <div className="h-4 bg-neutral-200 rounded w-24"></div>
    </div>
    <div className="space-y-0 divide-y divide-neutral-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-4 first:pt-0 last:pb-0">
          <div className="h-3 bg-neutral-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-neutral-200 rounded w-full mb-2"></div>
          <div className="h-7 bg-neutral-200 rounded w-20 mt-2"></div>
        </div>
      ))}
    </div>
  </div>
);

// Skeleton for worker performance
export const WorkerPerformanceSkeleton = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="h-5 bg-neutral-200 rounded w-48 mb-6"></div>
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 border border-neutral-200 rounded-xl p-4" style={{ minWidth: '160px' }}>
          <div className="w-12 h-12 bg-neutral-200 rounded-full mx-auto mb-3"></div>
          <div className="h-4 bg-neutral-200 rounded w-20 mx-auto mb-2"></div>
          <div className="h-3 bg-neutral-200 rounded w-16 mx-auto mb-3"></div>
          <div className="h-4 bg-neutral-200 rounded w-24 mx-auto mb-2"></div>
          <div className="h-1 bg-neutral-200 rounded-full w-full"></div>
        </div>
      ))}
    </div>
  </div>
);

// Full dashboard skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Page Header Skeleton */}
    <div className="animate-pulse">
      <div className="h-8 bg-neutral-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-neutral-200 rounded w-72"></div>
    </div>

    {/* Stat Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Chart Skeleton */}
    <ChartSkeleton />

    {/* Transactions & Alerts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TransactionsSkeleton />
      </div>
      <div>
        <AlertsSkeleton />
      </div>
    </div>

    {/* Worker Performance Skeleton */}
    <WorkerPerformanceSkeleton />
  </div>
);

export default DashboardSkeleton;
