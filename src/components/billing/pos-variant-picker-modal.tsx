'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { ProductWithVariants, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';
import { ProductImagePlaceholder } from '@/components/common/product-image-placeholder';

interface PosVariantPickerModalProps {
  product: ProductWithVariants | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: {
    variant: Variant;
    product: ProductWithVariants;
    qty: number;
    unit_selling_price: number;
    line_discount: number;
  }) => void;
  existingCartQty?: number;
}

const emptySubscribe = () => () => {};

export function PosVariantPickerModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  existingCartQty = 0,
}: PosVariantPickerModalProps) {
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Lock body scroll when variant picker is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const activeVariants = useMemo(() => {
    if (!product) return [];
    return product.variants.filter((v) => !v.archived);
  }, [product]);

  // Determine if colour and size exist in variants
  const hasColours = useMemo(() => {
    return activeVariants.some((v) => Boolean(v.colour?.trim()));
  }, [activeVariants]);

  const hasSizes = useMemo(() => {
    return activeVariants.some((v) => Boolean(v.size?.trim()));
  }, [activeVariants]);

  // Unique colours
  const availableColours = useMemo(() => {
    if (!hasColours) return [];
    const colours = new Set<string>();
    activeVariants.forEach((v) => {
      const col = v.colour?.trim();
      if (col) colours.add(col);
    });
    return Array.from(colours);
  }, [activeVariants, hasColours]);

  const [selectedColourOverride, setSelectedColourOverride] = useState<string | null>(null);
  const [selectedSizeOverride, setSelectedSizeOverride] = useState<string | null>(null);
  const [selectedVariantIdOverride, setSelectedVariantIdOverride] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [customPriceOverride, setCustomPriceOverride] = useState<string | null>(null);
  const [itemDiscount, setItemDiscount] = useState<string>('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive active colour
  const selectedColour = useMemo(() => {
    if (!hasColours) return '';
    if (selectedColourOverride && availableColours.includes(selectedColourOverride)) {
      return selectedColourOverride;
    }
    // Prefer first in-stock colour
    const firstInStock = activeVariants.find((v) => v.quantity > 0 && v.colour?.trim());
    return firstInStock?.colour?.trim() || availableColours[0] || '';
  }, [hasColours, selectedColourOverride, availableColours, activeVariants]);

  // Sizes available for active colour (or all sizes if no colours)
  const sizesForSelectedColour = useMemo(() => {
    if (!hasSizes) return [];
    if (!hasColours) return activeVariants;
    if (!selectedColour) return activeVariants;
    return activeVariants.filter((v) => (v.colour?.trim() || '') === selectedColour);
  }, [activeVariants, hasColours, hasSizes, selectedColour]);

  // Derive active size
  const selectedSize = useMemo(() => {
    if (!hasSizes) return '';
    if (
      selectedSizeOverride &&
      sizesForSelectedColour.some((v) => (v.size?.trim() || '') === selectedSizeOverride)
    ) {
      return selectedSizeOverride;
    }
    // Prefer in-stock size
    const firstInStock = sizesForSelectedColour.find((v) => v.quantity > 0);
    return firstInStock?.size?.trim() || sizesForSelectedColour[0]?.size?.trim() || '';
  }, [hasSizes, selectedSizeOverride, sizesForSelectedColour]);

  // Currently selected variant
  const selectedVariant = useMemo(() => {
    if (activeVariants.length === 0) return null;
    if (activeVariants.length === 1) return activeVariants[0];

    // Explicit ID override
    if (selectedVariantIdOverride) {
      const match = activeVariants.find((v) => v.id === selectedVariantIdOverride);
      if (match) return match;
    }

    if (hasColours && hasSizes) {
      return (
        sizesForSelectedColour.find((v) => (v.size?.trim() || '') === selectedSize) ||
        sizesForSelectedColour[0] ||
        activeVariants[0]
      );
    }

    if (hasColours) {
      return (
        activeVariants.find((v) => (v.colour?.trim() || '') === selectedColour) ||
        activeVariants[0]
      );
    }

    if (hasSizes) {
      return (
        sizesForSelectedColour.find((v) => (v.size?.trim() || '') === selectedSize) ||
        activeVariants[0]
      );
    }

    return activeVariants[0];
  }, [
    activeVariants,
    selectedVariantIdOverride,
    hasColours,
    hasSizes,
    sizesForSelectedColour,
    selectedSize,
    selectedColour,
  ]);

  // Derive price
  const displayPrice =
    customPriceOverride !== null
      ? customPriceOverride
      : selectedVariant?.selling_price.toString() || '0';

  if (!isOpen || !product) return null;

  const currentStock = selectedVariant?.quantity ?? 0;
  const remainingStock = Math.max(0, currentStock - existingCartQty);
  const unitPrice = parseInt(displayPrice || '0', 10) || 0;
  const discountVal = parseInt(itemDiscount || '0', 10) || 0;
  const grossTotal = qty * unitPrice;
  const lineNet = Math.max(0, grossTotal - discountVal);

  const handleColourSelect = (col: string) => {
    setSelectedColourOverride(col);
    setSelectedSizeOverride(null);
    setSelectedVariantIdOverride(null);
    setCustomPriceOverride(null);
    setErrorMsg(null);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSizeOverride(size);
    setSelectedVariantIdOverride(null);
    setCustomPriceOverride(null);
    setErrorMsg(null);
  };

  const handleVariantSelect = (v: Variant) => {
    setSelectedVariantIdOverride(v.id);
    if (v.colour) setSelectedColourOverride(v.colour);
    if (v.size) setSelectedSizeOverride(v.size);
    setCustomPriceOverride(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    setSelectedColourOverride(null);
    setSelectedSizeOverride(null);
    setSelectedVariantIdOverride(null);
    setCustomPriceOverride(null);
    setQty(1);
    setItemDiscount('0');
    setErrorMsg(null);
    onClose();
  };

  const handleAdd = () => {
    setErrorMsg(null);
    if (!selectedVariant) {
      setErrorMsg('Please select a valid variant.');
      return;
    }

    if (currentStock <= 0) {
      setErrorMsg('This variant is out of stock.');
      return;
    }

    if (qty <= 0) {
      setErrorMsg('Quantity must be at least 1.');
      return;
    }

    if (qty + existingCartQty > currentStock) {
      setErrorMsg(
        `Cannot add ${qty} units. Only ${remainingStock} available in stock (${existingCartQty} already in cart).`
      );
      return;
    }

    if (unitPrice < 0) {
      setErrorMsg('Selling price cannot be negative.');
      return;
    }

    if (discountVal < 0) {
      setErrorMsg('Discount cannot be negative.');
      return;
    }

    if (discountVal > grossTotal) {
      setErrorMsg(`Discount (₹${discountVal}) cannot exceed line total (₹${grossTotal}).`);
      return;
    }

    onAddToCart({
      variant: selectedVariant,
      product,
      qty,
      unit_selling_price: unitPrice,
      line_discount: discountVal,
    });

    handleClose();
  };

  const variantLabel = selectedVariant
    ? [selectedVariant.colour, selectedVariant.size].filter(Boolean).join(' • ') || 'Standard Variant'
    : '';

  if (!isOpen || !product || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-variant-picker-title"
      className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Background click overlay */}
      <div
        className="fixed inset-0 -z-10"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="bg-card text-card-foreground w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-border shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 p-3.5 sm:p-4 border-b border-border bg-secondary/20">
          <div className="w-12 h-14 rounded-xl overflow-hidden shrink-0 border border-border/60">
            <ProductImagePlaceholder
              name={product.name}
              category={product.category || undefined}
              colour={selectedVariant?.colour || undefined}
              aspectRatio="aspect-square"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {product.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground truncate">
                  {product.category}
                </span>
              )}
              {product.brand && (
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {product.brand}
                </span>
              )}
            </div>
            <h3 id="pos-variant-picker-title" className="text-base font-bold text-foreground truncate mt-0.5">{product.name}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Colour Selection (Rendered ONLY if product variants define colours) */}
          {hasColours && availableColours.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                1. Select Colour
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColours.map((col) => {
                  const isSelected = col === selectedColour;
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => handleColourSelect(col)}
                      className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'border-foreground bg-foreground text-background shadow-xs'
                          : 'border-border bg-card hover:bg-secondary text-foreground'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Size Selection (Rendered ONLY if product variants define sizes) */}
          {hasSizes && sizesForSelectedColour.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {hasColours ? '2. Select Size' : 'Select Size'}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {sizesForSelectedColour.map((v) => {
                  const sizeText = v.size?.trim() || 'Standard';
                  const isSelected = selectedVariant?.id === v.id || (v.size?.trim() || '') === selectedSize;
                  const isOutOfStock = v.quantity <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        if (hasColours) {
                          handleSizeSelect(v.size?.trim() || '');
                        } else {
                          handleVariantSelect(v);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-foreground bg-foreground/5 font-bold shadow-xs ring-1 ring-foreground'
                          : isOutOfStock
                          ? 'border-border/40 bg-secondary/20 text-muted-foreground/40 cursor-not-allowed opacity-60'
                          : 'border-border bg-card hover:bg-secondary text-foreground font-semibold'
                      }`}
                    >
                      <span className="text-sm">{sizeText}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isOutOfStock
                            ? 'text-rose-500 font-medium'
                            : v.quantity <= 2
                            ? 'text-amber-600 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isOutOfStock ? 'Sold out' : `${v.quantity} in stock`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Detail Box */}
          {selectedVariant && (
            <div className="p-3.5 rounded-2xl border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Selection:</span>
                <span className="font-semibold text-foreground">
                  {variantLabel}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Available Stock:</span>
                <span
                  className={`font-semibold ${
                    remainingStock <= 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : remainingStock <= 2
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {remainingStock} units
                  {existingCartQty > 0 && ` (${existingCartQty} in cart)`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Standard Retail Price:</span>
                <span className="font-semibold text-muted-foreground">
                  {formatIndianRupees(selectedVariant.selling_price)}
                </span>
              </div>
            </div>
          )}

          {/* 3. Pricing, Discount & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden h-11">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="px-3 h-full hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={qty}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10) || 1;
                    setQty(Math.min(parsed, remainingStock || 1));
                  }}
                  className="w-full text-center font-bold text-sm bg-transparent outline-hidden"
                />
                <button
                  type="button"
                  disabled={qty >= remainingStock}
                  onClick={() => setQty((prev) => Math.min(prev + 1, remainingStock))}
                  className="px-3 h-full hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Unit Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={displayPrice}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setCustomPriceOverride(clean);
                  }}
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-border bg-card font-bold text-sm outline-hidden focus:border-foreground transition-colors"
                />
              </div>
            </div>

            {/* Line Discount */}
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Discount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={itemDiscount}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setItemDiscount(clean);
                  }}
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-border bg-card font-bold text-sm outline-hidden focus:border-foreground transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Line summary */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/40 border border-border">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Line Total</span>
              <span className="text-xs text-foreground font-semibold">
                {qty} × {formatIndianRupees(unitPrice)}
                {discountVal > 0 && ` - ${formatIndianRupees(discountVal)} discount`}
              </span>
            </div>
            <RupeeDisplay amount={lineNet} size="lg" className="text-foreground font-bold" />
          </div>
        </div>

        {/* Sticky Accessible Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 border-t border-border bg-card flex items-center justify-between gap-3 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-border font-semibold text-xs hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedVariant || remainingStock <= 0}
            onClick={handleAdd}
            className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-foreground text-background font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ADD TO BILL</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
