-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'worker', 'viewer');
CREATE TYPE order_status AS ENUM ('received', 'in_progress', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('unassigned', 'assigned', 'in_progress', 'done');
CREATE TYPE payout_status AS ENUM ('owed', 'paid');

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Spring Categories
CREATE TABLE spring_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);
ALTER TABLE spring_categories ENABLE ROW LEVEL SECURITY;

-- Spring Parameters
CREATE TABLE spring_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  unit TEXT
);
ALTER TABLE spring_parameters ENABLE ROW LEVEL SECURITY;

-- Spring Category Parameters
CREATE TABLE spring_category_parameters (
  category_id UUID REFERENCES spring_categories(id) ON DELETE CASCADE,
  parameter_id UUID REFERENCES spring_parameters(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (category_id, parameter_id)
);
ALTER TABLE spring_category_parameters ENABLE ROW LEVEL SECURITY;

-- Spring Types
CREATE TABLE spring_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES spring_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  pay_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE spring_types ENABLE ROW LEVEL SECURITY;

-- Spring Type Parameter Values
CREATE TABLE spring_type_parameter_values (
  spring_type_id UUID REFERENCES spring_types(id) ON DELETE CASCADE,
  parameter_id UUID REFERENCES spring_parameters(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  PRIMARY KEY (spring_type_id, parameter_id)
);
ALTER TABLE spring_type_parameter_values ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  status order_status NOT NULL DEFAULT 'received',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date DATE
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  spring_type_id UUID REFERENCES spring_types(id) ON DELETE RESTRICT,
  quantity_ordered INT NOT NULL,
  quantity_completed INT NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Task Assignments
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  quantity_assigned INT NOT NULL,
  quantity_produced INT NOT NULL DEFAULT 0,
  status task_status NOT NULL DEFAULT 'unassigned',
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Pay Ledger
CREATE TABLE pay_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE RESTRICT,
  spring_type_id UUID REFERENCES spring_types(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  rate_applied NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  payout_status payout_status NOT NULL DEFAULT 'owed',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE pay_ledger ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies

-- Profiles
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Everyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Companies
CREATE POLICY "Admins manage companies" ON companies FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Viewers and Workers read companies" ON companies FOR SELECT USING (true);

-- Spring Definitions
CREATE POLICY "Admins manage spring categories" ON spring_categories FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view spring categories" ON spring_categories FOR SELECT USING (true);

CREATE POLICY "Admins manage spring parameters" ON spring_parameters FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view spring parameters" ON spring_parameters FOR SELECT USING (true);

CREATE POLICY "Admins manage spring category parameters" ON spring_category_parameters FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view spring category parameters" ON spring_category_parameters FOR SELECT USING (true);

CREATE POLICY "Admins manage spring types" ON spring_types FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view spring types" ON spring_types FOR SELECT USING (true);

CREATE POLICY "Admins manage spring type values" ON spring_type_parameter_values FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Anyone can view spring type values" ON spring_type_parameter_values FOR SELECT USING (true);

-- Orders
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Viewers and Workers can read orders" ON orders FOR SELECT USING (get_user_role() IN ('viewer', 'worker'));

-- Order Items
CREATE POLICY "Admins manage order items" ON order_items FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Viewers and Workers can read order items" ON order_items FOR SELECT USING (get_user_role() IN ('viewer', 'worker'));

-- Task Assignments
CREATE POLICY "Admins manage task assignments" ON task_assignments FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Viewers can read task assignments" ON task_assignments FOR SELECT USING (get_user_role() = 'viewer');
CREATE POLICY "Workers can read task assignments" ON task_assignments FOR SELECT USING (get_user_role() = 'worker');
CREATE POLICY "Workers can update own tasks or assign unassigned" ON task_assignments FOR UPDATE USING (
  get_user_role() = 'worker' AND (worker_id = auth.uid() OR status = 'unassigned')
);

-- Pay Ledger
CREATE POLICY "Admins manage pay ledger" ON pay_ledger FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "Viewers read pay ledger" ON pay_ledger FOR SELECT USING (get_user_role() = 'viewer');
CREATE POLICY "Workers read own pay ledger" ON pay_ledger FOR SELECT USING (get_user_role() = 'worker' AND worker_id = auth.uid());
