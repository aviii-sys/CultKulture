'use client';

import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profit Hero Skeleton */}
      <div className="h-44 sm:h-52 rounded-3xl border border-border bg-card/60 p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-secondary rounded-lg" />
          <div className="h-9 w-32 bg-secondary rounded-xl" />
        </div>
        <div className="h-12 w-56 bg-secondary rounded-xl mt-4" />
        <div className="h-4 w-72 bg-secondary/60 rounded-lg mt-4" />
      </div>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-secondary rounded" />
              <div className="h-5 w-5 bg-secondary rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-secondary rounded-lg" />
          </div>
        ))}
      </div>

      {/* Today Section Skeleton */}
      <div className="h-32 rounded-3xl border border-border bg-card/60 p-5 space-y-3">
        <div className="h-4 w-44 bg-secondary rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/60 p-3" />
          ))}
        </div>
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-72 rounded-3xl border border-border bg-card/60 p-6" />
        <div className="lg:col-span-4 h-72 rounded-3xl border border-border bg-card/60 p-6" />
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="h-80 rounded-3xl border border-border bg-card/60 p-6" />
        <div className="h-80 rounded-3xl border border-border bg-card/60 p-6" />
        <div className="h-80 rounded-3xl border border-border bg-card/60 p-6" />
      </div>
    </div>
  );
}
