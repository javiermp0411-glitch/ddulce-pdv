export type Section = 'dashboard' | 'sales' | 'pos' | 'inventory' | 'expenses' | 'users';
export type Period = 'Hoy' | 'Esta semana' | 'Este mes';
export type ProductCategory = 'Paletas' | 'Bolis' | 'Aguas' | 'Botanas';
export type AppRole = 'owner' | 'admin' | 'staff';
export type PermissionKey =
  | 'dashboard.read'
  | 'sales.read'
  | 'sales.create'
  | 'pos.use'
  | 'inventory.read'
  | 'inventory.adjust'
  | 'expenses.read'
  | 'expenses.create'
  | 'users.read'
  | 'users.manage';

export interface NavigationItem {
  id: Section;
  label: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  detail: string;
}

export interface Sale {
  id: string;
  time: string;
  items: string;
  method: string;
  total: number;
}

export interface Expense {
  name: string;
  date: string;
  category: string;
  amount: number;
}

export interface AppUser {
  name: string;
  role: string;
  email: string;
  status: 'Activo' | 'Pendiente';
  initials: string;
}

export interface DashboardMetrics {
  sales: string;
  count: string;
  average: string;
  expenses: string;
  bars: number[];
}
