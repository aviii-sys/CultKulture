'use client';

import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { ProductWithVariants, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';

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

export function PosVariantPickerModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  existingCartQty = 0,
}: PosVariantPickerModalProps) {
  const activeVariants = useMemo(() => {
    if (!product) return [];
    return product.variants.filter((v) => !v.archived);
  }, [product]);

  // Unique colours
  const availableColours = useMemo(() => {
    const colours = new Set<string>();
    activeVariants.forEach((v) => colours.add(v.colour));
    return Array.from(colours);
  }, [activeVariants]);

  const [selectedColourOverride, setSelectedColourOverride] = useState<string | null>(null);
  const [selectedSizeOverride, setSelectedSizeOverride] = useState<string | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [customPriceOverride, setCustomPriceOverride] = useState<string | null>(null);
  const [itemDiscount, setItemDiscount] = useState<string>('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive active colour
  const selectedColour =
    (selectedColourOverride && availableColours.includes(selectedColourOverride)
      ? selectedColourOverride
      : availableColours[0]) || '';

  // Sizes available for active colour
  const sizesForSelectedColour = useMemo(() => {
    if (!selectedColour) return [];
    return activeVariants.filter((v) => v.colour === selectedColour);
  }, [activeVariants, selectedColour]);

  // Derive active size
  const selectedSize =
    (selectedSizeOverride && sizesForSelectedColour.some((v) => v.size === selectedSizeOverride)
      ? selectedSizeOverride
      : sizesForSelectedColour[0]?.size) || '';

  // Currently selected variant
  const selectedVariant = useMemo(() => {
    return (
      sizesForSelectedColour.find((v) => v.size === selectedSize) ||
      sizesForSelectedColour[0] ||
      null
    );
  }, [sizesForSelectedColour, selectedSize]);

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
    setCustomPriceOverride(null);
    setErrorMsg(null);
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSizeOverride(size);
    setCustomPriceOverride(null);
    setErrorMsg(null);
  };

  const handleClose = () => {
    setSelectedColourOverride(null);
    setSelectedSizeOverride(null);
    setCustomPriceOverride(null);
    setQty(1);
    setItemDiscount('0');
    setErrorMsg(null);
    onClose();
  };

  const handleAdd = () => {
    setErrorMsg(null);
    if (!selectedVariant) {
      setErrorMsg('Please select a valid colour and size.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border bg-secondary/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                {product.category}
              </span>
              {product.brand && (
                <span className="text-xs text-muted-foreground font-medium">
                  {product.brand}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold mt-1 text-foreground">{product.name}</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Colour Selection */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
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
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 shadow-xs'
                        : 'border-border bg-card hover:bg-secondary text-foreground'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Size Selection */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              2. Select Size
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {sizesForSelectedColour.map((v) => {
                const isSelected = v.size === selectedSize;
                const isOutOfStock = v.quantity <= 0;
                return (
                  <button
                    key={v.size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleSizeSelect(v.size)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold shadow-xs'
                        : isOutOfStock
                        ? 'border-border/50 bg-secondary/30 text-muted-foreground/50 opacity-60 cursor-not-allowed'
                        : 'border-border bg-card hover:bg-secondary text-foreground font-semibold'
                    }`}
                  >
                    <span className="text-base">{v.size}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isOutOfStock
                          ? 'text-rose-500 font-medium'
                          : v.quantity <= 2
                          ? 'text-amber-500 font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {isOutOfStock ? 'Out of stock' : `${v.quantity} in stock`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variant Detail Box */}
          {selectedVariant && (
            <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Product & Variant:</span>
                <span className="font-semibold text-foreground">
                  {product.name} ({selectedVariant.colour} / {selectedVariant.size})
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
                <span className="text-muted-foreground">Default Selling Price:</span>
                <span className="font-semibold text-muted-foreground">
                  {formatIndianRupees(selectedVariant.selling_price)}
                </span>
              </div>
            </div>
          )}

          {/* 3. Pricing, Discount & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden h-11">
                <button
                  type="button"
                  disabled={qty <= 1}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                  className="px-3 h-full hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="px-3 h-full hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selling Price (Can be negotiated) */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Selling Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
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
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-border bg-card font-bold text-sm outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>
            </div>

            {/* Line Discount */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Discount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold">
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
                  className="w-full h-11 pl-7 pr-3 rounded-xl border border-border bg-card font-bold text-sm outline-hidden focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Line summary */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60">
            <div>
              <span className="text-xs text-muted-foreground block">Line Total</span>
              <span className="text-xs text-sky-700 dark:text-sky-300 font-medium">
                {qty} × {formatIndianRupees(unitPrice)}
                {discountVal > 0 && ` - ${formatIndianRupees(discountVal)} discount`}
              </span>
            </div>
            <RupeeDisplay amount={lineNet} size="lg" className="text-sky-700 dark:text-sky-300" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedVariant || remainingStock <= 0}
            onClick={handleAdd}
            className="flex-1 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ADD TO BILL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
