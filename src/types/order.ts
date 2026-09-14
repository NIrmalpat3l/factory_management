export type OrderStatus = 'received' | 'in_progress' | 'completed' | 'cancelled';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'done';
export type UserRole = 'admin' | 'worker' | 'viewer' | 'qa' | 'accountant';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole; // Legacy
  roles?: UserRole[]; // New roles array
  phone: string | null;
  is_active: boolean;
  salary?: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  amount: number;
  status: 'unpaid' | 'paid';
  generated_at: string;
  paid_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  contact_info?: string;
}

export interface Order {
  id: string;
  order_number: string;
  company_id: string;
  status: OrderStatus;
  qc_status?: 'pending' | 'passed' | 'failed';
  created_at: string;
  due_date: string | null;

  company?: Company;
  order_items?: {
    id: string;
    quantity_ordered: number;
    quantity_completed: number;
    spring_type_id: string;
    spring_types?: { name: string };
    task_assignments?: TaskAssignment[];
    dimensions?: Record<string, number>; // Maps parameter_id -> value
  }[];

  // Virtual fields added in API response
  company_name?: string;
  total_qty_ordered?: number;
  total_qty_completed?: number;
  spring_names?: string;
  assigned_worker_name?: string;
  assigned_worker_id?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  spring_type_id: string;
  quantity_ordered: number;
  quantity_completed: number;

  // Joined fields
  spring_type_name?: string;
}

export interface TaskAssignment {
  id: string;
  order_item_id: string;
  worker_id: string | null;
  manual_worker_name?: string | null;
  task_type_id: string | null;
  quantity_assigned: number;
  quantity_produced: number;
  status: TaskStatus;
  assigned_at?: string;
  completed_at?: string;

  // Joined fields
  order_number?: string;
  company_name?: string;
  spring_type_name?: string;
  worker_name?: string;
  task_type_name?: string;
  profiles?: { full_name?: string; salary?: number };
}

export interface TaskType {
  id: string;
  name: string;
  created_at?: string;
}

export interface SpringCategory {
  id: string;
  name: string;
}

export interface QCInspectionResult {
  id: string;
  inspection_id: string;
  parameter_id: string;
  expected_value?: number;
  actual_value: number;
  is_passed: boolean;
  created_at?: string;
}

export interface QCInspection {
  id: string;
  order_id: string;
  stage: 'in_progress' | 'after_completion';
  status: 'passed' | 'failed' | 'pending';
  inspector_id?: string;
  notes?: string;
  created_at?: string;
  results?: QCInspectionResult[];
}

export interface SpringParameter {
  id: string;
  code: string;
  label: string;
  unit: string | null;
}

export interface SpringType {
  id: string;
  category_id: string;
  name: string;
  created_at?: string;
  // Joined
  category_name?: string;
  parameters?: SpringTypeParam[];
}

export interface SpringTypeParam {
  parameter_id: string;
  value: number;
  // Joined from spring_parameters
  code?: string;
  label?: string;
  unit?: string | null;
}

export interface OrderStats {
  total: number;
  received: number;
  in_progress: number;
  completed: number;
  cancelled: number;
}

export type ActiveTab =
  | 'ALL ORDERS'
  | 'RECEIVED'
  | 'IN PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'QA PORTAL'
  | 'SPRING CONFIG'
  | 'TASK CONFIG'
  | 'WORKERS'
  | 'USERS'
  | 'ACCOUNTING';
