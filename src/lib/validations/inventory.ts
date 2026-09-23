import { z } from 'zod';

export const variantRowSchema = z.object({
  id: z.string().uuid().optional(),
  colour: z
    .string()
    .trim()
    .max(50, 'Colour name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  size: z
    .string()
    .trim()
    .max(20, 'Size is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  qty: z.coerce
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero'),
  cost_price: z.coerce
    .number({ message: 'Cost price must be a number' })
    .int('Cost price must be an integer')
    .min(0, 'Cost price cannot be negative'),
  selling_price: z.coerce
    .number({ message: 'Selling price must be a number' })
    .int('Selling price must be an integer')
    .min(0, 'Selling price cannot be negative'),
  low_stock_threshold: z.coerce
    .number({ message: 'Threshold must be a number' })
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .default(2),
  supplier: z.string().trim().max(100).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const addStockBatchSchema = z
  .object({
    productId: z.string().uuid().optional().nullable(),
    isNewProduct: z.boolean().default(true),
    productName: z.string().trim().optional(),
    category: z
      .string()
      .trim()
      .max(50, 'Category is too long')
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    brand: z.string().trim().optional().nullable(),
    variants: z.array(variantRowSchema).min(1, 'At least one variant must be added'),
  })
  .superRefine((data, ctx) => {
    // 1. Validate Product Name if creating a new product
    if (data.isNewProduct || !data.productId) {
      if (!data.productName || data.productName.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product name is required',
          path: ['productName'],
        });
      }
    } else if (!data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select an existing product',
        path: ['productId'],
      });
    }

    // 2. Prevent accidental duplicate rows in the same Add Stock form
    const seen = new Set<string>();
    data.variants.forEach((v, idx) => {
      const colKey = (v.colour || '').toLowerCase().trim();
      const sizeKey = (v.size || '').toLowerCase().trim();
      const key = `${colKey}:::${sizeKey}`;
      if (seen.has(key)) {
        const desc = [v.colour, v.size].filter(Boolean).join(' / ') || 'Standard variant';
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variant in form: "${desc}" appears multiple times. Please combine into a single row.`,
          path: ['variants', idx, 'colour'],
        });
      } else {
        seen.add(key);
      }
    });
  });

export const editProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Product name is required').max(100),
  category: z
    .string()
    .trim()
    .max(50, 'Category is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  brand: z.string().trim().max(50).optional().nullable(),
  archived: z.boolean().default(false),
});

export const editVariantSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  colour: z
    .string()
    .trim()
    .max(50, 'Colour name is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  size: z
    .string()
    .trim()
    .max(20, 'Size is too long')
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  selling_price: z.coerce
    .number({ message: 'Selling price must be a number' })
    .int('Selling price must be an integer')
    .min(0, 'Selling price cannot be negative'),
  low_stock_threshold: z.coerce
    .number({ message: 'Threshold must be a number' })
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative'),
  archived: z.boolean().default(false),
});

export const quickRestockSchema = z.object({
  variant_id: z.string().uuid(),
  qty: z.coerce
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be greater than zero'),
  cost_price: z.coerce
    .number({ message: 'Cost price must be a number' })
    .int('Cost price must be an integer')
    .min(0, 'Cost price cannot be negative'),
  selling_price: z.coerce
    .number({ message: 'Selling price must be a number' })
    .int('Selling price must be an integer')
    .min(0, 'Selling price cannot be negative'),
  supplier: z.string().trim().max(100).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type VariantRowInput = z.infer<typeof variantRowSchema>;
export type AddStockBatchInput = z.infer<typeof addStockBatchSchema>;
export type EditProductInput = z.infer<typeof editProductSchema>;
export type EditVariantInput = z.infer<typeof editVariantSchema>;
export type QuickRestockInput = z.infer<typeof quickRestockSchema>;
