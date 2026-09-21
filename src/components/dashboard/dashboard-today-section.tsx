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
    <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <Sun className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            Today&apos;s Store Performance
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            IST Live
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {todayBillsCount} {todayBillsCount === 1 ? 'transaction' : 'transactions'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today Revenue */}
        <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Sales
          </span>
          <RupeeDisplay amount={todaySales} size="md" className="font-extrabold text-foreground" />
        </div>

        {/* Today Profit */}
        <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Today&apos;s Profit
          </span>
          <RupeeDisplay amount={todayProfit} size="md" showColor className="font-extrabold" />
        </div>

        {/* Today Bills */}
        <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Bills Issued
          </span>
          <div className="text-base font-extrabold text-foreground tracking-tight">
            {todayBillsCount}
          </div>
        </div>

        {/* Today Items */}
        <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
            Units Handed Over
          </span>
          <div className="text-base font-extrabold text-foreground tracking-tight">
            {todayItemsSold}
          </div>
        </div>
      </div>
    </div>
  );
}
