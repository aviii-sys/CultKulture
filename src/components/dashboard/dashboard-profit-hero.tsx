'use client';

import React from 'react';
import { Calendar, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { formatIndianRupees } from '@/lib/utils/currency';

interface DashboardProfitHeroProps {
  monthLabel: string;
  isCurrentMonth: boolean;
  profit: number;
  revenue: number;
  cost: number;
  availableMonths: Array<{ value: string; label: string }>;
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
  isLoading?: boolean;
}

export function DashboardProfitHero({
  monthLabel,
  isCurrentMonth,
  profit,
  revenue,
  cost,
  availableMonths,
  selectedMonth,
  onMonthChange,
  isLoading = false,
}: DashboardProfitHeroProps) {
  const isNegative = profit < 0;
  const isZero = profit === 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-8 shadow-xs">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-sky-500/10 dark:bg-sky-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title and Subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isCurrentMonth ? "This Month's Net Profit" : `${monthLabel} Net Profit`}
            </span>
            {isCurrentMonth && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </span>
            )}
          </div>
          <h1 className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
            Total active revenue minus cost of goods sold (IST)
          </h1>
        </div>

        {/* Month Selector Dropdown */}
        <div className="relative inline-block">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-border bg-background/80 hover:bg-secondary/70 backdrop-blur-sm transition-colors text-xs font-bold text-foreground cursor-pointer shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              disabled={isLoading}
              className="bg-transparent outline-hidden cursor-pointer font-bold pr-4 appearance-none text-xs"
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

      {/* Hero Profit Metric */}
      <div className="relative z-10 mt-6 pt-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <RupeeDisplay
            amount={profit}
            size="2xl"
            showColor
            className="text-4xl sm:text-6xl font-extrabold tracking-tight"
          />

          {!isZero && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                isNegative
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
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

        {/* Calculation formula explanation */}
        <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Net Revenue:</span>
            <span className="font-semibold text-foreground">
              {formatIndianRupees(revenue)}
            </span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/40">•</span>
          <div className="flex items-center gap-2">
            <span>Cost of Goods Sold:</span>
            <span className="font-semibold text-foreground">
              {formatIndianRupees(cost)}
            </span>
          </div>
          <span className="hidden sm:inline text-muted-foreground/40">•</span>
          <div className="text-[11px] text-muted-foreground/80">
            Voided bills excluded
          </div>
        </div>
      </div>
    </div>
  );
}
