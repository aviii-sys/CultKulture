'use client';

import React, { useState } from 'react';
import { X, PlusCircle, ArrowRight, Calculator, Loader2, AlertCircle } from 'lucide-react';
import { quickRestockAction } from '@/lib/actions/inventory-actions';
import { Variant, Product } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { getCurrentISTDateString } from '@/lib/utils/dates';

interface QuickRestockModalProps {
  variant: Variant | null;
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function QuickRestockModal({
  variant,
  product,
  onClose,
  onSaved,
}: QuickRestockModalProps) {
  const [qty, setQty] = useState<number | string>('');
  const [costPrice, setCostPrice] = useState<number | string>(
    variant?.cost_price !== undefined ? variant.cost_price : ''
  );
  const [sellingPrice, setSellingPrice] = useState<number | string>(
    variant?.selling_price !== undefined ? variant.selling_price : ''
  );
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(getCurrentISTDateString());
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!variant || !product) return null;

  // Live calculation of new stock & weighted average cost
  const currentQty = variant.quantity || 0;
  const currentCost = variant.cost_price || 0;
  const addedQty = Number(qty) || 0;
  const addedCost = Number(costPrice) || 0;

  const newTotalQty = currentQty + addedQty;
  const projectedAvgCost =
    newTotalQty > 0
      ? Math.round(
          (currentQty * currentCost + addedQty * addedCost) / newTotalQty
        )
      : addedCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addedQty <= 0) {
      setError('Quantity to add must be greater than 0');
      return;
    }
    if (addedCost < 0) {
      setError('Cost price cannot be negative');
      return;
    }
    const numSelling = Number(sellingPrice);
    if (isNaN(numSelling) || numSelling < 0) {
      setError('Selling price must be a valid non-negative number');
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await quickRestockAction({
      variant_id: variant.id,
      qty: addedQty,
      cost_price: addedCost,
      selling_price: numSelling,
      supplier: supplier.trim() || null,
      purchase_date: purchaseDate || null,
      notes: notes.trim() || null,
    });

    setIsSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-base">Restock Variant</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {product.name} — <strong className="text-foreground">{[variant.colour, variant.size].filter(Boolean).join(' / ') || 'Standard'}</strong>
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock Banner */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground">Current Stock:</span>
              <div className="font-bold text-foreground text-sm">{currentQty} units</div>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Current Avg Cost:</span>
              <div className="font-bold text-foreground text-sm">{formatIndianRupees(currentCost)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Qty to Add *
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                required
                autoFocus
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Purchase Cost (₹) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="₹1600"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Live Weighted Cost Preview */}
          {addedQty > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                <Calculator className="w-3.5 h-3.5" />
                <span>Weighted Average Cost Preview</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>New Total Stock: <strong>{newTotalQty} units</strong></span>
                <span className="flex items-center gap-1">
                  <span>{formatIndianRupees(currentCost)}</span>
                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                  <strong className="text-xs text-emerald-800 dark:text-emerald-300">
                    {formatIndianRupees(projectedAvgCost)}
                  </strong>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              New Selling Price (₹) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="₹2000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Supplier (Optional)
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Wholesaler name"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch invoice # or notes"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Confirm Restock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
