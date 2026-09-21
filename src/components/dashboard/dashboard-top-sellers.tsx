'use client';

import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { ProductImagePlaceholder } from '@/components/common/product-image-placeholder';

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
    <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Top Selling Pieces</h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {monthLabel}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-foreground/80">No pieces sold in this month yet.</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Sales from the POS will automatically calculate top-performing variants here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, idx) => (
              <div
                key={`${item.product_name}-${item.colour}-${item.size}-${idx}`}
                className="p-3 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 transition-all card-hover-lift flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-16 shrink-0 rounded-xl overflow-hidden shadow-2xs">
                    <ProductImagePlaceholder
                      name={item.product_name}
                      colour={item.colour}
                      aspectRatio="aspect-[3/4]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-foreground truncate leading-snug">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-background text-foreground/80 border border-border/40">
                        {item.colour}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background text-primary border border-border/40">
                        {item.size}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-baseline justify-between text-xs">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.qty_sold} sold
                  </span>
                  <div className="font-bold text-foreground">
                    <RupeeDisplay amount={item.revenue} size="sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between">
        <span>Ranked by volume</span>
        <span>Voided sales excluded</span>
      </div>
    </div>
  );
}
