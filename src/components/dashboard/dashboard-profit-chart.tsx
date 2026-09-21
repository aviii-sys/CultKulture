'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2, Info } from 'lucide-react';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface ProfitByDayItem {
  date: string; // YYYY-MM-DD
  revenue: number;
  discounts: number;
  cost: number;
  profit: number;
  bills_count: number;
}

interface DashboardProfitChartProps {
  month: string; // YYYY-MM
  monthLabel: string;
  data: ProfitByDayItem[];
}

export function DashboardProfitChart({
  month,
  monthLabel,
  data,
}: DashboardProfitChartProps) {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

  // Generate full calendar days for the selected month
  const daysInMonth = useMemo(() => {
    const [yearStr, monthNumStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthNumStr, 10); // 1 to 12
    const totalDays = new Date(year, monthIndex, 0).getDate();

    const mapByDate = new Map<string, ProfitByDayItem>();
    data.forEach((d) => {
      mapByDate.set(d.date, d);
    });

    const days: Array<{
      dayNum: number;
      dateStr: string;
      item: ProfitByDayItem;
      hasSales: boolean;
    }> = [];

    for (let day = 1; day <= totalDays; day++) {
      const dayFormatted = String(day).padStart(2, '0');
      const dateStr = `${month}-${dayFormatted}`;
      const existing = mapByDate.get(dateStr);

      if (existing) {
        days.push({
          dayNum: day,
          dateStr,
          item: existing,
          hasSales: existing.bills_count > 0 || existing.revenue > 0,
        });
      } else {
        days.push({
          dayNum: day,
          dateStr,
          item: {
            date: dateStr,
            revenue: 0,
            discounts: 0,
            cost: 0,
            profit: 0,
            bills_count: 0,
          },
          hasSales: false,
        });
      }
    }

    return days;
  }, [month, data]);

  // Max absolute profit for proportional scaling
  const maxProfit = useMemo(() => {
    const profits = daysInMonth.map((d) => Math.abs(d.item.profit));
    const highest = Math.max(...profits, 1000);
    return highest;
  }, [daysInMonth]);

  const activeDay = activeDayIndex !== null ? daysInMonth[activeDayIndex] : null;
  const totalMonthProfit = daysInMonth.reduce((sum, d) => sum + d.item.profit, 0);

  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-foreground">Profit by Day</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily profit breakdown for {monthLabel} (IST)
          </p>
        </div>

        {/* Selected or Active Day Highlight */}
        {activeDay && activeDay.hasSales ? (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-secondary/80 text-xs border border-border">
            <span className="text-muted-foreground font-medium">
              {activeDay.dateStr}:
            </span>
            <span className="font-bold text-foreground">
              Profit: <RupeeDisplay amount={activeDay.item.profit} size="sm" showColor />
            </span>
            <span className="text-muted-foreground">({activeDay.item.bills_count} bills)</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Total Profit: <RupeeDisplay amount={totalMonthProfit} size="sm" showColor />
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative pt-4 pb-2">
        {/* SVG/CSS Bar Chart Grid */}
        <div className="h-44 sm:h-52 w-full flex items-end gap-1 sm:gap-1.5 border-b border-border/70 pb-1">
          {daysInMonth.map((day, idx) => {
            const isSelected = activeDayIndex === idx;
            const profit = day.item.profit;
            const heightPercent = maxProfit > 0 ? Math.min(100, Math.max(4, Math.round((Math.abs(profit) / maxProfit) * 100))) : 4;
            const isNegative = profit < 0;

            return (
              <div
                key={day.dateStr}
                onMouseEnter={() => setActiveDayIndex(idx)}
                onMouseLeave={() => setActiveDayIndex(null)}
                onClick={() => setActiveDayIndex(idx)}
                className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
              >
                {/* Bar */}
                <div
                  style={{ height: day.hasSales ? `${heightPercent}%` : '4%' }}
                  className={`w-full max-w-[16px] rounded-t-sm transition-all duration-200 ${
                    !day.hasSales
                      ? 'bg-muted/40 hover:bg-muted'
                      : isNegative
                      ? 'bg-rose-500 hover:bg-rose-600 shadow-xs'
                      : isSelected
                      ? 'bg-emerald-400 dark:bg-emerald-300 ring-2 ring-emerald-500 shadow-md'
                      : 'bg-emerald-500 hover:bg-emerald-400'
                  }`}
                />

                {/* Day label on hover tooltip */}
                {isSelected && (
                  <div className="absolute -top-20 z-30 bg-popover text-popover-foreground border border-border p-2.5 rounded-xl shadow-xl text-[11px] whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-bold text-foreground mb-0.5">
                      {day.dateStr}
                    </div>
                    {day.hasSales ? (
                      <div className="space-y-0.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Profit:</span>
                          <RupeeDisplay amount={day.item.profit} size="sm" showColor />
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Revenue:</span>
                          <span className="font-semibold text-foreground">
                            {formatIndianRupees(day.item.revenue)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-semibold text-foreground">
                            {formatIndianRupees(day.item.cost)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-muted-foreground">Bills:</span>
                          <span className="font-semibold text-foreground">
                            {day.item.bills_count}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No sales recorded</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-Axis Tick Marks (Day 1, 5, 10, 15, 20, 25, end) */}
        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 px-1">
          <span>Day 1</span>
          <span className="hidden sm:inline">Day 5</span>
          <span>Day 10</span>
          <span className="hidden sm:inline">Day 15</span>
          <span>Day 20</span>
          <span className="hidden sm:inline">Day 25</span>
          <span>Day {daysInMonth.length}</span>
        </div>
      </div>

      {/* Chart Footer Tip */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span>Tap or hover over any day column for itemized daily revenue and profit.</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>Profit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-muted" />
            <span>No sales</span>
          </div>
        </div>
      </div>
    </div>
  );
}
