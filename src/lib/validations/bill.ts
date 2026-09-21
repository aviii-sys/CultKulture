import { z } from 'zod';

export const billItemInputSchema = z.object({
  variant_id: z.string().uuid('Invalid variant ID'),
  qty: z.coerce
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1'),
  unit_selling_price: z.coerce
    .number({ message: 'Unit price must be a number' })
    .int('Unit price must be an integer')
    .min(0, 'Selling price cannot be negative'),
  line_discount: z.coerce
    .number({ message: 'Line discount must be a number' })
    .int('Line discount must be an integer')
    .min(0, 'Discount cannot be negative')
    .default(0),
});

export const createBillSchema = z
  .object({
    customer_name: z.string().trim().max(100).optional().default('Walk-in Customer'),
    phone: z.string().trim().max(20).optional().nullable(),
    payment_mode: z.enum(['Cash', 'UPI', 'Card', 'Split'], {
      message: 'Please select a valid payment mode',
    }),
    bill_discount: z.coerce
      .number({ message: 'Bill discount must be a number' })
      .int('Bill discount must be an integer')
      .min(0, 'Bill discount cannot be negative')
      .default(0),
    notes: z.string().trim().max(500).optional().nullable(),
    items: z.array(billItemInputSchema).min(1, 'A bill must contain at least one item'),
  })
  .superRefine((data, ctx) => {
    let subtotalAfterItemDiscounts = 0;

    data.items.forEach((item, idx) => {
      const gross = item.qty * item.unit_selling_price;
      if (item.line_discount > gross) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Line discount (₹${item.line_discount}) cannot exceed item gross total (₹${gross})`,
          path: ['items', idx, 'line_discount'],
        });
      }
      subtotalAfterItemDiscounts += Math.max(0, gross - item.line_discount);
    });

    if (data.bill_discount > subtotalAfterItemDiscounts) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Bill discount (₹${data.bill_discount}) cannot exceed total bill amount after item discounts (₹${subtotalAfterItemDiscounts})`,
        path: ['bill_discount'],
      });
    }
  });

export const voidBillSchema = z.object({
  bill_id: z.string().uuid('Invalid bill ID'),
  reason: z.string().trim().max(250).optional().nullable(),
});

export type BillItemInput = z.infer<typeof billItemInputSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type VoidBillInput = z.infer<typeof voidBillSchema>;
