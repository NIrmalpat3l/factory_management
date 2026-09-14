-- Add qa to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'qa';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ph';

-- QC Inspections
CREATE TABLE qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('in_progress', 'after_completion')),
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
  inspector_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;

-- QC Inspection Results
CREATE TABLE qc_inspection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES qc_inspections(id) ON DELETE CASCADE,
  parameter_id UUID REFERENCES spring_parameters(id) ON DELETE CASCADE,
  expected_value NUMERIC,
  actual_value NUMERIC NOT NULL,
  is_passed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE qc_inspection_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins manage qc inspections" ON qc_inspections;
DROP POLICY IF EXISTS "QA and Admins can insert qc inspections" ON qc_inspections;
DROP POLICY IF EXISTS "QA and Admins can update qc inspections" ON qc_inspections;
DROP POLICY IF EXISTS "QA can view qc inspections" ON qc_inspections;

CREATE POLICY "Allow all operations for admin and qa on inspections" ON qc_inspections FOR ALL USING (get_user_role()::text IN ('admin', 'qa')) WITH CHECK (get_user_role()::text IN ('admin', 'qa'));
CREATE POLICY "Allow select for others on inspections" ON qc_inspections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage qc inspection results" ON qc_inspection_results;
DROP POLICY IF EXISTS "QA and Admins can insert qc results" ON qc_inspection_results;
DROP POLICY IF EXISTS "QA and Admins can delete qc results" ON qc_inspection_results;
DROP POLICY IF EXISTS "QA can view qc results" ON qc_inspection_results;

CREATE POLICY "Allow all operations for admin and qa on results" ON qc_inspection_results FOR ALL USING (get_user_role()::text IN ('admin', 'qa')) WITH CHECK (get_user_role()::text IN ('admin', 'qa'));
CREATE POLICY "Allow select for others on results" ON qc_inspection_results FOR SELECT USING (true);
