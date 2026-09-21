'use client';

import React from 'react';
import {
  PlusCircle,
  Clock,
  Sliders,
  Edit3,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Archive,
} from 'lucide-react';
import { Product, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { formatISTDate } from '@/lib/utils/dates';
import { FlatInventoryItem } from './product-table';

interface ProductCardListProps {
  items: FlatInventoryItem[];
  onOpenHistory: (variant: Variant, product: Product) => void;
  onOpenRestock: (variant: Variant, product: Product) => void;
  onOpenEditVariant: (variant: Variant, product: Product) => void;
  onOpenEditProduct: (product: Product) => void;
}

export function ProductCardList({
  items,
  onOpenHistory,
  onOpenRestock,
  onOpenEditVariant,
  onOpenEditProduct,
}: ProductCardListProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-border rounded-2xl bg-card">
        <p className="text-sm font-medium">No inventory items match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(({ product, variant }) => {
        const isOutOfStock = variant.quantity === 0;
        const isLowStock = !isOutOfStock && variant.quantity <= variant.low_stock_threshold;

        return (
          <div
            key={variant.id}
            className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-3"
          >
            {/* Top Row: Product Title & Category */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-base text-foreground leading-tight">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      {product.brand}
                    </span>
                  )}
                  {product.archived && (
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Archive className="w-2.5 h-2.5" />
                      Archived
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{product.category}</span>
                  <span>•</span>
                  <span>Updated {formatISTDate(variant.updated_at)}</span>
                </div>
              </div>

              {/* Edit Product Button */}
              <button
                type="button"
                onClick={() => onOpenEditProduct(product)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/80 transition-colors"
                title="Edit product"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Middle Row: Variant Colour/Size & Stock Badge */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-semibold">
                  {variant.colour}
                </span>
                <span className="text-muted-foreground font-bold">/</span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
                  {variant.size}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                    <XCircle className="w-3 h-3" />
                    OUT OF STOCK
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                    <AlertTriangle className="w-3 h-3" />
                    LOW ({variant.quantity})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* Financials Row: Stock Qty, Selling Price, Cost */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/70 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Stock</span>
                <span
                  className={`font-extrabold text-sm tabular-nums ${
                    isOutOfStock
                      ? 'text-rose-600 dark:text-rose-400'
                      : isLowStock
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                  }`}
                >
                  {variant.quantity}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Selling</span>
                <span className="font-extrabold text-sm text-foreground tabular-nums">
                  {formatIndianRupees(variant.selling_price)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Avg Cost</span>
                <span className="font-semibold text-xs text-muted-foreground tabular-nums">
                  {formatIndianRupees(variant.cost_price)}
                </span>
              </div>
            </div>

            {/* Bottom Actions: Large touch targets */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenRestock(variant, product)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-xs min-h-[44px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Restock</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenHistory(variant, product)}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors min-h-[44px]"
                title="View stock history"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden xs:inline">History</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenEditVariant(variant, product)}
                className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors min-h-[44px]"
                title="Edit variant details"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden xs:inline">Edit</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
