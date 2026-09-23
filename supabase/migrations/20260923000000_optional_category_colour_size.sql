-- ==============================================================================
-- PHASE 11: OPTIONAL CATEGORY, COLOUR, AND SIZE MIGRATION
-- Backward-compatible, non-destructive migration.
-- Preserves all existing products, variants, bills, stock entries, and audit logs.
-- ==============================================================================

-- 1. DROP NOT NULL CONSTRAINTS
-- Category on products
ALTER TABLE public.products ALTER COLUMN category DROP NOT NULL;

-- Colour and size on variants
ALTER TABLE public.variants ALTER COLUMN colour DROP NOT NULL;
ALTER TABLE public.variants ALTER COLUMN size DROP NOT NULL;

-- Colour and size on bill_items (for sale line snapshots)
ALTER TABLE public.bill_items ALTER COLUMN colour DROP NOT NULL;
ALTER TABLE public.bill_items ALTER COLUMN size DROP NOT NULL;

-- 2. UPDATE UNIQUE CONSTRAINT / INDEX FOR VARIANT DUPLICATE PREVENTION
-- Drop existing constraint "uq_product_colour_size"
ALTER TABLE public.variants DROP CONSTRAINT IF EXISTS uq_product_colour_size;
DROP INDEX IF EXISTS public.uq_variants_product_colour_size;

-- Create concurrency-safe, case-insensitive, whitespace-trimmed unique index
-- treating NULL and empty strings identically as '' for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS uq_variants_product_colour_size
ON public.variants (
    product_id,
    COALESCE(lower(trim(colour)), ''),
    COALESCE(lower(trim(size)), '')
);

-- 3. UPDATE ATOMIC FUNCTION: add_stock_batch
CREATE OR REPLACE FUNCTION public.add_stock_batch(
    p_product JSONB,
    p_variants JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_id UUID;
    v_product_name TEXT;
    v_category TEXT;
    v_brand TEXT;
    v_var RECORD;
    v_colour TEXT;
    v_size TEXT;
    v_variant_id UUID;
    v_current_qty INTEGER;
    v_current_cost INTEGER;
    v_new_qty INTEGER;
    v_new_cost INTEGER;
    v_results JSONB := '[]'::JSONB;
    v_purchase_date DATE;
BEGIN
    -- 1. Security Check
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can add stock.';
    END IF;

    -- 2. Resolve / Create Product
    IF p_product ? 'id' AND p_product->>'id' IS NOT NULL AND (p_product->>'id') <> '' THEN
        v_product_id := (p_product->>'id')::UUID;
        SELECT id, name INTO v_product_id, v_product_name
        FROM public.products
        WHERE id = v_product_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found.', p_product->>'id';
        END IF;
    ELSE
        v_product_name := trim(p_product->>'name');
        v_category := NULLIF(trim(p_product->>'category'), '');
        v_brand := NULLIF(trim(p_product->>'brand'), '');

        IF v_product_name IS NULL OR v_product_name = '' THEN
            RAISE EXCEPTION 'Product name is required.';
        END IF;
        -- Note: Category is now optional. If blank or null, stored as NULL.

        INSERT INTO public.products (name, category, brand, created_at, updated_at)
        VALUES (v_product_name, v_category, v_brand, now(), now())
        RETURNING id INTO v_product_id;
    END IF;

    -- 3. Process Variants Matrix
    FOR v_var IN SELECT * FROM jsonb_to_recordset(p_variants) AS x(
        colour TEXT,
        size TEXT,
        qty INTEGER,
        cost_price INTEGER,
        selling_price INTEGER,
        supplier TEXT,
        purchase_date DATE,
        notes TEXT
    )
    LOOP
        v_colour := NULLIF(trim(v_var.colour), '');
        v_size := NULLIF(trim(v_var.size), '');

        -- Note: Colour and Size are now optional. If blank/null, stored as NULL.
        IF v_var.qty <= 0 THEN
            RAISE EXCEPTION 'Added quantity must be greater than zero.';
        END IF;
        IF v_var.cost_price < 0 THEN
            RAISE EXCEPTION 'Cost price cannot be negative.';
        END IF;
        IF v_var.selling_price < 0 THEN
            RAISE EXCEPTION 'Selling price cannot be negative.';
        END IF;

        v_purchase_date := COALESCE(v_var.purchase_date, (now() AT TIME ZONE 'Asia/Kolkata')::DATE);

        -- Check if variant exists (case-insensitive, trimming and NULL-safe)
        SELECT id, quantity, cost_price
        INTO v_variant_id, v_current_qty, v_current_cost
        FROM public.variants
        WHERE product_id = v_product_id
          AND COALESCE(lower(trim(colour)), '') = COALESCE(lower(v_colour), '')
          AND COALESCE(lower(trim(size)), '') = COALESCE(lower(v_size), '')
        FOR UPDATE;

        IF FOUND THEN
            -- Calculate weighted average cost
            v_new_qty := v_current_qty + v_var.qty;
            IF v_current_qty > 0 THEN
                v_new_cost := ROUND(
                    ((v_current_qty::NUMERIC * v_current_cost::NUMERIC) + (v_var.qty::NUMERIC * v_var.cost_price::NUMERIC))
                    / v_new_qty::NUMERIC
                );
            ELSE
                v_new_cost := v_var.cost_price;
            END IF;

            UPDATE public.variants
            SET quantity = v_new_qty,
                cost_price = v_new_cost,
                selling_price = v_var.selling_price,
                archived = false,
                updated_at = now()
            WHERE id = v_variant_id;
        ELSE
            v_new_qty := v_var.qty;
            v_new_cost := v_var.cost_price;

            INSERT INTO public.variants (
                product_id, colour, size, quantity, cost_price, selling_price, created_at, updated_at
            )
            VALUES (
                v_product_id, v_colour, v_size, v_new_qty, v_new_cost, v_var.selling_price, now(), now()
            )
            RETURNING id INTO v_variant_id;
        END IF;

        -- Record stock audit log
        INSERT INTO public.stock_entries (
            variant_id, qty, cost_per_unit, supplier, purchase_date, notes, created_at
        )
        VALUES (
            v_variant_id, v_var.qty, v_var.cost_price, trim(v_var.supplier), v_purchase_date, v_var.notes, now()
        );

        v_results := v_results || jsonb_build_object(
            'variant_id', v_variant_id,
            'colour', v_colour,
            'size', v_size,
            'qty_added', v_var.qty,
            'new_total_qty', v_new_qty,
            'new_cost', v_new_cost
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'product_id', v_product_id,
        'variants', v_results
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_stock_batch(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_stock_batch(JSONB, JSONB) TO authenticated;

-- 4. UPDATE ATOMIC FUNCTION: create_bill (handles NULL colour and size in line items)
CREATE OR REPLACE FUNCTION public.create_bill(
    p_customer_name TEXT,
    p_phone TEXT,
    p_payment_mode TEXT,
    p_bill_discount INTEGER,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_year INTEGER;
    v_seq_num INTEGER;
    v_bill_number TEXT;
    v_bill_id UUID;
    v_customer_name TEXT;

    v_subtotal INTEGER := 0;
    v_total_item_discount INTEGER := 0;
    v_bill_discount INTEGER := COALESCE(p_bill_discount, 0);
    v_total_discount INTEGER := 0;
    v_total_selling INTEGER := 0;
    v_total_cost INTEGER := 0;
    v_total_profit INTEGER := 0;

    v_item RECORD;
    v_variant RECORD;
    v_line_gross INTEGER;
    v_line_net_before_bill_disc INTEGER;
    v_net_sum_before_bill_disc INTEGER := 0;
    v_allocated_bill_disc INTEGER;
    v_allocated_so_far INTEGER := 0;
    v_items_count INTEGER;
    v_item_idx INTEGER := 0;
    v_line_total INTEGER;
    v_line_cost INTEGER;
    v_line_profit INTEGER;
BEGIN
    -- 1. Security Check
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can create bills.';
    END IF;

    -- 2. Input Validation
    v_customer_name := COALESCE(NULLIF(trim(p_customer_name), ''), 'Walk-in Customer');
    v_items_count := jsonb_array_length(p_items);

    IF v_items_count = 0 THEN
        RAISE EXCEPTION 'A bill must contain at least one item.';
    END IF;
    IF v_bill_discount < 0 THEN
        RAISE EXCEPTION 'Bill discount cannot be negative.';
    END IF;
    IF p_payment_mode NOT IN ('Cash', 'UPI', 'Card', 'Split') THEN
        RAISE EXCEPTION 'Invalid payment mode: %', p_payment_mode;
    END IF;

    -- 3. Create Draft Bill Header with Sequential Number
    v_current_year := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Kolkata'))::INTEGER;
    
    INSERT INTO public.bill_sequences (year, last_number)
    VALUES (v_current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = public.bill_sequences.last_number + 1
    RETURNING last_number INTO v_seq_num;

    v_bill_number := 'INV-' || v_current_year::TEXT || '-' || LPAD(v_seq_num::TEXT, 4, '0');

    -- Create temporary table for staging calculation
    CREATE TEMPORARY TABLE temp_bill_items (
        idx INT,
        variant_id UUID,
        product_name TEXT,
        colour TEXT,
        size TEXT,
        qty INT,
        unit_selling_price INT,
        unit_cost_price INT,
        line_gross INT,
        line_discount INT,
        line_net_before_bill_disc INT
    ) ON COMMIT DROP;

    -- 4. Pass 1: Validate stock, lock rows, compute line discounts & sum net
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        variant_id UUID,
        qty INTEGER,
        unit_selling_price INTEGER,
        line_discount INTEGER
    )
    LOOP
        v_item_idx := v_item_idx + 1;
        IF v_item.qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;
        IF v_item.unit_selling_price < 0 THEN
            RAISE EXCEPTION 'Unit selling price cannot be negative.';
        END IF;

        v_line_gross := v_item.qty * v_item.unit_selling_price;
        v_item.line_discount := COALESCE(v_item.line_discount, 0);
        IF v_item.line_discount < 0 THEN
            RAISE EXCEPTION 'Line discount cannot be negative.';
        END IF;
        IF v_item.line_discount > v_line_gross THEN
            RAISE EXCEPTION 'Line discount (₹%) cannot exceed line gross amount (₹%).', v_item.line_discount, v_line_gross;
        END IF;

        v_line_net_before_bill_disc := v_line_gross - v_item.line_discount;
        v_subtotal := v_subtotal + v_line_gross;
        v_total_item_discount := v_total_item_discount + v_item.line_discount;
        v_net_sum_before_bill_disc := v_net_sum_before_bill_disc + v_line_net_before_bill_disc;

        -- Lock variant row for update to prevent overselling
        SELECT v.id, v.quantity, v.cost_price, v.colour, v.size, p.name AS product_name
        INTO v_variant
        FROM public.variants v
        JOIN public.products p ON p.id = v.product_id
        WHERE v.id = v_item.variant_id AND NOT v.archived
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Variant % not found or is archived.', v_item.variant_id;
        END IF;

        IF v_variant.quantity < v_item.qty THEN
            RAISE EXCEPTION 'Insufficient stock for % (% / %). Available: %, Requested: %',
                v_variant.product_name, COALESCE(v_variant.colour, '-'), COALESCE(v_variant.size, '-'), v_variant.quantity, v_item.qty;
        END IF;

        -- Deduct inventory immediately
        UPDATE public.variants
        SET quantity = quantity - v_item.qty,
            updated_at = now()
        WHERE id = v_item.variant_id;

        INSERT INTO temp_bill_items (
            idx, variant_id, product_name, colour, size, qty, unit_selling_price, unit_cost_price, line_gross, line_discount, line_net_before_bill_disc
        ) VALUES (
            v_item_idx, v_variant.id, v_variant.product_name, v_variant.colour, v_variant.size, v_item.qty, v_item.unit_selling_price, v_variant.cost_price, v_line_gross, v_item.line_discount, v_line_net_before_bill_disc
        );
    END LOOP;

    -- Validate whole-bill discount
    IF v_bill_discount > v_net_sum_before_bill_disc THEN
        RAISE EXCEPTION 'Bill discount (₹%) cannot exceed remaining bill total (₹%).', v_bill_discount, v_net_sum_before_bill_disc;
    END IF;

    -- 5. Pass 2: Allocate whole-bill discount proportionally and insert bill items
    INSERT INTO public.bills (
        bill_number, customer_name, phone, payment_mode, subtotal, total_item_discount, bill_discount, total_discount, total, total_cost, profit, status, notes, created_at
    ) VALUES (
        v_bill_number, v_customer_name, trim(p_phone), p_payment_mode, v_subtotal, v_total_item_discount, v_bill_discount, 0, 0, 0, 0, 'active', p_notes, now()
    ) RETURNING id INTO v_bill_id;

    v_item_idx := 0;
    FOR v_item IN SELECT * FROM temp_bill_items ORDER BY idx ASC LOOP
        v_item_idx := v_item_idx + 1;

        IF v_bill_discount = 0 OR v_net_sum_before_bill_disc = 0 THEN
            v_allocated_bill_disc := 0;
        ELSIF v_item_idx = v_items_count THEN
            -- Remainder on last item to prevent rounding drift
            v_allocated_bill_disc := v_bill_discount - v_allocated_so_far;
        ELSE
            v_allocated_bill_disc := ROUND(
                (v_item.line_net_before_bill_disc::NUMERIC / v_net_sum_before_bill_disc::NUMERIC) * v_bill_discount::NUMERIC
            );
            v_allocated_so_far := v_allocated_so_far + v_allocated_bill_disc;
        END IF;

        v_line_total := v_item.line_net_before_bill_disc - v_allocated_bill_disc;
        v_line_cost := v_item.qty * v_item.unit_cost_price;
        v_line_profit := v_line_total - v_line_cost;

        v_total_selling := v_total_selling + v_line_total;
        v_total_cost := v_total_cost + v_line_cost;
        v_total_profit := v_total_profit + v_line_profit;

        INSERT INTO public.bill_items (
            bill_id, variant_id, product_name, colour, size, qty, unit_selling_price, line_gross, line_discount, allocated_bill_discount, unit_cost_price, line_total, line_cost, line_profit, created_at
        ) VALUES (
            v_bill_id, v_item.variant_id, v_item.product_name, v_item.colour, v_item.size, v_item.qty, v_item.unit_selling_price, v_item.line_gross, v_item.line_discount, v_allocated_bill_disc, v_item.unit_cost_price, v_line_total, v_line_cost, v_line_profit, now()
        );
    END LOOP;

    v_total_discount := v_total_item_discount + v_bill_discount;

    -- 6. Update Bill Header
    UPDATE public.bills
    SET total_discount = v_total_discount,
        total = v_total_selling,
        total_cost = v_total_cost,
        profit = v_total_profit
    WHERE id = v_bill_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number,
        'subtotal', v_subtotal,
        'total_item_discount', v_total_item_discount,
        'bill_discount', v_bill_discount,
        'total_discount', v_total_discount,
        'total', v_total_selling,
        'total_cost', v_total_cost,
        'profit', v_total_profit
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_bill(TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_bill(TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB) TO authenticated;
