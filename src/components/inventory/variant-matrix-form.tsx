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
    // Copy cost, selling, supplier from previous row for high-speed counter entry convenience
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

  // Duplicate a specific row
  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const duplicated: VariantRowState = {
      ...target,
      id: `row-${Date.now()}-${Math.random()}`,
      size: '', // clear size so user can enter the next size easily
    };
    const newRows = [...rows];
    newRows.splice(index + 1, 0, duplicated);
    setRows(newRows);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, idx) => idx !== index));
  };

  // Update row field
  const updateRow = (index: number, field: keyof VariantRowState, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  // Pre-fill fields if user picks an existing variant from existing product
  const handlePickExistingVariant = (variant: Variant, rowIndex: number) => {
    const updated = [...rows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      colour: variant.colour,
      size: variant.size,
      cost_price: variant.cost_price.toString(),
      selling_price: variant.selling_price.toString(),
      low_stock_threshold: variant.low_stock_threshold.toString(),
    };
    setRows(updated);
  };

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Product details
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

    // 2. Validate Variant Rows
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

      // Check for duplicate in the same form submission
      const key = `${r.colour.toLowerCase().trim()}:::${r.size.toLowerCase().trim()}`;
      if (duplicatesCheck.has(key)) {
        setErrorMessage(
          `Duplicate variant in form: "${r.colour} / ${r.size}" is listed multiple times. Please combine quantities into one row.`
        );
        return;
      }
      duplicatesCheck.add(key);
    }

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

  // Success screen
  if (successData) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-lg text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Stock Added Successfully!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Inventory levels and weighted-average costs updated for <strong className="text-foreground">{successData.productName}</strong>.
          </p>
        </div>

        {/* Variants Added Summary */}
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 text-left space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Added Variants Breakdown
          </span>
          <div className="divide-y divide-border/60">
            {successData.variants.map((v, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm min-h-[48px]"
          >
            + Add More Stock
          </button>
          <Link
            href="/inventory"
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors min-h-[48px] flex items-center justify-center"
          >
            View Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            Add Stock & Variants
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Add a new product or restock existing inventory with weighted average cost calculation.
          </p>
        </div>
        <Link
          href="/inventory"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground underline self-start sm:self-auto"
        >
          Cancel & Back to Inventory
        </Link>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Step 1: Product Selection or Creation */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs">
              1
            </span>
            <h3 className="font-bold text-sm sm:text-base text-foreground">Select or Create Product</h3>
          </div>

          {/* Mode Switch Pills */}
          {existingProducts.length > 0 && (
            <div className="flex items-center rounded-xl bg-secondary/80 p-1 border border-border/80 text-xs">
              <button
                type="button"
                onClick={() => setIsNewProduct(false)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  !isNewProduct
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Existing Product
              </button>
              <button
                type="button"
                onClick={() => setIsNewProduct(true)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  isNewProduct
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                + New Product
              </button>
            </div>
          )}
        </div>

        {/* Existing Product Dropdown */}
        {!isNewProduct && existingProducts.length > 0 ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Pick Existing Product *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
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

            {/* Existing Variants Pill list for quick prefill */}
            {activeExistingProduct && activeExistingProduct.variants.length > 0 && (
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground block mb-2">
                  Existing Variants on {activeExistingProduct.name} (Tap to fill first row):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeExistingProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handlePickExistingVariant(v, 0)}
                      className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:border-sky-300 dark:hover:border-sky-800 text-[11px] font-medium transition-colors"
                      title="Prefill first row with this variant"
                    >
                      {v.colour} / {v.size} (Stock: {v.quantity}, Avg Cost: {formatIndianRupees(v.cost_price)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* New Product Inputs */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
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
                placeholder="e.g. Zara, Cult, XYZ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Multi-variant Matrix */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs">
              2
            </span>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              Variants Matrix ({rows.length} {rows.length === 1 ? 'row' : 'rows'})
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Variant Row</span>
          </button>
        </div>

        {/* Dynamic Rows */}
        <div className="space-y-3.5">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="p-4 rounded-2xl border border-border/90 bg-muted/20 space-y-3 relative group"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-bold text-foreground">Variant #{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateRow(index)}
                    title="Duplicate this row"
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

              {/* Primary Fields: Colour, Size, Qty, Cost, Selling */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Colour *
                  </label>
                  <input
                    type="text"
                    required
                    value={row.colour}
                    onChange={(e) => updateRow(index, 'colour', e.target.value)}
                    placeholder="e.g. Black"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Size *
                  </label>
                  <input
                    type="text"
                    required
                    value={row.size}
                    onChange={(e) => updateRow(index, 'size', e.target.value)}
                    placeholder="e.g. M, L, XL"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
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
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    required
                    value={row.cost_price}
                    onChange={(e) => updateRow(index, 'cost_price', e.target.value)}
                    placeholder="₹1600"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    required
                    value={row.selling_price}
                    onChange={(e) => updateRow(index, 'selling_price', e.target.value)}
                    placeholder="₹2000"
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Secondary Audit Fields (Optional): Supplier, Date, Notes, Low Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Low-Stock Alert
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={row.low_stock_threshold}
                    onChange={(e) => updateRow(index, 'low_stock_threshold', e.target.value)}
                    placeholder="2"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={row.supplier}
                    onChange={(e) => updateRow(index, 'supplier', e.target.value)}
                    placeholder="Wholesaler"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={row.purchase_date}
                    onChange={(e) => updateRow(index, 'purchase_date', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1">
                    Batch Notes
                  </label>
                  <input
                    type="text"
                    value={row.notes}
                    onChange={(e) => updateRow(index, 'notes', e.target.value)}
                    placeholder="Invoice # or remark"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Row Button at Bottom */}
        <button
          type="button"
          onClick={handleAddRow}
          className="w-full py-3 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:border-sky-500 hover:bg-muted/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-sky-500" />
          <span>+ Add Another Variant Row</span>
        </button>
      </div>

      {/* Sticky Bottom Submit Bar */}
      <div className="sticky bottom-16 md:bottom-4 z-30 p-4 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground hidden sm:block">
          Adding <strong className="text-foreground">{rows.length}</strong> variant {rows.length === 1 ? 'row' : 'rows'}. Stock will be updated atomically.
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/inventory"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-sm min-h-[44px] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <span>Save & Update Inventory</span>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
