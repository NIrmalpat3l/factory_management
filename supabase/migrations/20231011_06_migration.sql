-- Migration 6: Add rate to task_types
-- ==================================================

-- 1. Create task_types table if it doesn't exist 
-- (Assuming it might already exist based on earlier code, but we ensure it exists)
CREATE TABLE IF NOT EXISTS public.task_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    rate NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: In init.sql there was no task_types table, but task_assignments referenced task_type_id maybe?
-- Wait, init.sql didn't have task_type_id in task_assignments. It just had `worker_id` and `order_item_id`.
-- However, order.ts TaskAssignment has `task_type_id`. So it must have been added in a previous migration.
-- Let's just safely add the column.
ALTER TABLE public.task_types ADD COLUMN IF NOT EXISTS rate NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
