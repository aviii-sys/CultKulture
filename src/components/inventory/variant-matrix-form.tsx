'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Boxes,
  Check,
} from 'lucide-react';
import { addStockBatchAction } from '@/lib/actions/inventory-actions';
import { Product, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { getCurrentISTDateString } from '@/lib/utils/dates';

interface VariantRowState {
  id: string; // client temporary id
  colour: string;
  size: string;
  qty: string;
  cost_price: string;
  selling_price: string;
  low_stock_threshold: string;
  supplier: string;
  purchase_date: string;
  notes: string;
}

interface VariantMatrixFormProps {
  existingProducts: (Product & { variants: Variant[] })[];
}

export function VariantMatrixForm({ existingProducts }: VariantMatrixFormProps) {
  // Step Navigation: 1 = Product Info, 2 = Variants Matrix, 3 = Review Summary
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Mode: new product vs existing product
  const [isNewProduct, setIsNewProduct] = useState<boolean>(existingProducts.length === 0);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    existingProducts[0]?.id || ''
  );

  // New product fields
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');

  // Default date for new purchases
  const defaultDate = getCurrentISTDateString();

  // Variant Rows
  const [rows, setRows] = useState<VariantRowState[]>([
    {
      id: 'row-1',
      colour: '',
      size: '',
      qty: '',
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '2',
      supplier: '',
      purchase_date: defaultDate,
      notes: '',
    },
  ]);

  // Submission & Results
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    productName: string;
    variants: Array<{ colour: string; size: string; qty_added: number; new_cost: number }>;
  } | null>(null);

  // Selected existing product object
  const activeExistingProduct = existingProducts.find((p) => p.id === selectedProductId);

  // Add new variant row
  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    const newRow: VariantRowState = {
      id: `row-${Date.now()}-${Math.random()}`,
      colour: lastRow?.colour || '',
      size: '',
      qty: '',
      cost_price: lastRow?.cost_price || '',
      selling_price: lastRow?.selling_price || '',
      low_stock_threshold: lastRow?.low_stock_threshold || '2',
      supplier: lastRow?.supplier || '',
      purchase_date: lastRow?.purchase_date || defaultDate,
      notes: '',
    };
    setRows([...rows, newRow]);
  };

  // Duplicate row
  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const duplicated: VariantRowState = {
      ...target,
      id: `row-${Date.now()}-${Math.random()}`,
    };
    const next = [...rows];
    next.splice(index + 1, 0, duplicated);
    setRows(next);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  // Update single field
  const updateRow = (index: number, field: keyof VariantRowState, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Pick existing variant to prefill
  const handlePickExistingVariant = (variant: Variant, rowIndex: number = 0) => {
    updateRow(rowIndex, 'colour', variant.colour);
    updateRow(rowIndex, 'size', variant.size);
    updateRow(rowIndex, 'cost_price', String(variant.cost_price));
    updateRow(rowIndex, 'selling_price', String(variant.selling_price));
    updateRow(rowIndex, 'low_stock_threshold', String(variant.low_stock_threshold ?? 2));
  };

  // Validate Step 1
  const handleProceedToStep2 = () => {
    setErrorMessage(null);
    if (isNewProduct) {
      if (!productName.trim()) {
        setErrorMessage('Product name is required.');
        return;
      }
      if (!category.trim()) {
        setErrorMessage('Category is required.');
        return;
      }
    } else {
      if (!selectedProductId) {
        setErrorMessage('Please select an existing product.');
        return;
      }
    }
    setCurrentStep(2);
  };

  // Validate Step 2
  const handleProceedToStep3 = () => {
    setErrorMessage(null);
    const duplicatesCheck = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.colour.trim()) {
        setErrorMessage(`Row ${i + 1}: Colour is required.`);
        return;
      }
      if (!r.size.trim()) {
        setErrorMessage(`Row ${i + 1}: Size is required.`);
        return;
      }
      const qtyNum = Number(r.qty);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        setErrorMessage(`Row ${i + 1} (${r.colour}/${r.size}): Quantity must be greater than 0.`);
        return;
      }
      const costNum = Number(r.cost_price);
      if (isNaN(costNum) || costNum < 0) {
        setErrorMessage(`Row ${i + 1} (${r.colour}/${r.size}): Cost price cannot be negative.`);
        return;
      }
      const sellingNum = Number(r.selling_price);
      if (isNaN(sellingNum) || sellingNum < 0) {
        setErrorMessage(`Row ${i + 1} (${r.colour}/${r.size}): Selling price cannot be negative.`);
        return;
      }

      const key = `${r.colour.toLowerCase().trim()}:::${r.size.toLowerCase().trim()}`;
      if (duplicatesCheck.has(key)) {
        setErrorMessage(
          `Duplicate variant in form: "${r.colour} / ${r.size}" is listed multiple times. Please combine quantities into one row.`
        );
        return;
      }
      duplicatesCheck.add(key);
    }

    setCurrentStep(3);
  };

  // Handle final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload = {
      isNewProduct,
      productId: isNewProduct ? null : selectedProductId,
      productName: isNewProduct ? productName.trim() : activeExistingProduct?.name,
      category: isNewProduct ? category.trim() : activeExistingProduct?.category,
      brand: isNewProduct ? brand.trim() || null : activeExistingProduct?.brand || null,
      variants: rows.map((r) => ({
        colour: r.colour.trim(),
        size: r.size.trim(),
        qty: Number(r.qty),
        cost_price: Number(r.cost_price),
        selling_price: Number(r.selling_price),
        low_stock_threshold: Number(r.low_stock_threshold) || 2,
        supplier: r.supplier.trim() || null,
        purchase_date: r.purchase_date || null,
        notes: r.notes.trim() || null,
      })),
    };

    const res = await addStockBatchAction(payload as any);
    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      const responseData = res.data as any;
      setSuccessData({
        productName: isNewProduct ? productName.trim() : activeExistingProduct?.name || 'Product',
        variants: (responseData?.variants || []).map((v: any) => ({
          colour: v.colour,
          size: v.size,
          qty_added: v.qty_added,
          new_cost: v.new_cost,
        })),
      });
    }
  };

  const handleResetForm = () => {
    setSuccessData(null);
    setProductName('');
    setCategory('');
    setBrand('');
    setCurrentStep(1);
    setRows([
      {
        id: `row-${Date.now()}`,
        colour: '',
        size: '',
        qty: '',
        cost_price: '',
        selling_price: '',
        low_stock_threshold: '2',
        supplier: '',
        purchase_date: defaultDate,
        notes: '',
      },
    ]);
  };

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border border-border/80 bg-card shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-2xs border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Stock Added Successfully!</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Inventory levels and weighted-average costs updated for <strong className="text-foreground">{successData.productName}</strong>.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/80 text-left space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Added Variants Breakdown
          </span>
          <div className="divide-y divide-border/60">
            {successData.variants.map((v, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{v.colour} / {v.size}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{v.qty_added} units
                  </span>
                  <span className="text-muted-foreground">
                    Weighted Cost: <strong>{formatIndianRupees(v.new_cost)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs min-h-[44px]"
          >
            + Add More Stock
          </button>
          <Link
            href="/inventory"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-semibold bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors min-h-[44px] flex items-center justify-center"
          >
            View Inventory
          </Link>
        </div>
      </div>
    );
  }

  // Active product name for review
  const activeName = isNewProduct ? productName.trim() : activeExistingProduct?.name;
  const activeCat = isNewProduct ? category.trim() : activeExistingProduct?.category;
  const activeBrd = isNewProduct ? brand.trim() : activeExistingProduct?.brand;

  const totalQtyToAdd = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
  const totalInvestment = rows.reduce(
    (s, r) => s + (Number(r.qty) || 0) * (Number(r.cost_price) || 0),
    0
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Stock Collection
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add a new fashion piece or restock existing inventory with weighted cost averaging.
          </p>
        </div>
        <Link
          href="/inventory"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline self-start sm:self-auto"
        >
          Cancel & Return
        </Link>
      </div>

      {/* Guided 3-Step Progress Header */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-secondary/50 border border-border/80 text-xs font-bold select-none">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            currentStep === 1
              ? 'bg-card text-foreground shadow-2xs font-extrabold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            1
          </span>
          <span className="truncate">Product</span>
        </button>

        <button
          type="button"
          onClick={() => (productName.trim() || selectedProductId) && setCurrentStep(2)}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            currentStep === 2
              ? 'bg-card text-foreground shadow-2xs font-extrabold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            2
          </span>
          <span className="truncate">Variants</span>
        </button>

        <button
          type="button"
          onClick={() => rows[0]?.colour && setCurrentStep(3)}
          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            currentStep === 3
              ? 'bg-card text-foreground shadow-2xs font-extrabold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
            3
          </span>
          <span className="truncate">Review</span>
        </button>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="leading-relaxed font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Product Definition */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                Step 1: Product Foundation
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Define the apparel piece or choose an existing piece to restock.
              </p>
            </div>

            {existingProducts.length > 0 && (
              <div className="flex items-center rounded-xl bg-secondary p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setIsNewProduct(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    !isNewProduct
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Existing Piece
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewProduct(true)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    isNewProduct
                      ? 'bg-card text-foreground shadow-2xs font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  + New Piece
                </button>
              </div>
            )}
          </div>

          {!isNewProduct && existingProducts.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Pick Existing Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  {existingProducts
                    .filter((p) => !p.archived)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category}) {p.brand ? `[${p.brand}]` : ''} — {p.variants.length} existing variants
                      </option>
                    ))}
                </select>
              </div>

              {activeExistingProduct && activeExistingProduct.variants.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                    Existing Variants (Tap to prefill first row):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeExistingProduct.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handlePickExistingVariant(v, 0)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-secondary text-[11px] font-medium transition-colors"
                      >
                        {v.colour} / {v.size} (Stock: {v.quantity}, Avg Cost: {formatIndianRupees(v.cost_price)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Leather Jacket"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Jackets, Shirts"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Brand (Optional)
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Cult Kulture"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border/60 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToStep2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Continue to Variants (Step 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Variants Matrix */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="p-6 rounded-3xl border border-border/80 bg-card space-y-5 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                Step 2: Variant Matrix ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Define colour, size, stock quantity, cost, and selling rates.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 border border-border/60 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="p-4 rounded-2xl border border-border/80 bg-secondary/25 space-y-3 relative group"
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-extrabold text-foreground text-xs">
                    Variant #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateRow(index)}
                      title="Duplicate row"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        title="Delete row"
                        className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Colour *
                    </label>
                    <input
                      type="text"
                      required
                      value={row.colour}
                      onChange={(e) => updateRow(index, 'colour', e.target.value)}
                      placeholder="e.g. Black"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Size *
                    </label>
                    <input
                      type="text"
                      required
                      value={row.size}
                      onChange={(e) => updateRow(index, 'size', e.target.value)}
                      placeholder="e.g. M, L, XL"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Qty to Add *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      required
                      value={row.qty}
                      onChange={(e) => updateRow(index, 'qty', e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Cost Price (₹) *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      required
                      value={row.cost_price}
                      onChange={(e) => updateRow(index, 'cost_price', e.target.value)}
                      placeholder="1600"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      required
                      value={row.selling_price}
                      onChange={(e) => updateRow(index, 'selling_price', e.target.value)}
                      placeholder="2000"
                      className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Product</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToStep3}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Review Collection (Step 3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Review & Stock Confirmation */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card space-y-6 shadow-2xs animate-in fade-in duration-150">
          <div className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Check className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-base text-foreground">
                Step 3: Review Collection Summary
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verify your inventory batches before atomically updating the store catalog.
            </p>
          </div>

          {/* Product Overview Card */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/70 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {activeBrd || activeCat}
              </span>
              <h4 className="text-base font-extrabold text-foreground">{activeName}</h4>
              <span className="text-xs text-muted-foreground">Category: {activeCat}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Total Units
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                +{totalQtyToAdd} units
              </span>
            </div>
          </div>

          {/* Variants Table Review */}
          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Colour / Size</th>
                  <th className="p-3 text-right">Qty to Add</th>
                  <th className="p-3 text-right">Cost Price</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3 text-right">Est. Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold">
                {rows.map((r, i) => {
                  const qty = Number(r.qty) || 0;
                  const cost = Number(r.cost_price) || 0;
                  const sell = Number(r.selling_price) || 0;
                  const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : 0;

                  return (
                    <tr key={i} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-3 font-bold text-foreground">
                        {r.colour} / {r.size}
                      </td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        +{qty}
                      </td>
                      <td className="p-3 text-right text-muted-foreground">
                        {formatIndianRupees(cost)}
                      </td>
                      <td className="p-3 text-right text-foreground font-bold">
                        {formatIndianRupees(sell)}
                      </td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Investment Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/60 text-xs">
            <span className="text-muted-foreground font-semibold">
              Total Purchase Investment:
            </span>
            <span className="font-black text-sm text-foreground">
              {formatIndianRupees(totalInvestment)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modify Variants</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-opacity min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Stocking Collection...</span>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4" />
                  <span>Confirm & Stock Inventory</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
