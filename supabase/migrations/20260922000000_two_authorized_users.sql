-- ==============================================================================
-- PHASE 10: TWO AUTHORIZED USERS & AUTHORIZATION MODEL UPDATE
-- ==============================================================================

-- 1. Insert second authorized user into public.app_owner table
INSERT INTO public.app_owner (id, email)
VALUES ('80f05290-33de-45b2-8b62-08bfabf7b568', 'rhythamsaini99@gmail.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Update is_owner() function with explicit auth.uid() check
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.app_owner
        WHERE id = auth.uid()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;

-- 3. Update RLS policy on app_owner so both authorized users can read app_owner records
DROP POLICY IF EXISTS "Owner read access on app_owner" ON public.app_owner;
DROP POLICY IF EXISTS "Authorized users read access on app_owner" ON public.app_owner;

CREATE POLICY "Authorized users read access on app_owner" 
ON public.app_owner 
FOR SELECT 
TO authenticated 
USING (public.is_owner());
