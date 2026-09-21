'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { LowStockVariantItem } from '@/lib/actions/dashboard-actions';

interface DashboardLowStockProps {
  items: LowStockVariantItem[];
}

export function DashboardLowStock({ items }: DashboardLowStockProps) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Stock Alerts</h3>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span>Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="py-10 text-center space-y-2 rounded-2xl border border-border/60 bg-secondary/30">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-xs text-foreground">Healthy Inventory</h4>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              All active product variants are above their replenishment threshold.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const isOutOfStock = item.quantity <= 0;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-border/70 bg-secondary/30 flex items-center justify-between gap-3 hover:bg-secondary/60 transition-all card-hover-lift"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          isOutOfStock
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-foreground truncate mt-1">
                      {item.product_name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.colour} · {item.size}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-foreground">
                      {isOutOfStock ? (
                        <span className="text-rose-600 dark:text-rose-400">0 left</span>
                      ) : (
                        <span>{item.quantity} left</span>
                      )}
                    </span>
                    <Link
                      href={`/inventory?search=${encodeURIComponent(item.product_name)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-bold shadow-2xs hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Restock</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between items-center">
        <span>Automatic threshold alert</span>
        <Link href="/inventory" className="font-semibold text-foreground hover:underline">
          View all
        </Link>
      </div>
    </div>
  );
}
