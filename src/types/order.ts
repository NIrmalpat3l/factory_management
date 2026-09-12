export type OrderStatus = 'received' | 'in_progress' | 'completed' | 'cancelled';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'done';
export type UserRole = 'admin' | 'worker' | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at?: string;
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
  pay_rate: number;
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
  | 'SPRING CONFIG'
  | 'TASK CONFIG'
  | 'WORKERS'
  | 'USERS';
