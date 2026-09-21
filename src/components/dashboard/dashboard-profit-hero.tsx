'use client';

import React from 'react';
import { Calendar, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { formatIndianRupees } from '@/lib/utils/currency';
import { formatISTDate } from '@/lib/utils/dates';

interface DashboardProfitHeroProps {
  monthLabel: string;
  isCurrentMonth: boolean;
  profit: number;
  revenue: number;
  cost: number;
  billsCount?: number;
  itemsSold?: number;
  availableMonths: Array<{ value: string; label: string }>;
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
  isLoading?: boolean;
}

function getEditorialGreeting(): string {
  // Asia/Kolkata current hour
  const now = new Date();
  const utcHours = now.getUTCHours();
  const istHours = (utcHours + 5.5) % 24;
  if (istHours < 12) return 'Good morning';
  if (istHours < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardProfitHero({
  monthLabel,
  isCurrentMonth,
  profit,
  revenue,
  cost,
  billsCount = 0,
  itemsSold = 0,
  availableMonths,
  selectedMonth,
  onMonthChange,
  isLoading = false,
}: DashboardProfitHeroProps) {
  const greeting = getEditorialGreeting();
  const todayFormatted = formatISTDate(new Date());
  const isNegative = profit < 0;
  const isZero = profit === 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xs">
      {/* Editorial Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {greeting}, Cult Kulture
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {todayFormatted} • Asia/Kolkata Store Time
          </p>
        </div>

        {/* Minimal Month Selector Dropdown */}
        <div className="relative inline-block self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              disabled={isLoading}
              className="bg-transparent outline-hidden cursor-pointer font-bold pr-4 appearance-none text-xs"
              aria-label="Select report month"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value} className="bg-card text-foreground py-1">
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none -ml-3" />
          </div>
        </div>
      </div>

      {/* Prominent Financial Hero: Monthly Profit */}
      <div className="pt-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isCurrentMonth ? "This Month's Net Profit" : `${monthLabel} Net Profit`}
          </span>
          {isCurrentMonth && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE</span>
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <RupeeDisplay
            amount={profit}
            size="2xl"
            showColor
            className="text-4xl sm:text-6xl font-black tracking-tight"
          />

          {!isZero && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                isNegative
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              {isNegative ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>
                {revenue > 0 ? `${Math.round((profit / revenue) * 100)}% margin` : '0%'}
              </span>
            </div>
          )}
        </div>

        {/* Supporting Metrics in Subtle Editorial Hierarchy */}
        <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Revenue
            </span>
            <p className="text-base font-bold text-foreground tracking-tight">
              {formatIndianRupees(revenue)}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Cost of Goods
            </span>
            <p className="text-base font-bold text-foreground tracking-tight">
              {formatIndianRupees(cost)}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Bills
            </span>
            <p className="text-base font-bold text-foreground tracking-tight">
              {billsCount}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Items Sold
            </span>
            <p className="text-base font-bold text-foreground tracking-tight">
              {itemsSold}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
