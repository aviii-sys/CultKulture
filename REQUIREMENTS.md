# Requirements & System Architecture: Clothing Store Manager (Inventory, Billing & Profit Dashboard)

A private, mobile-first inventory, point-of-sale (POS) billing, and live profit dashboard tailored for a single clothing-store owner in India. Built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase (PostgreSQL, Auth, Realtime, Storage).

---

## 1. System Architecture & Folder Structure

The application follows the Next.js App Router pattern, isolating the authenticated dashboard routes behind middleware and layout guards. It uses server actions and API route handlers for secure operations (calling Supabase RPCs and generating signed URLs), with `@supabase/ssr` handling secure, httpOnly session cookies.

```
clothing-store-manager/
├── .env.example
├── .env.local                          # Environment variables (SUPABASE_SERVICE_ROLE_KEY never exposed to client)
├── package.json
├── tsconfig.json
├── tailwind.config.ts                  # Tailwind theme, custom colors, animations
├── components.json                     # shadcn/ui configuration
├── supabase/
│   ├── migrations/
│   │   └── 20260921000000_initial_schema.sql  # Full schema, RLS, functions & triggers
│   └── seed.sql                        # Initial shop_settings & sequence setup
├── src/
│   ├── middleware.ts                   # Route guard + session refresh + single-user email validation
│   ├── app/
│   │   ├── layout.tsx                  # Root HTML, Inter font, ThemeProvider, Toaster
│   │   ├── globals.css                 # CSS variables, HSL color tokens, dark mode styles
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx            # Clean, mobile-first single-user login screen
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Authenticated shell (mobile bottom nav, desktop sidebar, top header)
│   │   │   ├── page.tsx                # Live Dashboard (Today & Month's Profit, COGS, Realtime Feed)
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx            # Inventory list, low-stock badges, search & filters
│   │   │   │   ├── add/
│   │   │   │   │   └── page.tsx        # Add/Restock multi-variant matrix (colour/size/cost/selling)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Product detail, variant edit, stock addition history
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx            # High-speed POS counter (search, cart, bargaining, instant stock check)
│   │   │   │   ├── history/
│   │   │   │   │   └── page.tsx        # Bills list (search by bill no, customer, phone, date)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Bill detail view, void button, PDF preview, WhatsApp share
│   │   │   ├── settings/
│   │   │   │   └── page.tsx            # Shop profile (name, address, phone, GSTIN, logo, footer)
│   │   │   └── reports/
│   │   │       └── page.tsx            # Monthly analytics, CSV exports (bills/inventory), backup status
│   │   └── api/
│   │       ├── auth/
│   │       │   └── signout/
│   │       │       └── route.ts        # Secure session termination
│   │       ├── bills/
│   │       │   ├── route.ts            # Invoke atomic create_bill RPC
│   │       │   └── [id]/
│   │       │       ├── pdf/
│   │       │       │   └── route.ts        # Generate & upload PDF / return 15-min signed URL
│   │       │       └── void/
│   │       │           └── route.ts        # Invoke atomic void_bill RPC
│   │       └── export/
│   │           ├── bills-csv/
│   │           │   └── route.ts        # Streaming CSV export for bills
│   │           └── inventory-csv/
│   │               └── route.ts        # Streaming CSV export for inventory
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components (button, dialog, input, table, badge, sheet, etc.)
│   │   ├── common/
│   │   │   ├── app-header.tsx          # Top bar with shop name, date, connection indicator
│   │   │   ├── bottom-nav.tsx          # Mobile navigation bar (Dashboard, POS, Inventory, Bills)
│   │   │   ├── sidebar.tsx             # Desktop collapsible sidebar
│   │   │   ├── rupee-display.tsx       # Indian currency formatter component (₹1,25,000)
│   │   │   └── empty-state.tsx
│   │   ├── dashboard/
│   │   │   ├── profit-hero-card.tsx    # "This Month's Profit" highlighted card
│   │   │   ├── metrics-grid.tsx        # Revenue, COGS, Bills count, Items sold, Today's metrics
│   │   │   ├── profit-chart.tsx        # Recharts daily profit trend (IST month)
│   │   │   ├── recent-bills-feed.tsx   # Realtime live feed of counter transactions
│   │   │   └── low-stock-alert.tsx     # Warning badge list for variants <= threshold
│   │   ├── inventory/
│   │   │   ├── variant-matrix-form.tsx # Dynamic rows for colours/sizes/cost/selling
│   │   │   ├── product-table.tsx       # Expandable table with search and filters
│   │   │   └── stock-history-modal.tsx # Historical stock entries log
│   │   ├── billing/
│   │   │   ├── pos-cart.tsx            # Sticky cart drawer with line-item price editing
│   │   │   ├── product-picker.tsx      # Quick product search with stock pill badges
│   │   │   ├── customer-form.tsx       # Customer name, +91 phone normalizer, payment mode selector
│   │   │   └── whatsapp-modal.tsx      # Web Share API trigger / wa.me fallback dialog
│   │   └── pdf/
│   │       └── bill-receipt-doc.tsx    # Clean receipt document template
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client (createBrowserClient)
│   │   │   ├── server.ts               # Server Supabase client with cookie handlers
│   │   │   └── admin.ts                # Server-only service-role client (for migrations/storage/auth checks)
│   │   ├── utils/
│   │   │   ├── currency.ts             # formatIndianRupees (Intl.NumberFormat with en-IN)
│   │   │   ├── dates.ts                # IST timezone utilities (formatISTDate, getISTMonthBounds)
│   │   │   ├── phone.ts                # Indian phone number normalizer (+91 format validation)
│   │   │   └── pdf.ts                  # Server-side PDF renderer utility
│   │   ├── validations/
│   │   │   ├── bill.ts                 # Zod validation schema for bill creation
│   │   │   ├── product.ts              # Zod validation schema for product & variants
│   │   │   └── stock.ts                # Zod validation schema for stock entries
│   │   └── rate-limiter.ts             # In-memory / edge rate limiter for login attempts
│   ├── hooks/
│   │   ├── use-realtime-bills.ts       # Supabase Realtime channel listener for bills & inventory
│   │   ├── use-cart.ts                 # Zustand POS cart store (items, price overrides, customer info)
│   │   └── use-keyboard-shortcuts.ts   # Keyboard navigation for fast POS checkout
│   └── types/
│       ├── database.types.ts           # Auto-generated Supabase database types
│       └── index.ts                    # UI & domain type definitions
```

---

## 2. Full Supabase Database Schema (SQL)

All financial amounts are stored as integers in whole Rupees (with non-negative constraints). Realtime is enabled on bills and variants. Timezones are explicitly handled in `Asia/Kolkata`.

```sql
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);
COMMENT ON TABLE public.app_owner IS 'Anchors the single authorized owner account. RLS policies verify against this table.';

-- ==============================================================================
-- 3. SHOP SETTINGS (Single-Row Configuration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shop_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    shop_name TEXT NOT NULL DEFAULT 'My Clothing Store',
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    gstin TEXT,
    bill_footer TEXT NOT NULL DEFAULT 'Thank you for shopping with us! Visit again.',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- Insert default row if not exists
INSERT INTO public.shop_settings (id, shop_name)
VALUES (1, 'My Clothing Store')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. INVENTORY: PRODUCTS & VARIANTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    CONSTRAINT uq_product_colour_size UNIQUE (product_id, colour, size)
);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_low_stock ON public.variants(quantity, low_stock_threshold) WHERE NOT archived;

-- ==============================================================================
-- 5. STOCK ENTRIES (Audit History & Restock Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.variants(id) ON DELETE RESTRICT,
    qty INTEGER NOT NULL CHECK (qty > 0),
    cost_per_unit INTEGER NOT NULL CHECK (cost_per_unit >= 0),
    supplier TEXT,
    purchase_date DATE NOT NULL DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);
CREATE INDEX IF NOT EXISTS idx_stock_entries_variant_id ON public.stock_entries(variant_id);

-- ==============================================================================
-- 6. BILL SEQUENCES (Consecutive Concurrency-Safe INV-YYYY-0001)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bill_sequences (
    year INTEGER PRIMARY KEY,
    last_number INTEGER NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 7. BILLS & BILL ITEMS (Point of Sale & Profit Snapshots)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'UPI', 'Card', 'Split')),
    total INTEGER NOT NULL CHECK (total >= 0),
    total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
    profit INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'voided')),
    notes TEXT,
    pdf_path TEXT,
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
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
    unit_cost_price INTEGER NOT NULL CHECK (unit_cost_price >= 0),
    line_total INTEGER NOT NULL CHECK (line_total >= 0),
    line_cost INTEGER NOT NULL CHECK (line_cost >= 0),
    line_profit INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_variant_id ON public.bill_items(variant_id);

-- ==============================================================================
-- 8. REALTIME REPLICATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
ALTER PUBLICATION supabase_realtime ADD TABLE public.variants;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_owner
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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

CREATE POLICY "Owner full access on shop_settings" ON public.shop_settings FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on products" ON public.products FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on variants" ON public.variants FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on stock_entries" ON public.stock_entries FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bills" ON public.bills FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bill_items" ON public.bill_items FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner full access on bill_sequences" ON public.bill_sequences FOR ALL TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());
CREATE POLICY "Owner read access on app_owner" ON public.app_owner FOR SELECT TO authenticated USING (id = auth.uid());
```

---

## 3. Atomic Postgres Functions

### A. Restock Function with Weighted-Average Cost (`add_stock_entry`)
Formula:
$$\text{new\_cost} = \frac{(\text{existing\_qty} \times \text{existing\_cost}) + (\text{added\_qty} \times \text{added\_cost})}{\text{existing\_qty} + \text{added\_qty}}$$

```sql
CREATE OR REPLACE FUNCTION public.add_stock_entry(
    p_variant_id UUID,
    p_qty INTEGER,
    p_cost_per_unit INTEGER,
    p_supplier TEXT DEFAULT NULL,
    p_purchase_date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Kolkata'),
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_qty INTEGER;
    v_current_cost INTEGER;
    v_new_qty INTEGER;
    v_new_cost INTEGER;
    v_entry_id UUID;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can add stock.';
    END IF;
    IF p_qty <= 0 THEN
        RAISE EXCEPTION 'Quantity added must be greater than zero.';
    END IF;
    IF p_cost_per_unit < 0 THEN
        RAISE EXCEPTION 'Cost price cannot be negative.';
    END IF;

    SELECT quantity, cost_price
    INTO v_current_qty, v_current_cost
    FROM public.variants
    WHERE id = p_variant_id AND NOT archived
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant not found or is archived.';
    END IF;

    v_new_qty := v_current_qty + p_qty;
    IF v_current_qty > 0 THEN
        v_new_cost := ROUND(
            ((v_current_qty::NUMERIC * v_current_cost::NUMERIC) + (p_qty::NUMERIC * p_cost_per_unit::NUMERIC))
            / v_new_qty::NUMERIC
        );
    ELSE
        v_new_cost := p_cost_per_unit;
    END IF;

    UPDATE public.variants
    SET quantity = v_new_qty,
        cost_price = v_new_cost,
        updated_at = timezone('Asia/Kolkata', now())
    WHERE id = p_variant_id;

    INSERT INTO public.stock_entries (variant_id, qty, cost_per_unit, supplier, purchase_date, notes)
    VALUES (p_variant_id, p_qty, p_cost_per_unit, p_supplier, p_purchase_date, p_notes)
    RETURNING id INTO v_entry_id;

    RETURN jsonb_build_object(
        'success', true,
        'stock_entry_id', v_entry_id,
        'previous_qty', v_current_qty,
        'new_qty', v_new_qty,
        'previous_cost', v_current_cost,
        'new_cost', v_new_cost
    );
END;
$$;
```

### B. Atomic Bill Creation Function (`create_bill`)

```sql
CREATE OR REPLACE FUNCTION public.create_bill(
    p_customer_name TEXT,
    p_phone TEXT,
    p_payment_mode TEXT,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_year INTEGER;
    v_seq_num INTEGER;
    v_bill_number TEXT;
    v_bill_id UUID;
    v_total_selling INTEGER := 0;
    v_total_cost INTEGER := 0;
    v_total_profit INTEGER := 0;
    v_item RECORD;
    v_variant RECORD;
    v_line_total INTEGER;
    v_line_cost INTEGER;
    v_line_profit INTEGER;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can create bills.';
    END IF;
    IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Customer name is required.';
    END IF;
    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'A bill must contain at least one item.';
    END IF;
    IF p_payment_mode NOT IN ('Cash', 'UPI', 'Card', 'Split') THEN
        RAISE EXCEPTION 'Invalid payment mode: %', p_payment_mode;
    END IF;

    v_current_year := EXTRACT(YEAR FROM (now() AT TIME ZONE 'Asia/Kolkata'))::INTEGER;
    
    INSERT INTO public.bill_sequences (year, last_number)
    VALUES (v_current_year, 1)
    ON CONFLICT (year) DO UPDATE
    SET last_number = public.bill_sequences.last_number + 1
    RETURNING last_number INTO v_seq_num;
    v_bill_number := 'INV-' || v_current_year::TEXT || '-' || LPAD(v_seq_num::TEXT, 4, '0');

    INSERT INTO public.bills (
        bill_number,
        customer_name,
        phone,
        payment_mode,
        total,
        total_cost,
        profit,
        status,
        notes,
        created_at
    )
    VALUES (
        v_bill_number,
        trim(p_customer_name),
        trim(p_phone),
        p_payment_mode,
        0,
        0,
        0,
        'active',
        p_notes,
        timezone('Asia/Kolkata', now())
    )
    RETURNING id INTO v_bill_id;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        variant_id UUID,
        qty INTEGER,
        unit_selling_price INTEGER
    )
    LOOP
        IF v_item.qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;
        IF v_item.unit_selling_price < 0 THEN
            RAISE EXCEPTION 'Unit selling price cannot be negative.';
        END IF;

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

        v_line_total := v_item.qty * v_item.unit_selling_price;
        v_line_cost := v_item.qty * v_variant.cost_price;
        v_line_profit := v_line_total - v_line_cost;
        v_total_selling := v_total_selling + v_line_total;
        v_total_cost := v_total_cost + v_line_cost;
        v_total_profit := v_total_profit + v_line_profit;

        UPDATE public.variants
        SET quantity = quantity - v_item.qty,
            updated_at = timezone('Asia/Kolkata', now())
        WHERE id = v_item.variant_id;

        INSERT INTO public.bill_items (
            bill_id,
            variant_id,
            product_name,
            colour,
            size,
            qty,
            unit_selling_price,
            unit_cost_price,
            line_total,
            line_cost,
            line_profit
        )
        VALUES (
            v_bill_id,
            v_item.variant_id,
            v_variant.product_name,
            v_variant.colour,
            v_variant.size,
            v_item.qty,
            v_item.unit_selling_price,
            v_variant.cost_price,
            v_line_total,
            v_line_cost,
            v_line_profit
        );
    END LOOP;

    UPDATE public.bills
    SET total = v_total_selling,
        total_cost = v_total_cost,
        profit = v_total_profit
    WHERE id = v_bill_id;

    RETURN jsonb_build_object(
        'success', true,
        'bill_id', v_bill_id,
        'bill_number', v_bill_number,
        'total', v_total_selling,
        'total_cost', v_total_cost,
        'profit', v_total_profit
    );
END;
$$;
```

### C. Atomic Bill Void Function (`void_bill`)

```sql
CREATE OR REPLACE FUNCTION public.void_bill(
    p_bill_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bill RECORD;
    v_item RECORD;
BEGIN
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Unauthorized: Only the shop owner can void bills.';
    END IF;

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

    FOR v_item IN
        SELECT variant_id, qty
        FROM public.bill_items
        WHERE bill_id = p_bill_id
    LOOP
        UPDATE public.variants
        SET quantity = quantity + v_item.qty,
            updated_at = timezone('Asia/Kolkata', now())
        WHERE id = v_item.variant_id;
    END LOOP;

    UPDATE public.bills
    SET status = 'voided',
        voided_at = timezone('Asia/Kolkata', now()),
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
```

---

## 4. Single-User Security Architecture

1. **Supabase Auth Anti-Registration Trigger**: Rejects signup on `auth.users` if email does not match the configured `OWNER_EMAIL`.
2. **Next.js Edge Middleware**: Session refresh and strict email check via `@supabase/ssr`. Unauthenticated or non-owner requests are redirected to `/login`.
3. **Login Rate Limiting**: In-memory sliding-window limiter on `/login` to mitigate brute-force attacks.
4. **Private Storage Bucket (`bills-pdf`)**: Short-lived (15 min) signed URLs for receipts.
5. **Secrets Isolation**: `SUPABASE_SERVICE_ROLE_KEY` strictly on server side.
