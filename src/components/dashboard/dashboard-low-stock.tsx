'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ArrowRight, Boxes } from 'lucide-react';
import { LowStockVariantItem } from '@/lib/actions/dashboard-actions';

interface DashboardLowStockProps {
  items: LowStockVariantItem[];
}

export function DashboardLowStock({ items }: DashboardLowStockProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-foreground">Stock Warnings</h3>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>VIEW INVENTORY</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-10 text-center space-y-2 rounded-2xl border border-dashed border-border/80 bg-background/50">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-xs text-foreground">All stock levels are healthy.</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              No products are currently at or below their low-stock thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const isOutOfStock = item.quantity <= 0;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-border/80 bg-background/50 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
                >
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
                      {item.category && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          • {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOutOfStock
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
                      }`}
                    >
                      {isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                    <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {item.quantity} remaining
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between items-center">
        <span>Current inventory alerts</span>
        <Link
          href="/inventory"
          className="font-semibold text-foreground hover:text-sky-600 transition-colors flex items-center gap-1"
        >
          <Boxes className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Restock</span>
        </Link>
      </div>
    </div>
  );
}
