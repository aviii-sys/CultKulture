'use client';

import React from 'react';
import { Package, Flame } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';

interface TopSellerItem {
  product_name: string;
  colour: string;
  size: string;
  qty_sold: number;
  revenue: number;
}

interface DashboardTopSellersProps {
  items: TopSellerItem[];
  monthLabel: string;
}

export function DashboardTopSellers({ items, monthLabel }: DashboardTopSellersProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-foreground">Top Selling Products</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {monthLabel}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <Package className="w-8 h-8 opacity-30 mx-auto" />
            <p className="text-xs font-medium">No products sold in this month yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={`${item.product_name}-${item.colour}-${item.size}-${idx}`}
                className="p-3 rounded-2xl border border-border/80 bg-background/50 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center font-extrabold text-xs text-muted-foreground shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground leading-tight">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-secondary text-foreground">
                        {item.colour}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                        {item.size}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-foreground">
                    <RupeeDisplay amount={item.revenue} size="sm" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.qty_sold} sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between">
        <span>Ranked by units sold</span>
        <span>Voided bills excluded</span>
      </div>
    </div>
  );
}
