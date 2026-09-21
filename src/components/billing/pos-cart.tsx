'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  User,
  Phone,
  Tag,
  Receipt,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { CartItem, PaymentMode } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';

interface PosCartProps {
  cart: CartItem[];
  onUpdateQty: (variantId: string, newQty: number) => void;
  onUpdatePrice: (variantId: string, newPrice: number) => void;
  onUpdateDiscount: (variantId: string, newDiscount: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  paymentMode: PaymentMode;
  onPaymentModeChange: (val: PaymentMode) => void;
  splitNotes: string;
  onSplitNotesChange: (val: string) => void;
  billDiscount: number;
  onBillDiscountChange: (val: number) => void;
  onCompleteSale: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function PosCart({
  cart,
  onUpdateQty,
  onUpdatePrice: _onUpdatePrice,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  paymentMode,
  onPaymentModeChange,
  splitNotes,
  onSplitNotesChange,
  billDiscount,
  onBillDiscountChange,
  onCompleteSale,
  isSubmitting,
  errorMessage,
}: PosCartProps) {
  const [showProfitPreview, setShowProfitPreview] = useState(false);

  // Financial Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.qty * item.unit_selling_price,
    0
  );
  const totalItemDiscounts = cart.reduce(
    (sum, item) => sum + (item.line_discount || 0),
    0
  );
  const netAfterItemDiscounts = Math.max(0, subtotal - totalItemDiscounts);
  const safeBillDiscount = Math.min(billDiscount || 0, netAfterItemDiscounts);
  const totalDiscount = totalItemDiscounts + safeBillDiscount;
  const grandTotal = Math.max(0, netAfterItemDiscounts - safeBillDiscount);

  // Internal profit estimate for owner
  const estimatedCost = cart.reduce(
    (sum, item) => sum + item.qty * item.cost_price,
    0
  );
  const estimatedProfit = grandTotal - estimatedCost;

  return (
    <div className="flex flex-col h-full bg-card rounded-3xl border border-border/80 overflow-hidden shadow-2xs">
      {/* Cart Drawer Header */}
      <div className="p-4 border-b border-border/70 bg-secondary/30 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-2xs">
            {cart.length}
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-foreground">
              Current Sale Cart
            </h3>
            <span className="text-[10px] text-muted-foreground font-medium">
              {cart.reduce((s, i) => s + i.qty, 0)} total units selected
            </span>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            disabled={isSubmitting}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2.5 select-none">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/50">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-foreground/80">Cart is currently empty</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Select garments from the collection on the left to start billing.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const lineGross = item.qty * item.unit_selling_price;
            const lineNet = Math.max(0, lineGross - (item.line_discount || 0));

            return (
              <div
                key={item.variant_id}
                className="p-3.5 rounded-2xl border border-border/80 bg-secondary/20 space-y-2.5 transition-all"
              >
                {/* Product Title & Variant Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-foreground truncate">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      <span className="font-bold px-1.5 py-0.5 rounded-md bg-secondary text-foreground">
                        {item.colour}
                      </span>
                      <span>/</span>
                      <span className="font-bold px-1.5 py-0.5 rounded-md bg-secondary text-foreground">
                        {item.size}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variant_id)}
                    disabled={isSubmitting}
                    className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stepper, Unit Rate & Total */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Quantity Stepper (Min 44px touch) */}
                  <div className="flex items-center rounded-xl border border-border/90 bg-background p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.variant_id, item.qty - 1)}
                      disabled={isSubmitting || item.qty <= 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center font-black text-xs text-foreground tabular-nums">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.variant_id, item.qty + 1)}
                      disabled={isSubmitting || item.qty >= item.available_stock}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <span className="text-xs font-black text-foreground tabular-nums">
                      {formatIndianRupees(lineNet)}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      @{formatIndianRupees(item.unit_selling_price)}
                    </span>
                  </div>
                </div>

                {/* Bargain Adjustment / Line Discount Drawer */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[10px]">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground font-semibold">Disc / Piece:</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={item.unit_selling_price}
                      value={item.line_discount || ''}
                      onChange={(e) => onUpdateDiscount(item.variant_id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16 h-6 px-1.5 rounded-md border border-input bg-background text-right font-bold text-[11px] focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer & Checkout Form Section */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-border/80 bg-secondary/20 space-y-4">
          {/* Customer Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="tel"
                placeholder="Phone (for WhatsApp bill)"
                value={customerPhone}
                onChange={(e) => onCustomerPhoneChange(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Payment Method
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold select-none">
              {(['Cash', 'UPI', 'Card', 'Split'] as PaymentMode[]).map((mode) => {
                const isSelected = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onPaymentModeChange(mode)}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-2xs font-extrabold'
                        : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                    {mode === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                    {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                    {mode === 'Split' && <Split className="w-3.5 h-3.5" />}
                    <span className="text-[10px]">{mode}</span>
                  </button>
                );
              })}
            </div>

            {paymentMode === 'Split' && (
              <input
                type="text"
                placeholder="Split notes (e.g. ₹2,000 Cash + ₹4,400 UPI)"
                value={splitNotes}
                onChange={(e) => onSplitNotesChange(e.target.value)}
                className="w-full h-8 px-3 mt-2 rounded-xl border border-input bg-background text-xs font-medium focus:outline-hidden"
              />
            )}
          </div>

          {/* Bill-level Flat Discount */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-semibold text-muted-foreground">Overall Bill Discount:</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-muted-foreground">₹</span>
              <input
                type="number"
                min="0"
                max={netAfterItemDiscounts}
                value={billDiscount || ''}
                onChange={(e) => onBillDiscountChange(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 h-7 px-2 rounded-lg border border-input bg-background text-right font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Financial Totals Summary */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Gross Subtotal:</span>
              <span>{formatIndianRupees(subtotal)}</span>
            </div>

            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>Total Discounts:</span>
                <span>-{formatIndianRupees(totalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-border/60">
              <span className="font-extrabold text-sm text-foreground">Total Due:</span>
              <span className="text-xl font-black text-foreground tracking-tight">
                {formatIndianRupees(grandTotal)}
              </span>
            </div>

            {/* Owner Profit Estimate Toggle */}
            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowProfitPreview(!showProfitPreview)}
                className="flex items-center gap-1 font-semibold hover:text-foreground transition-colors cursor-pointer"
              >
                {showProfitPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showProfitPreview ? 'Hide Cost/Profit' : 'Owner Profit Estimate'}</span>
              </button>

              {showProfitPreview && (
                <span className={`font-bold ${estimatedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  Est. Net Profit: {formatIndianRupees(estimatedProfit)}
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary CTA: Complete Sale */}
          <button
            type="button"
            onClick={onCompleteSale}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary text-primary-foreground font-black text-sm tracking-wide flex items-center justify-center gap-2 shadow-xs hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Completing Sale...</span>
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                <span>COMPLETE SALE ({formatIndianRupees(grandTotal)})</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
