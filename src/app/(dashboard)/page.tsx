import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Boxes,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-violet-500/10 border border-sky-500/20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Live Store Dashboard</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
              Phase 1 & 2 Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime revenue, COGS, itemized profit tracking, and IST analytics.
          </p>
        </div>
        <Link
          href="/billing"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
        >
          <Receipt className="w-4 h-4" />
          <span>Go to POS Counter</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metric Cards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Profit Card */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">This Month&apos;s Profit</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <RupeeDisplay amount={0} size="2xl" showColor />
          <p className="text-xs text-muted-foreground mt-2">IST Month (Excluding Voided Bills)</p>
        </div>

        {/* Month Revenue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Month Revenue</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <RupeeDisplay amount={0} size="2xl" />
          <p className="text-xs text-muted-foreground mt-2">Net after discounts</p>
        </div>

        {/* Today's Sales */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Sales</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <RupeeDisplay amount={0} size="2xl" />
          <p className="text-xs text-muted-foreground mt-2">0 bills generated today</p>
        </div>

        {/* Inventory Status */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Inventory</span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight">0 Variants</div>
          <p className="text-xs text-muted-foreground mt-2">0 low stock alerts</p>
        </div>
      </div>

      {/* System Status / Instructions Box */}
      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="flex items-center gap-2 font-semibold text-base mb-2">
          <Sparkles className="w-4 h-4 text-sky-500" />
          <span>Phase 1 & 2 Completed Successfully</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The database schema, atomic functions (<code className="text-xs bg-secondary px-1.5 py-0.5 rounded">add_stock_batch</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">create_bill</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">void_bill</code>, <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">dashboard_summary</code>), route guards, single-user auth, and shell are operational. When ready, proceed to Phase 3 (Inventory) and Phase 4 (Billing POS).
        </p>
      </div>
    </div>
  );
}
