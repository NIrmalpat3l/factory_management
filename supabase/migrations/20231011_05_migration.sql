-- Migration 5: Accountant Role, Salary, and Invoices
-- ==================================================

-- 1. Add accountant to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';

-- 2. Add salary to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salary NUMERIC(10,2) DEFAULT 0;

-- 3. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'unpaid',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for invoices
CREATE POLICY "Admins and Accountants manage invoices" ON public.invoices 
FOR ALL USING (
    'admin' = ANY(get_user_roles()) OR 'accountant' = ANY(get_user_roles())
);

CREATE POLICY "Everyone else can view invoices" ON public.invoices 
FOR SELECT USING (true);

-- 5. Update profiles RLS to let accountants view and admins update salary
-- (Already handled by "Admins manage all profiles" and "Everyone can view profiles" in init.sql)

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
