import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse pb-6">
      {/* Top Banner / Hero Skeleton */}
      <div className="h-44 sm:h-52 rounded-3xl border border-border bg-card/60 p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-40 bg-secondary rounded-lg" />
          <div className="h-9 w-32 bg-secondary rounded-xl" />
        </div>
        <div className="h-12 w-56 bg-secondary rounded-xl mt-4" />
        <div className="h-4 w-72 bg-secondary/60 rounded-lg mt-4" />
      </div>

      {/* Grid Cards Skeleton */}
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

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 h-72 rounded-3xl border border-border bg-card/60 p-6" />
        <div className="lg:col-span-4 h-72 rounded-3xl border border-border bg-card/60 p-6" />
      </div>
    </div>
  );
}
