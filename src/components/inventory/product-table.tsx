'use client';

import React from 'react';
import {
  Clock,
  PlusCircle,
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

export interface FlatInventoryItem {
  product: Product;
  variant: Variant;
}

interface ProductTableProps {
  items: FlatInventoryItem[];
  onOpenHistory: (variant: Variant, product: Product) => void;
  onOpenRestock: (variant: Variant, product: Product) => void;
  onOpenEditVariant: (variant: Variant, product: Product) => void;
  onOpenEditProduct: (product: Product) => void;
}

export function ProductTable({
  items,
  onOpenHistory,
  onOpenRestock,
  onOpenEditVariant,
  onOpenEditProduct,
}: ProductTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-border rounded-2xl bg-card">
        <p className="text-sm font-medium">No inventory items match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Product & Category</th>
              <th className="py-3.5 px-4">Colour / Size</th>
              <th className="py-3.5 px-4 text-center">Stock Level</th>
              <th className="py-3.5 px-4 text-right">Avg Cost</th>
              <th className="py-3.5 px-4 text-right">Selling Price</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4">Last Updated</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {items.map(({ product, variant }) => {
              const isOutOfStock = variant.quantity === 0;
              const isLowStock = !isOutOfStock && variant.quantity <= variant.low_stock_threshold;

              return (
                <tr
                  key={variant.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  {/* Product & Category */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <span>{product.name}</span>
                          {product.brand && (
                            <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
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
                        {product.category && (
                          <span className="text-xs text-muted-foreground">{product.category}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenEditProduct(product)}
                        title="Edit product name/category"
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-opacity"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Colour & Size */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 font-medium">
                      {variant.colour && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground text-xs font-semibold">
                          {variant.colour}
                        </span>
                      )}
                      {variant.colour && variant.size && (
                        <span className="text-muted-foreground">/</span>
                      )}
                      {variant.size && (
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800">
                          {variant.size}
                        </span>
                      )}
                      {!variant.colour && !variant.size && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground text-xs font-medium italic">
                          Standard
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock Quantity */}
                  <td className="py-3.5 px-4 text-center">
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
                    <span className="text-[11px] text-muted-foreground ml-1">units</span>
                  </td>

                  {/* Cost Price */}
                  <td className="py-3.5 px-4 text-right font-medium text-muted-foreground tabular-nums">
                    {formatIndianRupees(variant.cost_price)}
                  </td>

                  {/* Selling Price */}
                  <td className="py-3.5 px-4 text-right font-bold text-foreground tabular-nums text-sm">
                    {formatIndianRupees(variant.selling_price)}
                  </td>

                  {/* Stock Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        <XCircle className="w-3 h-3" />
                        OUT OF STOCK
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                        <AlertTriangle className="w-3 h-3" />
                        LOW STOCK ({variant.quantity})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        In Stock
                      </span>
                    )}
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                    {formatISTDate(variant.updated_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenRestock(variant, product)}
                        title="Restock this variant"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenHistory(variant, product)}
                        title="View stock addition history"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditVariant(variant, product)}
                        title="Edit variant prices and details"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
