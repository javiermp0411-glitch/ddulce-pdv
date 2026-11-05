import { useState } from 'react';
import { AppShell } from './layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { PosPage } from '../features/pos/PosPage';
import { SalesPage } from '../features/sales/SalesPage';
import { UsersPage } from '../features/users/UsersPage';
import type { Section } from '../types/app';

export default function PosDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'sales':
        return <SalesPage />;
      case 'pos':
        return <PosPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'users':
        return <UsersPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={setActiveSection} />;
    }
  };

  return (
    <AppShell activeSection={activeSection} onNavigate={setActiveSection}>
      {renderSection()}
    </AppShell>
  );
}
