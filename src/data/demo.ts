import type { AppUser, DashboardMetrics, Expense, NavigationItem, Period, Product, Sale, Section } from '../types/app';

export const navigation: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'sales', label: 'Ventas', icon: '↗' },
  { id: 'pos', label: 'Punto de venta', icon: '$' },
  { id: 'inventory', label: 'Almacén', icon: '▤' },
  { id: 'expenses', label: 'Gastos', icon: '↘' },
  { id: 'users', label: 'Usuarios y permisos', icon: '♙' },
];

export const products: Product[] = [
  { id: 'paleta-preparada', name: 'Paleta preparada', category: 'Paletas', price: 20, stock: 18, detail: 'Chamoy y gomitas' },
  { id: 'paleta-agua', name: 'Paleta de agua', category: 'Paletas', price: 15, stock: 24, detail: 'Sabores surtidos' },
  { id: 'paleta-helado', name: 'Paleta de helado', category: 'Paletas', price: 25, stock: 12, detail: 'Cobertura de avellana' },
  { id: 'boli-agua', name: 'Boli de agua', category: 'Bolis', price: 10, stock: 30, detail: 'Piña, uva, limón o fresa' },
  { id: 'boli-leche', name: 'Boli de leche', category: 'Bolis', price: 10, stock: 12, detail: 'Rompope' },
  { id: 'agua-fresca', name: 'Agua fresca · 1 L', category: 'Aguas', price: 20, stock: 10, detail: 'Jamaica o limón' },
  { id: 'mini-barrita', name: 'Mini barrita', category: 'Botanas', price: 4, stock: 20, detail: 'Fresa o piña' },
  { id: 'bolsa-hielo', name: 'Bolsa de hielo · 1 L', category: 'Botanas', price: 6, stock: 15, detail: 'Agua congelada' },
];

export const sampleSales: Sale[] = [
  { id: 'V-1042', time: '12:42 p. m.', items: '2 × Paleta preparada', method: 'Efectivo', total: 40 },
  { id: 'V-1041', time: '12:18 p. m.', items: 'Agua fresca · 1 L', method: 'Efectivo', total: 20 },
  { id: 'V-1040', time: '11:56 a. m.', items: '3 × Boli de agua', method: 'Efectivo', total: 30 },
  { id: 'V-1039', time: '11:21 a. m.', items: 'Paleta de helado', method: 'Efectivo', total: 25 },
];

export const dashboardTotals: Record<Period, DashboardMetrics> = {
  Hoy: { sales: '$685', count: '32', average: '$21.41', expenses: '$80', bars: [24, 32, 42, 28, 56, 42, 70, 52, 88, 62, 96, 74] },
  'Esta semana': { sales: '$3,420', count: '164', average: '$20.85', expenses: '$420', bars: [32, 50, 44, 72, 56, 86, 64, 46, 72, 92, 78, 100] },
  'Este mes': { sales: '$12,850', count: '612', average: '$21.00', expenses: '$1,240', bars: [42, 30, 65, 48, 72, 58, 82, 54, 76, 91, 68, 100] },
};

export const topProducts = [
  { name: 'Paleta preparada', amount: '18 piezas', emoji: '🍓' },
  { name: 'Boli de fresa', amount: '14 piezas', emoji: '🍧' },
  { name: 'Agua de jamaica', amount: '9 piezas', emoji: '🥤' },
  { name: 'Paleta de mango', amount: '7 piezas', emoji: '🥭' },
];

export const sampleExpenses: Expense[] = [
  { name: 'Internet', date: 'Hoy', category: 'Servicio', amount: 125 },
  { name: 'Compra de insumos', date: 'Ayer', category: 'Insumos', amount: 280 },
  { name: 'Luz', date: '1 nov 2026', category: 'Servicio', amount: 500 },
];

export const sampleUsers: AppUser[] = [
  { name: 'Javier Montero', role: 'Propietario', email: 'Administrador del negocio', status: 'Activo', initials: 'JM' },
  { name: 'Guadalupe Conde', role: 'Propietaria', email: 'Administradora del negocio', status: 'Activo', initials: 'GC' },
  { name: 'Personal de caja', role: 'Cajero/a', email: 'Cuenta por configurar', status: 'Pendiente', initials: 'PC' },
];
