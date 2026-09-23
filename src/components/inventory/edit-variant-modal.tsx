'use client';

import React, { useState } from 'react';
import { X, Sliders, Archive, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { updateVariantAction, toggleArchiveVariantAction } from '@/lib/actions/inventory-actions';
import { Variant, Product } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';

interface EditVariantModalProps {
  variant: Variant | null;
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditVariantModal({
  variant,
  product,
  onClose,
  onSaved,
}: EditVariantModalProps) {
  const [colour, setColour] = useState(variant?.colour || '');
  const [size, setSize] = useState(variant?.size || '');
  const [sellingPrice, setSellingPrice] = useState<number | string>(
    variant?.selling_price !== undefined ? variant.selling_price : ''
  );
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(
    variant?.low_stock_threshold !== undefined ? variant.low_stock_threshold : 2
  );
  const [isArchived, setIsArchived] = useState(variant?.archived || false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!variant || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numSellingPrice = Number(sellingPrice);
    if (isNaN(numSellingPrice) || numSellingPrice < 0) {
      setError('Selling price must be a valid non-negative number');
      return;
    }

    const numThreshold = Number(lowStockThreshold);
    if (isNaN(numThreshold) || numThreshold < 0) {
      setError('Low-stock threshold must be a valid non-negative number');
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await updateVariantAction({
      id: variant.id,
      product_id: product.id,
      colour: colour.trim() || null,
      size: size.trim() || null,
      selling_price: numSellingPrice,
      low_stock_threshold: numThreshold,
      archived: isArchived,
    });

    setIsSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      if (onSaved) onSaved();
      onClose();
    }
  };

  const handleToggleArchive = async () => {
    const nextState = !isArchived;
    setIsSaving(true);
    const res = await toggleArchiveVariantAction(variant.id, nextState);
    setIsSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setIsArchived(nextState);
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-base">Edit Variant</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Stock & Cost Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/70 text-xs">
            <div>
              <span className="text-muted-foreground">Current Stock:</span>
              <div className="font-bold text-foreground">{variant.quantity} units</div>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Weighted Cost:</span>
              <div className="font-bold text-foreground">
                {formatIndianRupees(variant.cost_price)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Colour (Optional)
              </label>
              <input
                type="text"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. Black (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Size (Optional)
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. M, L, 32 (optional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Selling Price (₹) *
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

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Low-Stock Alert
              </label>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                required
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Archive Status Toggle */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">Archive Status</span>
              <p className="text-[11px] text-muted-foreground">
                {isArchived ? 'Archived (hidden from POS)' : 'Active in POS'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleArchive}
              disabled={isSaving}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isArchived
                  ? 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
              }`}
            >
              {isArchived ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Unarchive</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Variant</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
