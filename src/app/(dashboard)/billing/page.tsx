import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { PosScreen } from '@/components/billing/pos-screen';
import { ProductWithVariants } from '@/types';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const supabase = (await createClient()) as any;

  // Fetch active products with active variants
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      brand,
      archived,
      created_at,
      updated_at,
      variants (
        id,
        product_id,
        colour,
        size,
        quantity,
        cost_price,
        selling_price,
        low_stock_threshold,
        archived,
        created_at,
        updated_at
      )
    `)
    .eq('archived', false)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products for POS:', error);
  }

  // Filter out any archived variants and products with zero active variants
  const activeProducts: ProductWithVariants[] = (products || [])
    .map((p: any) => ({
      ...p,
      variants: (p.variants || []).filter((v: any) => !v.archived),
    }))
    .filter((p: any) => p.variants.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Point of Sale (POS)
          </h1>
          <p className="text-xs text-muted-foreground">
            Fast counter checkout • Bargaining price adjustments • Proportional discounts
          </p>
        </div>
      </div>

      <PosScreen initialProducts={activeProducts} />
    </div>
  );
}
