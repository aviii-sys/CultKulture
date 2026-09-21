'use client';

import React from 'react';
import { Sun } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface DashboardTodaySectionProps {
  todaySales: number;
  todayProfit: number;
  todayBillsCount: number;
  todayItemsSold: number;
}

export function DashboardTodaySection({
  todaySales,
  todayProfit,
  todayBillsCount,
  todayItemsSold,
}: DashboardTodaySectionProps) {
  return (
    <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 via-background to-emerald-500/5 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            Today&apos;s Performance
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            IST Calendar Day
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {todayBillsCount} {todayBillsCount === 1 ? 'sale' : 'sales'} made today
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today Revenue */}
        <div className="p-3.5 rounded-2xl border border-border bg-card/80">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Revenue
          </span>
          <RupeeDisplay amount={todaySales} size="lg" className="text-foreground" />
        </div>

        {/* Today Profit */}
        <div className="p-3.5 rounded-2xl border border-border bg-card/80">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Profit
          </span>
          <RupeeDisplay amount={todayProfit} size="lg" showColor />
        </div>

        {/* Today Bills */}
        <div className="p-3.5 rounded-2xl border border-border bg-card/80">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Bills
          </span>
          <div className="text-lg font-bold text-foreground">
            {todayBillsCount}
          </div>
        </div>

        {/* Today Items */}
        <div className="p-3.5 rounded-2xl border border-border bg-card/80">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Items
          </span>
          <div className="text-lg font-bold text-foreground">
            {todayItemsSold}
          </div>
        </div>
      </div>
    </div>
  );
}
