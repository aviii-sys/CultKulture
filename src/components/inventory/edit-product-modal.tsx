'use client';

import React, { useState } from 'react';
import { X, Edit3, Archive, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { updateProductAction, toggleArchiveProductAction } from '@/lib/actions/inventory-actions';
import { Product } from '@/types';

interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function EditProductModal({
  product,
  onClose,
  onSaved,
}: EditProductModalProps) {
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [brand, setBrand] = useState(product?.brand || '');
  const [isArchived, setIsArchived] = useState(product?.archived || false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name cannot be empty');
      return;
    }
    if (!category.trim()) {
      setError('Category cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await updateProductAction({
      id: product.id,
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim() || null,
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
    if (
      nextState &&
      !confirm(
        `Are you sure you want to archive "${product.name}"? It will be hidden from normal inventory and POS counter.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    const res = await toggleArchiveProductAction(product.id, nextState);
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
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-base">Edit Product</h3>
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

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Leather Jacket"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Category *
            </label>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Jackets, Shirts, Jeans"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Brand (Optional)
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Zara, H&M, Cult"
              className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Archive Status Info & Action */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">Archive Status</span>
              <p className="text-[11px] text-muted-foreground">
                {isArchived ? 'Currently archived (hidden)' : 'Active in store & POS'}
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
                  <span>Archive Product</span>
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
