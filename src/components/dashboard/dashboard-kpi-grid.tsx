'use client';

import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  Layers,
} from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { formatIndianRupees } from '@/lib/utils/currency';

interface DashboardKpiGridProps {
  revenue: number;
  cost: number;
  profit: number;
  discounts: number;
  billsCount: number;
  itemsSold: number;
}

export function DashboardKpiGrid({
  revenue,
  cost,
  profit,
  discounts,
  billsCount,
  itemsSold,
}: DashboardKpiGridProps) {
  const grossSales = revenue + discounts;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Revenue */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <RupeeDisplay amount={revenue} size="xl" className="text-foreground" />
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground space-y-0.5">
          <div className="flex justify-between">
            <span>Gross Sales:</span>
            <span className="font-semibold text-foreground">{formatIndianRupees(grossSales)}</span>
          </div>
          {discounts > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>Discounts:</span>
              <span>-{formatIndianRupees(discounts)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Cost of Goods Sold */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cost of Goods</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <RupeeDisplay amount={cost} size="xl" className="text-foreground" />
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
          <span>Snapshotted cost price</span>
        </div>
      </div>

      {/* 3. Profit */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Net Profit</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <RupeeDisplay amount={profit} size="xl" showColor />
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
          <span>
            {revenue > 0 ? `${((profit / revenue) * 100).toFixed(1)}% profit margin` : '0% margin'}
          </span>
        </div>
      </div>

      {/* 4. Total Bills */}
      <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bills</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-foreground">
            {billsCount}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
          <span>
            {billsCount > 0 ? `Avg ${formatIndianRupees(Math.round(revenue / billsCount))} / bill` : 'No sales'}
          </span>
        </div>
      </div>

      {/* 5. Items Sold */}
      <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Items Sold</span>
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-foreground">
            {itemsSold}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground">
          <span>
            {billsCount > 0 ? `${(itemsSold / billsCount).toFixed(1)} items / bill` : '0 units'}
          </span>
        </div>
      </div>
    </div>
  );
}
