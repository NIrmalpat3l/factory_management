export type Role = 'admin' | 'worker';

export interface WorkerProfile {
  id: number;
  name: string;
  contact: string;
  email: string | null;
  role: Role;
  active: boolean;
  auth_id: string | null;
  created_at: string;
}
