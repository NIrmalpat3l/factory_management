-- 1. Ensure all new roles are officially added to the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'qa';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ph';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'accountant';

-- 2. Ensure the profiles table explicitly has the plural `roles` array column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}'::text[];

-- 3. Ensure the helper function exists for checking the plural roles array securely
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS text[] AS $$
  SELECT roles FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Update Profiles RLS to respect both systems
DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles" ON profiles 
FOR ALL 
USING (
  get_user_role()::text = 'admin' OR 
  'admin' = ANY(get_user_roles())
);

-- 5. Update Task Assignments RLS to allow PH (Production Heads) to manage tasks
DROP POLICY IF EXISTS "Admins manage task assignments" ON task_assignments;
CREATE POLICY "Admins and PH manage task assignments" ON task_assignments 
FOR ALL 
USING (
  get_user_role()::text IN ('admin', 'ph') OR 
  'admin' = ANY(get_user_roles()) OR 
  'ph' = ANY(get_user_roles())
)
WITH CHECK (
  get_user_role()::text IN ('admin', 'ph') OR 
  'admin' = ANY(get_user_roles()) OR 
  'ph' = ANY(get_user_roles())
);

-- 6. Update QC RLS to respect both systems
DROP POLICY IF EXISTS "Allow all operations for admin and qa on inspections" ON qc_inspections;
CREATE POLICY "Allow all operations for admin and qa on inspections" ON qc_inspections 
FOR ALL 
USING (
  get_user_role()::text IN ('admin', 'qa') OR 
  'admin' = ANY(get_user_roles()) OR 
  'qa' = ANY(get_user_roles())
) 
WITH CHECK (
  get_user_role()::text IN ('admin', 'qa') OR 
  'admin' = ANY(get_user_roles()) OR 
  'qa' = ANY(get_user_roles())
);

DROP POLICY IF EXISTS "Allow all operations for admin and qa on results" ON qc_inspection_results;
CREATE POLICY "Allow all operations for admin and qa on results" ON qc_inspection_results 
FOR ALL 
USING (
  get_user_role()::text IN ('admin', 'qa') OR 
  'admin' = ANY(get_user_roles()) OR 
  'qa' = ANY(get_user_roles())
) 
WITH CHECK (
  get_user_role()::text IN ('admin', 'qa') OR 
  'admin' = ANY(get_user_roles()) OR 
  'qa' = ANY(get_user_roles())
);
