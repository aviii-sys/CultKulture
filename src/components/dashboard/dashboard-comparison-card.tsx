'use client';

import React from 'react';
import { PieChart } from 'lucide-react';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface DashboardComparisonCardProps {
  revenue: number;
  cost: number;
  profit: number;
  discounts?: number;
}

export function DashboardComparisonCard({
  revenue,
  cost,
  profit,
}: DashboardComparisonCardProps) {
  const safeRevenue = Math.max(revenue, 0);
  const costPercent = safeRevenue > 0 ? Math.min(100, Math.round((cost / safeRevenue) * 100)) : 0;
  const profitPercent = safeRevenue > 0 ? Math.max(0, Math.round((profit / safeRevenue) * 100)) : 0;

  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-foreground">
              Revenue Breakdown
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Cost vs Profit Ratio
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-amber-700 dark:text-amber-400">
              Cost: {costPercent}%
            </span>
            <span className="text-emerald-700 dark:text-emerald-400">
              Profit: {profitPercent}%
            </span>
          </div>

          <div className="h-4 w-full rounded-full bg-secondary/80 overflow-hidden flex p-0.5 border border-border">
            {costPercent > 0 && (
              <div
                style={{ width: `${costPercent}%` }}
                className="h-full bg-amber-500 rounded-l-full transition-all duration-300"
                title={`Cost of Goods Sold: ${costPercent}%`}
              />
            )}
            {profitPercent > 0 && (
              <div
                style={{ width: `${profitPercent}%` }}
                className="h-full bg-emerald-500 rounded-r-full transition-all duration-300"
                title={`Net Profit: ${profitPercent}%`}
              />
            )}
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
              <span>Cost of Goods</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {formatIndianRupees(cost)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {costPercent}% of total revenue
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/30 border border-border/70 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
              <span>Net Profit</span>
            </div>
            <div className="text-sm font-bold">
              <RupeeDisplay amount={profit} showColor size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {profitPercent}% profit margin
            </p>
          </div>
        </div>
      </div>

      {/* Footer Gross vs Net Summary */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
        <span>Total Net Revenue:</span>
        <span className="font-bold text-foreground">
          {formatIndianRupees(revenue)}
        </span>
      </div>
    </div>
  );
}
