import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { VariantMatrixForm } from '@/components/inventory/variant-matrix-form';
import { Product, Variant } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AddStockPage() {
  const supabase = await createClient();

  // Fetch active products with their variants for the selector
  const { data: productsData } = await supabase
    .from('products')
    .select(`
      *,
      variants (*)
    `)
    .eq('archived', false)
    .order('name', { ascending: true });

  const existingProducts = (productsData || []) as (Product & { variants: Variant[] })[];

  return <VariantMatrixForm existingProducts={existingProducts} />;
}
