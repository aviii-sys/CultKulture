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
} from 'lucide-react';
import { CartItem, PaymentMode } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { RupeeDisplay } from '@/components/common/rupee-display';

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
  onUpdatePrice,
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

  // Calculations
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

  // Internal profit estimate
  const estimatedCost = cart.reduce(
    (sum, item) => sum + item.qty * item.cost_price,
    0
  );
  const estimatedProfit = grandTotal - estimatedCost;

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
      {/* Cart Header */}
      <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
            {cart.length}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Current Sale</h3>
            <p className="text-[11px] text-muted-foreground">
              {cart.length === 0
                ? 'Cart is empty'
                : `${cart.reduce((s, i) => s + i.qty, 0)} items in bill`}
            </p>
          </div>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-[160px] max-h-[380px] sm:max-h-none">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-secondary/60 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">No items added to bill yet</p>
            <p className="text-xs max-w-xs">
              Search products on the left and select color/size to add to this bill.
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const lineGross = item.qty * item.unit_selling_price;
            const lineNet = Math.max(0, lineGross - (item.line_discount || 0));

            return (
              <div
                key={item.variant_id}
                className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background/80 transition-all space-y-2.5 shadow-2xs"
              >
                {/* Product Name, Variant Badge & Delete */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground leading-tight">
                      {item.product_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-foreground">
                        {item.colour}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300">
                        {item.size}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-1">
                        (Stock: {item.available_stock})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.variant_id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Line Item Controls: Qty, Price, Discount */}
                <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-border/50 text-xs">
                  {/* Quantity Stepper */}
                  <div className="col-span-4 flex items-center border border-border rounded-lg bg-card overflow-hidden h-8">
                    <button
                      type="button"
                      disabled={item.qty <= 1}
                      onClick={() => onUpdateQty(item.variant_id, item.qty - 1)}
                      className="px-2 h-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.qty}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value.replace(/\D/g, ''), 10) || 1;
                        onUpdateQty(item.variant_id, parsed);
                      }}
                      className="w-full text-center font-bold text-xs bg-transparent outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={item.qty >= item.available_stock}
                      onClick={() => onUpdateQty(item.variant_id, item.qty + 1)}
                      className="px-2 h-full hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Negotiated Selling Price Input */}
                  <div className="col-span-4 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-[11px]">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      title="Selling price per unit for this bill"
                      value={item.unit_selling_price}
                      onChange={(e) => {
                        const clean = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        onUpdatePrice(item.variant_id, clean);
                      }}
                      className="w-full h-8 pl-5 pr-1.5 rounded-lg border border-border bg-card font-bold text-xs text-right outline-hidden focus:border-sky-500"
                    />
                  </div>

                  {/* Per-Item Discount */}
                  <div className="col-span-4 relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-[11px]">
                      -₹
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      title="Per-item discount in ₹"
                      placeholder="0"
                      value={item.line_discount || ''}
                      onChange={(e) => {
                        const clean = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        onUpdateDiscount(item.variant_id, clean);
                      }}
                      className="w-full h-8 pl-6 pr-1.5 rounded-lg border border-border bg-card font-bold text-xs text-right outline-hidden focus:border-sky-500 text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>

                {/* Line Total */}
                <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                  <span className="text-[11px]">
                    {item.qty} × {formatIndianRupees(item.unit_selling_price)}
                    {item.line_discount > 0 && ` (-₹${item.line_discount})`}
                  </span>
                  <div className="font-bold text-foreground">
                    <RupeeDisplay amount={lineNet} size="sm" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Footer & Checkout Controls */}
      <div className="p-4 border-t border-border bg-secondary/20 space-y-4">
        {/* Customer Information (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Customer Name (Walk-in)"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-card text-xs font-medium outline-hidden focus:border-sky-500"
            />
          </div>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              placeholder="Phone (e.g. 98765 43210)"
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-card text-xs font-medium outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Payment Mode
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { mode: 'Cash', icon: Banknote },
                { mode: 'UPI', icon: Smartphone },
                { mode: 'Card', icon: CreditCard },
                { mode: 'Split', icon: Split },
              ] as const
            ).map(({ mode, icon: Icon }) => {
              const isSelected = paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onPaymentModeChange(mode)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                      : 'border-border bg-card hover:bg-secondary text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>

          {/* Split note if selected */}
          {paymentMode === 'Split' && (
            <div className="mt-2 animate-in fade-in duration-150">
              <input
                type="text"
                placeholder="e.g. Cash ₹1000, UPI ₹500"
                value={splitNotes}
                onChange={(e) => onSplitNotesChange(e.target.value)}
                className="w-full h-8 px-3 rounded-lg border border-sky-400 bg-card text-xs outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Bill-Level Discount */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Bill Discount</span>
          </label>
          <div className="relative w-32">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              ₹
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={billDiscount || ''}
              onChange={(e) => {
                const clean = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                onBillDiscountChange(clean);
              }}
              className="w-full h-8 pl-6 pr-2 rounded-lg border border-border bg-card font-bold text-xs text-right outline-hidden focus:border-sky-500"
            />
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatIndianRupees(subtotal)}</span>
          </div>

          {totalItemDiscounts > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>Item Discounts</span>
              <span>-{formatIndianRupees(totalItemDiscounts)}</span>
            </div>
          )}

          {safeBillDiscount > 0 && (
            <div className="flex justify-between text-rose-600 dark:text-rose-400">
              <span>Bill Discount</span>
              <span>-{formatIndianRupees(safeBillDiscount)}</span>
            </div>
          )}

          {totalDiscount > 0 && (
            <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-dashed border-border/40">
              <span>Total Discount</span>
              <span>-{formatIndianRupees(totalDiscount)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold text-foreground">
            <span className="text-sm">Grand Total</span>
            <RupeeDisplay amount={grandTotal} size="xl" className="text-sky-600 dark:text-sky-400" />
          </div>
        </div>

        {/* Profit Preview (Internal Only) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowProfitPreview(!showProfitPreview)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {showProfitPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>{showProfitPreview ? 'Hide' : 'Show'} Internal Profit Preview</span>
          </button>

          {showProfitPreview && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300">
                <span>Estimated Profit</span>
                <RupeeDisplay amount={estimatedProfit} showColor size="sm" />
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Revenue:</span>
                <span>{formatIndianRupees(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Estimated Cost:</span>
                <span>{formatIndianRupees(estimatedCost)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic pt-1 border-t border-amber-500/20">
                Authoritative profit is calculated server-side by create_bill().
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* COMPLETE SALE Button */}
        <button
          type="button"
          disabled={cart.length === 0 || isSubmitting}
          onClick={onCompleteSale}
          className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              <span>COMPLETE SALE • {formatIndianRupees(grandTotal)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
