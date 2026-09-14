-- ==========================================
-- Migration 4: Add QA Role and QC Status
-- ==========================================

-- 1. Add QC status to orders
ALTER TABLE public.orders ADD COLUMN qc_status TEXT DEFAULT 'pending';

-- 2. Add roles array to profiles
-- We use a text array to support multiple roles. We migrate the existing role enum into the array.
ALTER TABLE public.profiles ADD COLUMN roles text[] DEFAULT ARRAY['worker'];

-- Migrate existing role to the new array
UPDATE public.profiles SET roles = ARRAY[role::text];

-- 3. Create get_user_roles function
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS text[] AS $$
  SELECT roles FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Add Policy for QA to read orders
-- QA users need to see ALL orders, not just worker assigned ones.
CREATE POLICY "QA can read orders" ON public.orders FOR SELECT USING ('qa' = ANY(get_user_roles()));

-- QA users can update orders (for QC status)
CREATE POLICY "QA can update orders" ON public.orders FOR UPDATE USING ('qa' = ANY(get_user_roles()));
