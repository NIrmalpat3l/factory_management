-- Migration 7: Add Accountant RLS Policies
-- ==================================================

-- 1. Accountant can read orders
CREATE POLICY "Accountants can read orders" ON public.orders FOR SELECT USING ('accountant' = ANY(get_user_roles()));

-- 2. Accountant can read order_items
CREATE POLICY "Accountants can read order items" ON public.order_items FOR SELECT USING ('accountant' = ANY(get_user_roles()));

-- 3. Accountant can read task_assignments
CREATE POLICY "Accountants can read task assignments" ON public.task_assignments FOR SELECT USING ('accountant' = ANY(get_user_roles()));

-- 4. Accountant can read companies
CREATE POLICY "Accountants can read companies" ON public.companies FOR SELECT USING ('accountant' = ANY(get_user_roles()));

-- 5. Accountant can read spring and task configs (already readable by everyone)

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
