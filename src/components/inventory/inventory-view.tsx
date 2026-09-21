'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  X,
  AlertTriangle,
  XCircle,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Archive,
} from 'lucide-react';
import { Product, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { ProductTable, FlatInventoryItem } from './product-table';
import { ProductCardList } from './product-card-list';
import { StockHistoryModal } from './stock-history-modal';
import { EditProductModal } from './edit-product-modal';
import { EditVariantModal } from './edit-variant-modal';
import { QuickRestockModal } from './quick-restock-modal';

interface InventoryViewProps {
  initialProducts: (Product & { variants: Variant[] })[];
}

export function InventoryView({ initialProducts }: InventoryViewProps) {
  const [products] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedColour, setSelectedColour] = useState<string>('ALL');
  const [selectedSize, setSelectedSize] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal states
  const [historyTarget, setHistoryTarget] = useState<{ variant: Variant; product: Product } | null>(
    null
  );
  const [restockTarget, setRestockTarget] = useState<{ variant: Variant; product: Product } | null>(
    null
  );
  const [editVariantTarget, setEditVariantTarget] = useState<{
    variant: Variant;
    product: Product;
  } | null>(null);
  const [editProductTarget, setEditProductTarget] = useState<Product | null>(null);

  // Flatten products and variants for searchable list
  const flatItems: FlatInventoryItem[] = useMemo(() => {
    const list: FlatInventoryItem[] = [];
    products.forEach((p) => {
      // If not showing archived, ignore archived products
      if (!showArchived && p.archived) return;

      p.variants.forEach((v) => {
        if (!showArchived && v.archived) return;
        list.push({ product: p, variant: v });
      });
    });
    return list;
  }, [products, showArchived]);

  // Extract unique categories, colours, and sizes
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const colours = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.colour) set.add(v.colour);
      });
    });
    return Array.from(set).sort();
  }, [products]);

  const sizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.size) set.add(v.size);
      });
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter items based on active search & filters
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return flatItems.filter(({ product, variant }) => {
      // 1. Search Query
      if (q) {
        const matchName = product.name.toLowerCase().includes(q);
        const matchBrand = product.brand ? product.brand.toLowerCase().includes(q) : false;
        const matchCategory = product.category.toLowerCase().includes(q);
        const matchColour = variant.colour.toLowerCase().includes(q);
        const matchSize = variant.size.toLowerCase().includes(q);

        if (!matchName && !matchBrand && !matchCategory && !matchColour && !matchSize) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Colour Filter
      if (selectedColour !== 'ALL' && variant.colour !== selectedColour) {
        return false;
      }

      // 4. Size Filter
      if (selectedSize !== 'ALL' && variant.size !== selectedSize) {
        return false;
      }

      // 5. Stock Status Filter
      if (stockStatusFilter === 'OUT' && variant.quantity > 0) {
        return false;
      }
      if (
        stockStatusFilter === 'LOW' &&
        (variant.quantity === 0 || variant.quantity > variant.low_stock_threshold)
      ) {
        return false;
      }

      return true;
    });
  }, [
    flatItems,
    searchQuery,
    selectedCategory,
    selectedColour,
    selectedSize,
    stockStatusFilter,
  ]);

  // KPI Calculations
  const stats = useMemo(() => {
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    flatItems.forEach(({ variant }) => {
      totalStockUnits += variant.quantity;
      totalValuation += variant.quantity * variant.cost_price;
      if (variant.quantity === 0) {
        outOfStockCount++;
      } else if (variant.quantity <= variant.low_stock_threshold) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.filter((p) => !p.archived).length,
      totalVariants: flatItems.length,
      totalStockUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
    };
  }, [products, flatItems]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedCategory !== 'ALL' ||
    selectedColour !== 'ALL' ||
    selectedSize !== 'ALL' ||
    stockStatusFilter !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedColour('ALL');
    setSelectedSize('ALL');
    setStockStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Inventory Management
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-foreground">
              {filteredItems.length} items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Realtime products, colour/size variants, weighted cost, and stock logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventory/add"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Valuation */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Inventory Valuation
          </span>
          <div className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mt-1 tabular-nums">
            {formatIndianRupees(stats.totalValuation)}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {stats.totalStockUnits} total units in shop
          </span>
        </div>

        {/* Variants Count */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Products & Variants
          </span>
          <div className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground mt-1">
            {stats.totalProducts} <span className="text-xs font-normal text-muted-foreground">prods</span> / {stats.totalVariants} <span className="text-xs font-normal text-muted-foreground">vars</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Across {categories.length} categories
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            stats.lowStockCount > 0
              ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <AlertTriangle className={`w-4 h-4 ${stats.lowStockCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-lg sm:text-xl font-extrabold tracking-tight mt-1">
            {stats.lowStockCount} <span className="text-xs font-normal">variants</span>
          </div>
          <span className="text-[11px] mt-0.5 block opacity-80">
            {stockStatusFilter === 'LOW' ? 'Active filter (tap to reset)' : 'Tap to filter'}
          </span>
        </div>

        {/* Out of Stock */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            stats.outOfStockCount > 0
              ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Out of Stock
            </span>
            <XCircle className={`w-4 h-4 ${stats.outOfStockCount > 0 ? 'text-rose-500' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-lg sm:text-xl font-extrabold tracking-tight mt-1">
            {stats.outOfStockCount} <span className="text-xs font-normal">variants</span>
          </div>
          <span className="text-[11px] mt-0.5 block opacity-80">
            {stockStatusFilter === 'OUT' ? 'Active filter (tap to reset)' : 'Tap to filter'}
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl border border-border bg-card space-y-3.5 shadow-2xs">
        {/* Top: Instant Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant search by product, brand, colour, size, category..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Desktop View Mode Toggle */}
          <div className="hidden md:flex items-center rounded-xl border border-border bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle: Filter Dropdowns & Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Category Selector */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Colour Selector */}
          {colours.length > 0 && (
            <select
              value={selectedColour}
              onChange={(e) => setSelectedColour(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Colours</option>
              {colours.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          )}

          {/* Size Selector */}
          {sizes.length > 0 && (
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Sizes</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Stock Filter Buttons */}
          <button
            type="button"
            onClick={() => setStockStatusFilter(stockStatusFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors border ${
              stockStatusFilter === 'LOW'
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-secondary/70 text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Low Stock
          </button>

          <button
            type="button"
            onClick={() => setStockStatusFilter(stockStatusFilter === 'OUT' ? 'ALL' : 'OUT')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors border ${
              stockStatusFilter === 'OUT'
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-secondary/70 text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            Out of Stock
          </button>

          {/* Show Archived Toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-colors border ${
              showArchived
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                : 'bg-secondary/70 text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? 'Showing Archived' : 'Show Archived'}</span>
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main List Rendering */}
      {/* Desktop rendering based on viewMode */}
      <div className="hidden md:block">
        {viewMode === 'table' ? (
          <ProductTable
            items={filteredItems}
            onOpenHistory={(v, p) => setHistoryTarget({ variant: v, product: p })}
            onOpenRestock={(v, p) => setRestockTarget({ variant: v, product: p })}
            onOpenEditVariant={(v, p) => setEditVariantTarget({ variant: v, product: p })}
            onOpenEditProduct={(p) => setEditProductTarget(p)}
          />
        ) : (
          <ProductCardList
            items={filteredItems}
            onOpenHistory={(v, p) => setHistoryTarget({ variant: v, product: p })}
            onOpenRestock={(v, p) => setRestockTarget({ variant: v, product: p })}
            onOpenEditVariant={(v, p) => setEditVariantTarget({ variant: v, product: p })}
            onOpenEditProduct={(p) => setEditProductTarget(p)}
          />
        )}
      </div>

      {/* Mobile rendering: always clean cards with big touch targets */}
      <div className="md:hidden">
        <ProductCardList
          items={filteredItems}
          onOpenHistory={(v, p) => setHistoryTarget({ variant: v, product: p })}
          onOpenRestock={(v, p) => setRestockTarget({ variant: v, product: p })}
          onOpenEditVariant={(v, p) => setEditVariantTarget({ variant: v, product: p })}
          onOpenEditProduct={(p) => setEditProductTarget(p)}
        />
      </div>

      {/* Modals */}
      {historyTarget && (
        <StockHistoryModal
          variant={historyTarget.variant}
          product={historyTarget.product}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {restockTarget && (
        <QuickRestockModal
          variant={restockTarget.variant}
          product={restockTarget.product}
          onClose={() => setRestockTarget(null)}
          onSaved={() => {
            // Re-fetch or trigger update
            window.location.reload();
          }}
        />
      )}

      {editVariantTarget && (
        <EditVariantModal
          variant={editVariantTarget.variant}
          product={editVariantTarget.product}
          onClose={() => setEditVariantTarget(null)}
          onSaved={() => {
            window.location.reload();
          }}
        />
      )}

      {editProductTarget && (
        <EditProductModal
          product={editProductTarget}
          onClose={() => setEditProductTarget(null)}
          onSaved={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
