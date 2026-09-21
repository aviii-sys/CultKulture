-- ==============================================================================
-- 1. EXTENSIONS & SETUP
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. APP OWNER TABLE (Single-User Enforcement & RLS Anchor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_owner (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.app_owner IS 'Anchors the single authorized owner account. RLS policies verify against this table.';

-- ==============================================================================
-- 3. SHOP SETTINGS (Single-Row Configuration - NO GST)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    shop_name TEXT NOT NULL DEFAULT 'Cult Kulture',
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    bill_footer TEXT NOT NULL DEFAULT 'Thank you for shopping with us! Visit again.',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.shop_settings (id, shop_name)
VALUES (1, 'Cult Kulture')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. LOGIN ATTEMPTS (DB-Backed Rate Limiting: 5 attempts per 15 mins per IP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip, attempted_at DESC);

-- ==============================================================================
-- 5. INVENTORY: PRODUCTS & VARIANTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name) WHERE NOT archived;

CREATE TABLE IF NOT EXISTS public.variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    colour TEXT NOT NULL,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price INTEGER NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    selling_price INTEGER NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 2 CHECK (low_stock_threshold >= 0),
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_colour_size UNIQUE (product_id, colour, size)
);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_low_stock ON public.variants(quantity, low_stock_threshold) WHERE NOT archived;

-- ==============================================================================
-- 6. STOCK ENTRIES (Audit History & Restock Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL CHECK (qty > 0),
    cost_per_unit INTEGER NOT NULL CHECK (cost_per_unit >= 0),
    supplier TEXT,
    purchase_date DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'Asia/Kolkata')::date),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_entries_variant_id ON public.stock_entries(variant_id);

-- ==============================================================================
-- 7. BILL SEQUENCES (Consecutive Concurrency-Safe INV-YYYY-0001)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bill_sequences (
    year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 8. BILLS & BILL ITEMS (Point of Sale, Discounts & Profit Snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
    phone TEXT,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Split')),
    subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    total_item_discount INTEGER NOT NULL DEFAULT 0 CHECK (total_item_discount >= 0),
    bill_discount INTEGER NOT NULL DEFAULT 0 CHECK (bill_discount >= 0),
    total_discount INTEGER NOT NULL DEFAULT 0 CHECK (total_discount >= 0),
    total INTEGER NOT NULL CHECK (total >= 0),
    total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
    profit INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
    notes TEXT,
    pdf_path TEXT,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_status_created ON public.bills(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON public.bills(customer_name, phone);

CREATE TABLE IF NOT EXISTS public.bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    colour TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_selling_price INTEGER NOT NULL CHECK (unit_selling_price >= 0),
    line_gross INTEGER NOT NULL CHECK (line_gross >= 0),
    line_discount INTEGER NOT NULL DEFAULT 0 CHECK (line_discount >= 0),
    allocated_bill_discount INTEGER NOT NULL DEFAULT 0 CHECK (allocated_bill_discount >= 0),
    unit_cost_price INTEGER NOT NULL CHECK (unit_cost_price >= 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0),
    line_cost INTEGER NOT NULL CHECK (line_cost >= 0),
    line_profit INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_variant_id ON public.bill_items(variant_id);

-- ==============================================================================
-- 9. REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.variants;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_owner
        WHERE id = auth.uid()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- Enable and force RLS on all tables
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_settings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bill_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_sequences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.app_owner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_owner FORCE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts FORCE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on shop_settings" ON public.shop_settings FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on products" ON public.products FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on variants" ON public.variants FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on stock_entries" ON public.stock_entries FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bills" ON public.bills FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bill_items" ON public.bill_items FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bill_sequences" ON public.bill_sequences FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner read access on app_owner" ON public.app_owner FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Owner full access on login_attempts" ON public.login_attempts FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

-- ==============================================================================
-- 11. ATOMIC FUNCTION: add_stock_batch
-- ==============================================================================
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
        v_category := trim(p_product->>'category');
        v_brand := trim(p_product->>'brand');

        IF v_product_name IS NULL OR v_product_name = '' THEN
            RAISE EXCEPTION 'Product name is required.';
        END IF;
        IF v_category IS NULL OR v_category = '' THEN
            RAISE EXCEPTION 'Category is required.';
        END IF;

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
        IF v_var.colour IS NULL OR trim(v_var.colour) = '' THEN
            RAISE EXCEPTION 'Variant colour is required.';
        END IF;
        IF v_var.size IS NULL OR trim(v_var.size) = '' THEN
            RAISE EXCEPTION 'Variant size is required.';
        END IF;
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

        -- Check if variant exists
        SELECT id, quantity, cost_price
        INTO v_variant_id, v_current_qty, v_current_cost
        FROM public.variants
        WHERE product_id = v_product_id
          AND lower(colour) = lower(trim(v_var.colour))
          AND lower(size) = lower(trim(v_var.size))
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
                v_product_id, trim(v_var.colour), trim(v_var.size), v_new_qty, v_new_cost, v_var.selling_price, now(), now()
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
            'colour', trim(v_var.colour),
            'size', trim(v_var.size),
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

-- ==============================================================================
-- 12. ATOMIC FUNCTION: create_bill (Item & Bill Discounts + Proportional Allocation)
-- ==============================================================================
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

    -- Temporary table to hold validated line items before insertion
    v_item_list JSONB;
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
                v_variant.product_name, v_variant.colour, v_variant.size, v_variant.quantity, v_item.qty;
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

-- ==============================================================================
-- 13. ATOMIC FUNCTION: void_bill
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.void_bill(
    p_bill_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_bill RECORD;
    v_item RECORD;
BEGIN
    -- 1. Security Check
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can void bills.';
    END IF;

    -- 2. Lock Bill Row
    SELECT id, bill_number, status
    INTO v_bill
    FROM public.bills
    WHERE id = p_bill_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bill % not found.', p_bill_id;
    END IF;
    IF v_bill.status = 'voided' THEN
        RAISE EXCEPTION 'Bill % is already voided.', v_bill.bill_number;
    END IF;

    -- 3. Restore Stock for Each Item
    FOR v_item IN
        SELECT variant_id, qty
        FROM public.bill_items
        WHERE bill_id = p_bill_id
    LOOP
        UPDATE public.variants
        SET quantity = quantity + v_item.qty,
            updated_at = now()
        WHERE id = v_item.variant_id;
    END LOOP;

    -- 4. Mark Bill as Voided
    UPDATE public.bills
    SET status = 'voided',
        voided_at = now(),
        void_reason = p_reason
    WHERE id = p_bill_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', p_bill_id,
        'bill_number', v_bill.bill_number,
        'status', 'voided'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.void_bill(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.void_bill(UUID, TEXT) TO authenticated;

-- ==============================================================================
-- 14. ATOMIC FUNCTION: dashboard_summary (IST Month & Today, Voided Excluded)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.dashboard_summary(
    p_month DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_target_date DATE;
    v_month_start_ist TIMESTAMPTZ;
    v_month_end_ist TIMESTAMPTZ;
    v_today_start_ist TIMESTAMPTZ;
    v_today_end_ist TIMESTAMPTZ;

    v_month_revenue BIGINT := 0;
    v_month_discounts BIGINT := 0;
    v_month_cost BIGINT := 0;
    v_month_profit BIGINT := 0;
    v_month_bills_count BIGINT := 0;
    v_month_items_sold BIGINT := 0;

    v_today_sales BIGINT := 0;
    v_today_cost BIGINT := 0;
    v_today_profit BIGINT := 0;

    v_profit_by_day JSONB;
    v_top_sellers JSONB;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can view dashboard analytics.';
    END IF;

    -- Determine month bounds in IST
    v_target_date := COALESCE(p_month, (now() AT TIME ZONE 'Asia/Kolkata')::DATE);
    v_month_start_ist := date_trunc('month', v_target_date::timestamp)::timestamp AT TIME ZONE 'Asia/Kolkata';
    v_month_end_ist := (date_trunc('month', v_target_date::timestamp) + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata';

    -- Today bounds in IST
    v_today_start_ist := ((now() AT TIME ZONE 'Asia/Kolkata')::DATE)::timestamp AT TIME ZONE 'Asia/Kolkata';
    v_today_end_ist := v_today_start_ist + INTERVAL '1 day';

    -- 1. Month Aggregates (Excluding Voided Bills)
    SELECT
        COALESCE(SUM(b.total), 0),
        COALESCE(SUM(b.total_discount), 0),
        COALESCE(SUM(b.total_cost), 0),
        COALESCE(SUM(b.profit), 0),
        COUNT(b.id)
    INTO
        v_month_revenue,
        v_month_discounts,
        v_month_cost,
        v_month_profit,
        v_month_bills_count
    FROM public.bills b
    WHERE b.status = 'active'
      AND b.created_at >= v_month_start_ist
      AND b.created_at < v_month_end_ist;

    -- Total items sold in month
    SELECT COALESCE(SUM(bi.qty), 0)
    INTO v_month_items_sold
    FROM public.bill_items bi
    JOIN public.bills b ON b.id = bi.bill_id
    WHERE b.status = 'active'
      AND b.created_at >= v_month_start_ist
      AND b.created_at < v_month_end_ist;

    -- 2. Today's Aggregates
    SELECT
        COALESCE(SUM(b.total), 0),
        COALESCE(SUM(b.total_cost), 0),
        COALESCE(SUM(b.profit), 0)
    INTO
        v_today_sales,
        v_today_cost,
        v_today_profit
    FROM public.bills b
    WHERE b.status = 'active'
      AND b.created_at >= v_today_start_ist
      AND b.created_at < v_today_end_ist;

    -- 3. Profit by Day (IST)
    SELECT COALESCE(jsonb_agg(d ORDER BY d->>'date'), '[]'::JSONB)
    INTO v_profit_by_day
    FROM (
        SELECT jsonb_build_object(
            'date', to_char((b.created_at AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD'),
            'revenue', SUM(b.total),
            'discounts', SUM(b.total_discount),
            'cost', SUM(b.total_cost),
            'profit', SUM(b.profit),
            'bills_count', COUNT(b.id)
        ) AS d
        FROM public.bills b
        WHERE b.status = 'active'
          AND b.created_at >= v_month_start_ist
          AND b.created_at < v_month_end_ist
        GROUP BY to_char((b.created_at AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD')
    ) sub;

    -- 4. Top 5 Selling Products/Variants in Month
    SELECT COALESCE(jsonb_agg(ts), '[]'::JSONB)
    INTO v_top_sellers
    FROM (
        SELECT jsonb_build_object(
            'product_name', bi.product_name,
            'colour', bi.colour,
            'size', bi.size,
            'qty_sold', SUM(bi.qty),
            'revenue', SUM(bi.line_total)
        ) AS ts
        FROM public.bill_items bi
        JOIN public.bills b ON b.id = bi.bill_id
        WHERE b.status = 'active'
          AND b.created_at >= v_month_start_ist
          AND b.created_at < v_month_end_ist
        GROUP BY bi.product_name, bi.colour, bi.size
        ORDER BY SUM(bi.qty) DESC
        LIMIT 5
    ) sub_ts;

    RETURN jsonb_build_object(
        'month', to_char(v_target_date, 'YYYY-MM'),
        'month_revenue', v_month_revenue,
        'month_discounts', v_month_discounts,
        'month_cost', v_month_cost,
        'month_profit', v_month_profit,
        'month_bills_count', v_month_bills_count,
        'month_items_sold', v_month_items_sold,
        'today_sales', v_today_sales,
        'today_cost', v_today_cost,
        'today_profit', v_today_profit,
        'profit_by_day', v_profit_by_day,
        'top_sellers', v_top_sellers
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dashboard_summary(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dashboard_summary(DATE) TO authenticated;

-- ==============================================================================
-- 15. PRIVATE STORAGE BUCKET: bills-pdf
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bills-pdf', 'bills-pdf', false, 5242880, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Owner only
CREATE POLICY "Owner access to bills-pdf bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'bills-pdf' AND public.is_owner())
WITH CHECK (bucket_id = 'bills-pdf' AND public.is_owner());
