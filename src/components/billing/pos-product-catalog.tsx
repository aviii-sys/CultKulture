'use client';

import React, { useMemo, useState } from 'react';
import { Search, X, ShoppingBag } from 'lucide-react';
import { ProductWithVariants } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { ProductImagePlaceholder } from '@/components/common/product-image-placeholder';

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
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filter products based on search query (name, brand, category, colour, size) & stock
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((product) => {
      if (product.archived) return false;

      const activeVars = product.variants.filter((v) => !v.archived);
      if (activeVars.length === 0) return false;

      // Low stock filter
      if (filterLowStockOnly) {
        const hasLowStock = activeVars.some(
          (v) => v.quantity <= (v.low_stock_threshold ?? 2)
        );
        if (!hasLowStock) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) {
        return false;
      }

      // Search match
      if (!q) return true;

      if (product.name.toLowerCase().includes(q)) return true;
      if (product.category?.toLowerCase().includes(q)) return true;
      if (product.brand?.toLowerCase().includes(q)) return true;

      const matchesVariant = activeVars.some(
        (v) =>
          (v.colour ? v.colour.toLowerCase().includes(q) : false) ||
          (v.size ? v.size.toLowerCase().includes(q) : false)
      );

      return matchesVariant;
    });
  }, [products, searchQuery, selectedCategory, filterLowStockOnly]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sticky Top Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search products, brands, colours or sizes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-10 rounded-2xl border border-input bg-card shadow-2xs text-xs sm:text-sm font-semibold outline-hidden focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground/70"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Chips Horizontal Scrolling */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat && !filterLowStockOnly;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setFilterLowStockOnly(false);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-secondary/70 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {cat === 'ALL' ? 'All Pieces' : cat}
            </button>
          );
        })}

        {/* Low Stock Filter Chip */}
        <button
          type="button"
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            filterLowStockOnly
              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'bg-secondary/70 text-muted-foreground hover:text-foreground border border-transparent'
          }`}
        >
          Low Stock
        </button>
      </div>

      {/* Visual Product Catalog Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center border border-border/70 rounded-3xl bg-card p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/60">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-foreground">
              Your collection is waiting to be stocked
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No products match &ldquo;{searchQuery}&rdquo;. Add new garments in Inventory or adjust your filter terms.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const activeVars = product.variants.filter((v) => !v.archived);
              const totalStock = activeVars.reduce((sum, v) => sum + v.quantity, 0);
              const prices = activeVars.map((v) => v.selling_price);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
              const priceLabel =
                minPrice === maxPrice
                  ? formatIndianRupees(minPrice)
                  : `From ${formatIndianRupees(minPrice)}`;

              const isOutOfStock = totalStock === 0;
              const isLowStock =
                !isOutOfStock &&
                activeVars.some((v) => v.quantity <= (v.low_stock_threshold ?? 2));

              const primaryColour = activeVars[0]?.colour;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="group rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 card-hover-lift shadow-2xs select-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProduct(product);
                    }
                  }}
                >
                  {/* Photo-Style Aspect Card */}
                  <div className="relative overflow-hidden">
                    <ProductImagePlaceholder
                      name={product.name}
                      category={product.category}
                      colour={primaryColour}
                      aspectRatio="aspect-[4/5]"
                      className="group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Stock Pill Badge */}
                    <div className="absolute top-2.5 right-2.5 z-20">
                      {isOutOfStock ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-900/90 text-rose-100 backdrop-blur-xs border border-rose-700/50">
                          OUT
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-900/90 text-amber-100 backdrop-blur-xs border border-amber-700/50">
                          {totalStock} left
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-background/80 text-foreground/80 backdrop-blur-xs border border-border/40">
                          {totalStock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-3 sm:p-3.5 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                        {product.brand || product.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">
                        {activeVars.length} {activeVars.length === 1 ? 'variant' : 'variants'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover:underline">
                      {product.name}
                    </h4>

                    <p className="text-xs sm:text-sm font-black text-foreground pt-0.5">
                      {priceLabel}
                    </p>
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
