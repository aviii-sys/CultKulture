import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse pb-10 max-w-7xl mx-auto">
      {/* Editorial Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 sm:h-8 w-56 sm:w-72 bg-secondary rounded-2xl" />
          <div className="h-4 w-44 bg-secondary/60 rounded-xl" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-28 bg-secondary rounded-2xl" />
          <div className="h-10 w-32 bg-secondary rounded-2xl" />
        </div>
      </div>

      {/* Monthly Profit Hero Banner Skeleton */}
      <div className="h-64 sm:h-72 rounded-3xl border border-border bg-card/60 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-3 w-32 bg-secondary rounded-md" />
          <div className="h-12 w-64 bg-secondary rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2.5 w-16 bg-secondary/60 rounded" />
              <div className="h-6 w-24 bg-secondary rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Today Section KPI Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-3xl border border-border bg-card/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="h-2.5 w-20 bg-secondary/60 rounded" />
            <div className="h-7 w-28 bg-secondary rounded-xl" />
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Top sellers & Low Stock */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-64 rounded-3xl border border-border bg-card/60 p-6 space-y-4">
            <div className="h-4 w-36 bg-secondary rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="h-32 bg-secondary/40 rounded-2xl" />
              <div className="h-32 bg-secondary/40 rounded-2xl" />
            </div>
          </div>
          <div className="h-44 rounded-3xl border border-border bg-card/60 p-6" />
        </div>

        {/* Right Column: Recent Sales Activity */}
        <div className="lg:col-span-4 h-96 rounded-3xl border border-border bg-card/60 p-6 space-y-4">
          <div className="h-4 w-32 bg-secondary rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-secondary/40 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
