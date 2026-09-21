'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Package } from 'lucide-react';
import { ProductWithVariants, Variant, CartItem, PaymentMode } from '@/types';
import { PosProductCatalog } from './pos-product-catalog';
import { PosVariantPickerModal } from './pos-variant-picker-modal';
import { PosCart } from './pos-cart';
import { PosSuccessModal } from './pos-success-modal';
import { createBillAction } from '@/lib/actions/billing-actions';
import { createClient } from '@/lib/supabase/client';
import { formatIndianRupees } from '@/lib/utils/currency';

interface PosScreenProps {
  initialProducts: ProductWithVariants[];
}

export function PosScreen({ initialProducts }: PosScreenProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Cart Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [splitNotes, setSplitNotes] = useState('');
  const [billDiscount, setBillDiscount] = useState<number>(0);

  // Status & Modals
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBillData, setSuccessBillData] = useState<{
    bill_id: string;
    bill_number: string;
    total: number;
    customer_name?: string;
    payment_mode?: string;
  } | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  // Mobile view tab: 'catalog' | 'cart'
  const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Supabase Realtime stock synchronization
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('realtime_variants_pos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variants' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Variant;
            setProducts((prevProducts) =>
              prevProducts.map((p) => ({
                ...p,
                variants: p.variants.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)),
              }))
            );

            // Also update available stock in current cart if present
            setCart((prevCart) =>
              prevCart.map((item) =>
                item.variant_id === updated.id
                  ? {
                      ...item,
                      available_stock: updated.quantity,
                      qty: Math.min(item.qty, updated.quantity),
                    }
                  : item
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Open variant picker
  const handleSelectProduct = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setIsPickerOpen(true);
  };

  // Add selected variant to cart
  const handleAddToCart = (item: {
    variant: Variant;
    product: ProductWithVariants;
    qty: number;
    unit_selling_price: number;
    line_discount: number;
  }) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((i) => i.variant_id === item.variant.id);

      if (existingIdx >= 0) {
        // Update existing item
        const updated = [...prevCart];
        const existing = updated[existingIdx];
        const newQty = Math.min(
          existing.qty + item.qty,
          item.variant.quantity
        );

        updated[existingIdx] = {
          ...existing,
          qty: newQty,
          unit_selling_price: item.unit_selling_price,
          line_discount: (existing.line_discount || 0) + (item.line_discount || 0),
          available_stock: item.variant.quantity,
        };
        return updated;
      } else {
        // Add new cart item
        const newItem: CartItem = {
          variant_id: item.variant.id,
          product_id: item.product.id,
          product_name: item.product.name,
          colour: item.variant.colour,
          size: item.variant.size,
          qty: item.qty,
          available_stock: item.variant.quantity,
          unit_selling_price: item.unit_selling_price,
          line_discount: item.line_discount,
          cost_price: item.variant.cost_price,
        };
        return [...prevCart, newItem];
      }
    });

    setErrorMessage(null);
  };

  // Cart operations
  const handleUpdateQty = (variantId: string, newQty: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.variant_id !== variantId) return item;
        const cappedQty = Math.max(1, Math.min(newQty, item.available_stock));
        // Also ensure line_discount does not exceed new gross
        const maxGross = cappedQty * item.unit_selling_price;
        return {
          ...item,
          qty: cappedQty,
          line_discount: Math.min(item.line_discount, maxGross),
        };
      })
    );
  };

  const handleUpdatePrice = (variantId: string, newPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.variant_id !== variantId) return item;
        const safePrice = Math.max(0, newPrice);
        const maxGross = item.qty * safePrice;
        return {
          ...item,
          unit_selling_price: safePrice,
          line_discount: Math.min(item.line_discount, maxGross),
        };
      })
    );
  };

  const handleUpdateDiscount = (variantId: string, newDiscount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.variant_id !== variantId) return item;
        const lineGross = item.qty * item.unit_selling_price;
        const safeDiscount = Math.max(0, Math.min(newDiscount, lineGross));
        return {
          ...item,
          line_discount: safeDiscount,
        };
      })
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prev) => prev.filter((i) => i.variant_id !== variantId));
  };

  const handleClearCart = () => {
    setCart([]);
    setBillDiscount(0);
    setErrorMessage(null);
  };

  // Complete Sale (invoke atomic create_bill via server action)
  const handleCompleteSale = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the bill.');
      return;
    }

    // Verify stock client-side first
    for (const item of cart) {
      if (item.qty > item.available_stock) {
        setErrorMessage(
          `Insufficient stock for ${item.product_name} (${item.colour} / ${item.size}). Available: ${item.available_stock}, Requested: ${item.qty}.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customer_name: customerName.trim() || 'Walk-in Customer',
        phone: customerPhone.trim() || null,
        payment_mode: paymentMode,
        bill_discount: billDiscount || 0,
        notes: paymentMode === 'Split' ? splitNotes.trim() : null,
        items: cart.map((i) => ({
          variant_id: i.variant_id,
          qty: i.qty,
          unit_selling_price: i.unit_selling_price,
          line_discount: i.line_discount || 0,
        })),
      };

      const result = await createBillAction(payload);

      if (result.error) {
        setErrorMessage(result.error);
        setIsSubmitting(false);
        return;
      }

      if (result.success && result.data) {
        setSuccessBillData({
          bill_id: result.data.bill_id,
          bill_number: result.data.bill_number,
          total: result.data.total,
          customer_name: customerName.trim() || 'Walk-in Customer',
          payment_mode: paymentMode,
        });
        setIsSuccessOpen(true);

        // Deduct stock locally immediately
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            variants: p.variants.map((v) => {
              const sold = cart.find((c) => c.variant_id === v.id);
              return sold ? { ...v, quantity: v.quantity - sold.qty } : v;
            }),
          }))
        );
      }
    } catch (err: unknown) {
      console.error('Error completing sale:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred during sale creation.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset for next sale
  const handleNewBill = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMode('Cash');
    setSplitNotes('');
    setBillDiscount(0);
    setErrorMessage(null);
    setIsSuccessOpen(false);
    setActiveMobileTab('catalog');
  };

  // Navigate to bill detail
  const handleViewBill = (billId: string) => {
    setIsSuccessOpen(false);
    router.push(`/bills?id=${billId}`);
  };

  // Existing cart quantity for selected product
  const existingCartQtyForProduct = selectedProduct
    ? cart
        .filter((c) => c.product_id === selectedProduct.id)
        .reduce((sum, c) => sum + c.qty, 0)
    : 0;

  // Cart summary totals
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.qty * item.unit_selling_price, 0);
  const cartItemDiscounts = cart.reduce((sum, item) => sum + (item.line_discount || 0), 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - cartItemDiscounts - (billDiscount || 0));

  return (
    <div className="space-y-4">
      {/* Mobile Tab Toggle */}
      <div className="md:hidden flex rounded-xl bg-secondary p-1 border border-border">
        <button
          type="button"
          onClick={() => setActiveMobileTab('catalog')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeMobileTab === 'catalog'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
            activeMobileTab === 'cart'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cartItemCount})</span>
          {cartItemCount > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-sky-600 text-white ml-1">
              {formatIndianRupees(cartGrandTotal)}
            </span>
          )}
        </button>
      </div>

      {/* Main Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search & Catalog (60-65% width on desktop) */}
        <div
          className={`lg:col-span-7 xl:col-span-8 ${
            activeMobileTab === 'cart' ? 'hidden md:block' : 'block'
          }`}
        >
          <PosProductCatalog
            products={products}
            onSelectProduct={handleSelectProduct}
          />
        </div>

        {/* Right Column: Sticky Cart & Checkout (35-40% width on desktop) */}
        <div
          className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 ${
            activeMobileTab === 'catalog' ? 'hidden md:block' : 'block'
          }`}
        >
          <PosCart
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onUpdatePrice={handleUpdatePrice}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            paymentMode={paymentMode}
            onPaymentModeChange={setPaymentMode}
            splitNotes={splitNotes}
            onSplitNotesChange={setSplitNotes}
            billDiscount={billDiscount}
            onBillDiscountChange={setBillDiscount}
            onCompleteSale={handleCompleteSale}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      {/* Variant Picker Modal */}
      <PosVariantPickerModal
        product={selectedProduct}
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onAddToCart={handleAddToCart}
        existingCartQty={existingCartQtyForProduct}
      />

      {/* Sale Success Modal */}
      <PosSuccessModal
        isOpen={isSuccessOpen}
        billData={successBillData}
        onNewBill={handleNewBill}
        onViewBill={handleViewBill}
      />
    </div>
  );
}
