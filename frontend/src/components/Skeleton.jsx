import React from 'react';

/**
 * Skeleton Loader Components
 * Used for loading states across the dashboard
 */

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-neutral-100 p-5 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-3 bg-neutral-200 rounded w-20 mb-2" />
        <div className="h-8 bg-neutral-200 rounded w-32" />
      </div>
      <div className="w-10 h-10 rounded-lg bg-neutral-200" />
    </div>
    <div className="h-4 bg-neutral-200 rounded w-24" />
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-5 bg-neutral-200 rounded w-48 mb-2" />
        <div className="h-4 bg-neutral-200 rounded w-32" />
      </div>
      <div className="h-10 bg-neutral-200 rounded-lg w-32" />
    </div>
    <div className="h-64 bg-neutral-100 rounded-lg" />
  </div>
);

export const SkeletonTransaction = () => (
  <div className="flex items-center justify-between p-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-neutral-200" />
      <div>
        <div className="h-4 bg-neutral-200 rounded w-32 mb-2" />
        <div className="h-3 bg-neutral-200 rounded w-24" />
      </div>
    </div>
    <div className="h-4 bg-neutral-200 rounded w-20" />
  </div>
);

export const SkeletonAlert = () => (
  <div className="py-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 bg-neutral-200 rounded" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 bg-neutral-200 rounded w-16" />
          <div className="h-3 bg-neutral-200 rounded w-12 ml-auto" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-full mb-2" />
        <div className="h-8 bg-neutral-200 rounded w-20" />
      </div>
    </div>
  </div>
);

export const SkeletonWorkerCard = () => (
  <div className="flex-shrink-0 bg-white border border-neutral-200 rounded-xl p-4 animate-pulse" style={{ minWidth: '160px' }}>
    <div className="text-center mb-3">
      <div className="w-12 h-12 rounded-full bg-neutral-200 mx-auto" />
    </div>
    <div className="text-center mb-3">
      <div className="h-4 bg-neutral-200 rounded w-20 mx-auto mb-2" />
      <div className="h-3 bg-neutral-200 rounded w-12 mx-auto" />
    </div>
    <div className="text-center mb-3">
      <div className="h-4 bg-neutral-200 rounded w-16 mx-auto mb-2" />
      <div className="h-5 bg-neutral-200 rounded w-24 mx-auto" />
    </div>
    <div className="h-1 bg-neutral-200 rounded-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Page Header */}
    <div className="animate-pulse">
      <div className="h-7 bg-neutral-200 rounded w-48 mb-2" />
      <div className="h-4 bg-neutral-200 rounded w-64" />
    </div>

    {/* Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>

    {/* Chart */}
    <SkeletonChart />

    {/* Transactions & Alerts */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Transactions */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-5 bg-neutral-200 rounded w-40" />
          <div className="h-4 bg-neutral-200 rounded w-20" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonTransaction key={i} />
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className="h-5 bg-neutral-200 rounded w-32" />
          <div className="h-4 bg-neutral-200 rounded w-24" />
        </div>
        <div className="space-y-0">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonAlert key={i} />
          ))}
        </div>
      </div>
    </div>

    {/* Worker Performance */}
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6 animate-pulse">
        <div className="h-5 bg-neutral-200 rounded w-48" />
        <div className="h-4 bg-neutral-200 rounded w-32" />
      </div>
      <div className="hidden md:flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonWorkerCard key={i} />
        ))}
      </div>
      <div className="md:hidden space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-neutral-200" />
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
              <div className="h-3 bg-neutral-200 rounded w-32" />
            </div>
            <div className="w-24 h-1 bg-neutral-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;
