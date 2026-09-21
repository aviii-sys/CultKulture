import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { InventoryView } from '@/components/inventory/inventory-view';
import { Product, Variant } from '@/types';

// Force dynamic fetch to always show live inventory status
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = await createClient();

  // Fetch products with their variants
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      variants (*)
    `)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error('Error loading inventory products:', productsError);
  }

  const productsWithVariants = (productsData || []) as (Product & { variants: Variant[] })[];

  return <InventoryView initialProducts={productsWithVariants} />;
}
