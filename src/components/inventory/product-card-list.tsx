'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  Edit3,
  Sliders,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Product, Variant } from '@/types';
import { formatIndianRupees } from '@/lib/utils/currency';
import { ProductImagePlaceholder } from '@/components/common/product-image-placeholder';

export interface ProductGroupedItem {
  product: Product;
  variants: Variant[];
}

interface ProductCardListProps {
  products: ProductGroupedItem[];
  onOpenHistory: (variant: Variant, product: Product) => void;
  onOpenRestock: (variant: Variant, product: Product) => void;
  onOpenEditVariant: (variant: Variant, product: Product) => void;
  onOpenEditProduct: (product: Product) => void;
}

export function ProductCardList({
  products,
  onOpenHistory,
  onOpenRestock,
  onOpenEditVariant,
  onOpenEditProduct,
}: ProductCardListProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <div className="py-20 text-center border border-border/80 rounded-3xl bg-card p-8 space-y-3 shadow-2xs">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground/60">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-foreground">No pieces in your collection yet</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Stock your boutique collection with apparel, suits, jackets, and accessories using the Add Stock button.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {products.map(({ product, variants }) => {
        const totalStock = variants.reduce((sum, v) => sum + v.quantity, 0);
        const hasVariants = variants.length > 0;
        const prices = variants.map((v) => v.selling_price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const priceLabel =
          minPrice === maxPrice
            ? formatIndianRupees(minPrice)
            : `${formatIndianRupees(minPrice)} – ${formatIndianRupees(maxPrice)}`;

        const isOutOfStock = hasVariants && totalStock === 0;
        const isLowStock =
          !isOutOfStock &&
          variants.some((v) => v.quantity <= (v.low_stock_threshold ?? 2));

        const primaryColour = variants[0]?.colour;
        const isExpanded = expandedProductId === product.id;

        return (
          <div
            key={product.id}
            className="group rounded-2xl border border-border/80 bg-card overflow-hidden flex flex-col justify-between transition-all duration-200 card-hover-lift shadow-2xs"
          >
            {/* Visual Image Header with Progressive Actions */}
            <div className="relative overflow-hidden cursor-pointer" onClick={() => onOpenEditProduct(product)}>
              <ProductImagePlaceholder
                name={product.name}
                category={product.category}
                colour={primaryColour}
                aspectRatio="aspect-[4/5]"
                className="group-hover:scale-102 transition-transform duration-300"
              />

              {/* Stock Status Badge */}
              <div className="absolute top-2.5 right-2.5 z-20">
                {isOutOfStock ? (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-900/90 text-rose-100 backdrop-blur-xs border border-rose-700/50 shadow-xs">
                    OUT
                  </span>
                ) : isLowStock ? (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-900/90 text-amber-100 backdrop-blur-xs border border-amber-700/50 shadow-xs">
                    LOW ({totalStock})
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-background/80 text-foreground/80 backdrop-blur-xs border border-border/40 shadow-xs">
                    {totalStock} in stock
                  </span>
                )}
              </div>

              {/* Floating Quick Edit on Hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditProduct(product);
                }}
                className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded-xl bg-background/90 backdrop-blur-xs text-foreground/80 hover:text-foreground border border-border/60 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit Product"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Product Details Section */}
            <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
                    {product.brand || product.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                    {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
                  </span>
                </div>

                <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate mt-0.5 leading-snug">
                  {product.name}
                </h4>

                <p className="text-xs sm:text-sm font-black text-foreground mt-1 tracking-tight">
                  {priceLabel}
                </p>
              </div>

              {/* Quick Restock / Expand Bar */}
              <div className="pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                  className="w-full py-1.5 px-2 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground text-[11px] font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-muted-foreground" />
                    <span>Variants</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded Variants Drawer */}
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 pt-1.5 border-t border-border/40 animate-in fade-in duration-150">
                    {variants.map((v) => (
                      <div
                        key={v.id}
                        className="p-1.5 rounded-lg bg-background border border-border/50 flex items-center justify-between text-[10px]"
                      >
                        <div className="flex items-center gap-1 font-semibold truncate">
                          <span>{v.colour}</span>
                          <span>/</span>
                          <span className="text-primary">{v.size}</span>
                          <span className="text-muted-foreground font-normal">({v.quantity})</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenRestock(v, product)}
                            className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground"
                            title="Restock variant"
                          >
                            <PlusCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditVariant(v, product)}
                            className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground"
                            title="Edit variant"
                          >
                            <Sliders className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenHistory(v, product)}
                            className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground"
                            title="Stock history"
                          >
                            <Clock className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
