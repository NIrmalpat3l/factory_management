-- Migration to remove pay_rate from spring_types and rate from task_types

ALTER TABLE public.spring_types DROP COLUMN IF EXISTS pay_rate;
ALTER TABLE public.task_types DROP COLUMN IF EXISTS rate;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
