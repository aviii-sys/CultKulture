'use client';

import React, { useMemo, useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import { ProductWithVariants } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';

interface PosProductCatalogProps {
  products: ProductWithVariants[];
  onSelectProduct: (product: ProductWithVariants) => void;
}

export function PosProductCatalog({
  products,
  onSelectProduct,
}: PosProductCatalogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products based on search query (name, brand, category, colour, size)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((product) => {
      // 1. Only active products
      if (product.archived) return false;

      // Active variants only
      const activeVars = product.variants.filter((v) => !v.archived);
      if (activeVars.length === 0) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) {
        return false;
      }

      // If search query is empty, pass
      if (!q) return true;

      // Match product name, brand, category
      if (product.name.toLowerCase().includes(q)) return true;
      if (product.category?.toLowerCase().includes(q)) return true;
      if (product.brand?.toLowerCase().includes(q)) return true;

      // Match colour or size across active variants
      const matchesVariant = activeVars.some(
        (v) =>
          v.colour.toLowerCase().includes(q) ||
          v.size.toLowerCase().includes(q)
      );

      return matchesVariant;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, brand, category, colour, size..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-11 pr-10 rounded-2xl border border-border bg-card shadow-xs text-sm font-medium outline-hidden focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-muted-foreground/70"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {cat === 'ALL' ? 'All Items' : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40">
            <Package className="w-10 h-10 opacity-30 mb-2" />
            <h4 className="font-semibold text-sm text-foreground">No matching products</h4>
            <p className="text-xs max-w-xs mt-1">
              Try searching by a different term or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const activeVariants = product.variants.filter((v) => !v.archived);
              const totalStock = activeVariants.reduce((sum, v) => sum + v.quantity, 0);

              // Distinct colours and sizes
              const colours = Array.from(new Set(activeVariants.map((v) => v.colour)));
              const sizes = Array.from(new Set(activeVariants.map((v) => v.size)));

              // Min and max selling price
              const prices = activeVariants.map((v) => v.selling_price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const priceDisplay =
                minPrice === maxPrice
                  ? formatIndianRupees(minPrice)
                  : `${formatIndianRupees(minPrice)} - ${formatIndianRupees(maxPrice)}`;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="p-4 rounded-2xl border border-border bg-card hover:border-sky-500/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {product.category}
                      </span>
                      {product.brand && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                      {product.name}
                    </h4>

                    {/* Colours and sizes summary */}
                    <div className="flex flex-wrap items-center gap-1 mt-2.5">
                      {colours.slice(0, 3).map((col) => (
                        <span
                          key={col}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground"
                        >
                          {col}
                        </span>
                      ))}
                      {colours.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{colours.length - 3}
                        </span>
                      )}
                      <span className="text-muted-foreground text-[10px] mx-0.5">•</span>
                      {sizes.slice(0, 4).map((sz) => (
                        <span
                          key={sz}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                        >
                          {sz}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stock and Price Footer */}
                  <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span
                        className={`text-[11px] font-medium ${
                          totalStock <= 0
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : totalStock <= 3
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {totalStock <= 0 ? 'Out of stock' : `${totalStock} in stock`}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-foreground">
                      {priceDisplay}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
