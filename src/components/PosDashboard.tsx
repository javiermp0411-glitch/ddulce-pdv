import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './layout/AppShell';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { PosPage } from '../features/pos/PosPage';
import { SalesPage } from '../features/sales/SalesPage';
import { UsersPage } from '../features/users/UsersPage';
import { navigation } from '../data/demo';
import type { AppRole, PermissionKey, Section } from '../types/app';

interface PosDashboardProps {
  role: AppRole;
  permissions: PermissionKey[];
  userEmail: string;
  displayName: string | null;
  onSignOut: () => void;
}

const roleLabels: Record<AppRole, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  staff: 'Personal',
};

function canOpenSection(section: Section, permissions: PermissionKey[]) {
  const sectionPermissions: Record<Section, PermissionKey[]> = {
    dashboard: ['dashboard.read'],
    sales: ['sales.read', 'sales.create'],
    pos: ['pos.use'],
    inventory: ['inventory.read', 'inventory.adjust'],
    expenses: ['expenses.read', 'expenses.create'],
    users: ['users.read', 'users.manage'],
  };

  if (section === 'users') return false;
  return sectionPermissions[section].some((permission) => permissions.includes(permission));
}

export default function PosDashboard({ role, permissions, userEmail, displayName, onSignOut }: PosDashboardProps) {
  const visibleSections = useMemo(
    () => role === 'owner'
      ? navigation.map((item) => item.id)
      : role === 'admin'
        ? navigation.filter((item) => item.id !== 'users').map((item) => item.id)
        : navigation.filter((item) => canOpenSection(item.id, permissions)).map((item) => item.id),
    [role, permissions],
  );
  const [activeSection, setActiveSection] = useState<Section>(visibleSections[0] ?? 'dashboard');
  const userName = displayName?.trim() || userEmail;

  useEffect(() => {
    if (visibleSections.length > 0 && !visibleSections.includes(activeSection)) {
      setActiveSection(visibleSections[0]);
    }
  }, [activeSection, visibleSections]);

  const navigateToSection = (section: Section) => {
    if (visibleSections.includes(section)) {
      setActiveSection(section);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'sales':
        return <SalesPage canManage={role === 'owner' || role === 'admin'} />;
      case 'pos':
        return <PosPage />;
      case 'inventory':
        return <InventoryPage canAdjust={role !== 'staff' || permissions.includes('inventory.adjust')} />;
      case 'expenses':
        return <ExpensesPage />;
      case 'users':
        return <UsersPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={navigateToSection} />;
    }
  };

  return (
    <AppShell
      activeSection={activeSection}
      visibleSections={visibleSections}
      onNavigate={navigateToSection}
      onSignOut={onSignOut}
      userName={userName}
      userRole={roleLabels[role]}
      userEmail={userEmail}
    >
      {renderSection()}
    </AppShell>
  );
}
