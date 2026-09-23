'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  addStockBatchSchema,
  editProductSchema,
  editVariantSchema,
  quickRestockSchema,
  type AddStockBatchInput,
  type EditProductInput,
  type EditVariantInput,
  type QuickRestockInput,
} from '@/lib/validations/inventory';

export interface ActionResult<T = unknown> {
  success?: boolean;
  data?: T;
  error?: string;
}

/**
 * Atomic Server Action to create or restock products and multi-variants
 * Calls the PostgreSQL add_stock_batch() atomic function.
 */
export async function addStockBatchAction(
  rawInput: AddStockBatchInput
): Promise<ActionResult> {
  try {
    const validated = addStockBatchSchema.safeParse(rawInput);
    if (!validated.success) {
      const firstError = validated.error.issues[0]?.message || 'Validation failed';
      return { error: firstError };
    }

    const { isNewProduct, productId, productName, category, brand, variants } = validated.data;
    const supabase = (await createClient()) as any;

    // Prepare p_product JSONB
    const p_product = isNewProduct || !productId
      ? {
          name: productName?.trim(),
          category: category ? category.trim() : null,
          brand: brand ? brand.trim() : null,
        }
      : {
          id: productId,
        };

    // Prepare p_variants JSONB
    const p_variants = variants.map((v) => ({
      colour: v.colour ? v.colour.trim() : null,
      size: v.size ? v.size.trim() : null,
      qty: v.qty,
      cost_price: v.cost_price,
      selling_price: v.selling_price,
      supplier: v.supplier ? v.supplier.trim() : null,
      purchase_date: v.purchase_date || null,
      notes: v.notes ? v.notes.trim() : null,
    }));

    // Invoke atomic function
    const { data, error } = await supabase.rpc('add_stock_batch', {
      p_product: p_product as any,
      p_variants: p_variants as any,
    });

    if (error) {
      console.error('add_stock_batch RPC error:', error);
      return { error: error.message || 'Failed to add stock. Please try again.' };
    }

    // If custom low_stock_threshold was provided (different from default 2), update variants
    const batchResult = data as any;
    if (batchResult?.variants && Array.isArray(batchResult.variants)) {
      for (const item of batchResult.variants) {
        const matchingInput = variants.find(
          (v) =>
            (v.colour || '').toLowerCase().trim() === (item.colour || '').toLowerCase().trim() &&
            (v.size || '').toLowerCase().trim() === (item.size || '').toLowerCase().trim()
        );

        if (matchingInput && matchingInput.low_stock_threshold !== 2) {
          await supabase
            .from('variants')
            .update({ low_stock_threshold: matchingInput.low_stock_threshold })
            .eq('id', item.variant_id);
        }
      }
    }

    revalidatePath('/inventory');
    revalidatePath('/billing');
    return { success: true, data };
  } catch (err: any) {
    console.error('addStockBatchAction exception:', err);
    return { error: err.message || 'An unexpected error occurred while saving stock.' };
  }
}

/**
 * Edit an existing Product (Name, Category, Brand, Archive status)
 */
export async function updateProductAction(
  rawInput: EditProductInput
): Promise<ActionResult> {
  try {
    const validated = editProductSchema.safeParse(rawInput);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid product data' };
    }

    const { id, name, category, brand, archived } = validated.data;
    const supabase = (await createClient()) as any;

    const { error } = await supabase
      .from('products')
      .update({
        name,
        category: category ? category.trim() : null,
        brand: brand ? brand.trim() : null,
        archived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('updateProductAction error:', error);
      return { error: 'Failed to update product.' };
    }

    revalidatePath('/inventory');
    return { success: true };
  } catch (err: any) {
    console.error('updateProductAction exception:', err);
    return { error: err.message || 'Failed to update product.' };
  }
}

/**
 * Edit an existing Variant (Colour, Size, Selling price, Low-stock threshold, Archive status)
 * Strictly guards against duplicate (product_id, colour, size) constraint violation.
 */
export async function updateVariantAction(
  rawInput: EditVariantInput
): Promise<ActionResult> {
  try {
    const validated = editVariantSchema.safeParse(rawInput);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid variant data' };
    }

    const { id, product_id, colour, size, selling_price, low_stock_threshold, archived } =
      validated.data;
    const supabase = (await createClient()) as any;

    // Check for duplicate variant on the same product
    let query = supabase
      .from('variants')
      .select('id, colour, size')
      .eq('product_id', product_id)
      .neq('id', id);

    if (colour) {
      query = query.ilike('colour', colour);
    } else {
      query = query.is('colour', null);
    }

    if (size) {
      query = query.ilike('size', size);
    } else {
      query = query.is('size', null);
    }

    const { data: existingConflict } = await query.maybeSingle();

    if (existingConflict) {
      const desc = [colour, size].filter(Boolean).join(' / ') || 'Standard variant';
      return {
        error: `A variant with "${desc}" already exists for this product.`,
      };
    }

    const { error } = await supabase
      .from('variants')
      .update({
        colour: colour || null,
        size: size || null,
        selling_price,
        low_stock_threshold,
        archived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('updateVariantAction error:', error);
      return { error: error.message || 'Failed to update variant.' };
    }

    revalidatePath('/inventory');
    return { success: true };
  } catch (err: any) {
    console.error('updateVariantAction exception:', err);
    return { error: err.message || 'Failed to update variant.' };
  }
}

/**
 * Quick restock of an existing variant
 */
export async function quickRestockAction(
  rawInput: QuickRestockInput
): Promise<ActionResult> {
  try {
    const validated = quickRestockSchema.safeParse(rawInput);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || 'Invalid restock data' };
    }

    const { variant_id, qty, cost_price, selling_price, supplier, purchase_date, notes } =
      validated.data;
    const supabase = (await createClient()) as any;

    // Fetch variant and product information
    const { data: variant, error: varError } = await supabase
      .from('variants')
      .select('product_id, colour, size')
      .eq('id', variant_id)
      .single();

    if (varError || !variant) {
      return { error: 'Variant not found.' };
    }

    // Call add_stock_batch with existing product id and variant
    const { data, error } = await supabase.rpc('add_stock_batch', {
      p_product: { id: variant.product_id } as any,
      p_variants: [
        {
          colour: variant.colour,
          size: variant.size,
          qty,
          cost_price,
          selling_price,
          supplier: supplier || null,
          purchase_date: purchase_date || null,
          notes: notes || null,
        },
      ] as any,
    });

    if (error) {
      console.error('quickRestockAction RPC error:', error);
      return { error: error.message || 'Failed to restock variant.' };
    }

    revalidatePath('/inventory');
    return { success: true, data };
  } catch (err: any) {
    console.error('quickRestockAction exception:', err);
    return { error: err.message || 'Failed to restock variant.' };
  }
}

/**
 * Soft delete / Archive or Unarchive a Product
 */
export async function toggleArchiveProductAction(
  productId: string,
  archive: boolean
): Promise<ActionResult> {
  try {
    const supabase = (await createClient()) as any;

    // Update product
    const { error: prodError } = await supabase
      .from('products')
      .update({ archived: archive, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (prodError) {
      return { error: 'Failed to archive product.' };
    }

    // Also update all variants for this product
    await supabase
      .from('variants')
      .update({ archived: archive, updated_at: new Date().toISOString() })
      .eq('product_id', productId);

    revalidatePath('/inventory');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to archive product.' };
  }
}

/**
 * Soft delete / Archive or Unarchive a single Variant
 */
export async function toggleArchiveVariantAction(
  variantId: string,
  archive: boolean
): Promise<ActionResult> {
  try {
    const supabase = (await createClient()) as any;

    const { error } = await supabase
      .from('variants')
      .update({ archived: archive, updated_at: new Date().toISOString() })
      .eq('id', variantId);

    if (error) {
      return { error: 'Failed to update variant status.' };
    }

    revalidatePath('/inventory');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to update variant status.' };
  }
}

/**
 * Fetch Stock Audit History for a Variant
 */
export async function getVariantStockHistoryAction(
  variantId: string
): Promise<ActionResult<any[]>> {
  try {
    const supabase = (await createClient()) as any;

    const { data, error } = await supabase
      .from('stock_entries')
      .select('*')
      .eq('variant_id', variantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getVariantStockHistoryAction error:', error);
      return { error: 'Failed to load stock history.' };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { error: err.message || 'Failed to load stock history.' };
  }
}
