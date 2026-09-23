'use client';

import React, { useEffect, useState } from 'react';
import { X, Clock, ArrowUpRight, Calendar, User, FileText, Loader2 } from 'lucide-react';
import { getVariantStockHistoryAction } from '@/lib/actions/inventory-actions';
import { formatIndianRupees } from '@/lib/utils/currency';
import { formatISTDateTime } from '@/lib/utils/dates';
import { Variant, Product } from '@/types';

interface StockHistoryModalProps {
  variant: Variant | null;
  product: Product | null;
  onClose: () => void;
}

export function StockHistoryModal({
  variant,
  product,
  onClose,
}: StockHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!variant) return;

    let isMounted = true;
    const fetchHistory = async () => {
      const res = await getVariantStockHistoryAction(variant.id);
      if (!isMounted) return;
      setIsLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setHistory(res.data || []);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [variant]);

  if (!variant || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-base text-foreground">Stock Addition History</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product.name} — <span className="font-semibold text-foreground">{[variant.colour, variant.size].filter(Boolean).join(' / ') || 'Standard'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Current Stock Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/80 text-xs">
            <div>
              <span className="text-muted-foreground">Current Stock:</span>
              <div className="text-base font-bold text-foreground mt-0.5">
                {variant.quantity} units
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Weighted Cost:</span>
              <div className="text-base font-bold text-foreground mt-0.5">
                {formatIndianRupees(variant.cost_price)}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-sky-500 mb-2" />
              <span className="text-xs">Loading stock history...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No stock addition entries found for this variant.
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                Entries Log ({history.length})
              </div>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {history.map((entry) => (
                  <div key={entry.id} className="p-3.5 bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+{entry.qty} units added</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-secondary text-foreground">
                        {formatIndianRupees(entry.cost_per_unit)} / unit
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        {entry.purchase_date || formatISTDateTime(entry.created_at)}
                      </span>
                      {entry.supplier && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground/70" />
                          Supplier: <strong className="text-foreground">{entry.supplier}</strong>
                        </span>
                      )}
                    </div>

                    {entry.notes && (
                      <div className="mt-1.5 flex items-start gap-1 text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded-md">
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{entry.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
