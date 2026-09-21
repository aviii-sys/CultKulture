-- ==============================================================================
-- SEED DATA FOR CULT KULTURE STORE
-- ==============================================================================

-- 1. Shop Settings (Default single row, id = 1)
INSERT INTO public.shop_settings (id, shop_name, address, phone, bill_footer, currency_symbol)
VALUES (
    1,
    'Cult Kulture',
    'Main Market, Fashion Street, India',
    '+91 98765 43210',
    'Thank you for shopping with Cult Kulture! Visit again.',
    '₹'
)
ON CONFLICT (id) DO UPDATE SET
    shop_name = EXCLUDED.shop_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    bill_footer = EXCLUDED.bill_footer,
    currency_symbol = EXCLUDED.currency_symbol;

-- 2. Owner User Setup Placeholder
-- After creating the owner user in Supabase Auth (Dashboard -> Authentication -> Users -> Add User),
-- execute the following with the generated UUID and email:
--
-- INSERT INTO public.app_owner (id, email)
-- VALUES ('YOUR_AUTH_USER_UUID_HERE', 'owner@example.com')
-- ON CONFLICT (id) DO NOTHING;
