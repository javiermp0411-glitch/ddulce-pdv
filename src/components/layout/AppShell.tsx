import { useState, type ReactNode } from 'react';
import { navigation } from '../../data/demo';
import type { Section } from '../../types/app';

interface AppShellProps {
  activeSection: Section;
  visibleSections: Section[];
  onNavigate: (section: Section) => void;
  onSignOut: () => void;
  userName: string;
  userRole: string;
  userEmail: string;
  children: ReactNode;
}

export function AppShell({
  activeSection,
  visibleSections,
  onNavigate,
  onSignOut,
  userName,
  userRole,
  userEmail,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPage = navigation.find((item) => item.id === activeSection)!;
  const visibleNavigation = navigation.filter((item) => visibleSections.includes(item.id));
  const initials = userName
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'DD';
  const navigate = (section: Section) => {
    onNavigate(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <span className="brand-mark"><i>✿</i></span>
          <span><strong>Daylú Dulce</strong><small>Paletería &amp; antojos</small></span>
        </div>

        <div className="nav-caption">MENÚ PRINCIPAL</div>
        <nav aria-label="Navegación principal">
          <ul>
            {visibleNavigation.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => navigate(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  {item.label}
                  {item.id === 'pos' && <span className="nav-new">CAJA</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          <div className="open-status">
            <span className="open-dot" />
            <span><strong>Negocio abierto</strong><small>Horario de hoy · hasta 5:00 p. m.</small></span>
          </div>
          <div className="sidebar-user">
            <span className="user-avatar owner-avatar">{initials}</span>
            <span className="sidebar-user-info" title={userEmail}>
              <strong>{userName}</strong>
              <small>{userRole}</small>
            </span>
            <button className="signout-button" type="button" onClick={onSignOut} aria-label="Cerrar sesión" title="Cerrar sesión">↪</button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="main-area">
        <header className="topbar">
          <button className="menu-toggle" aria-label="Abrir menú" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div className="breadcrumb">
            <span>Daylú Dulce</span><i>/</i><strong>{currentPage.label}</strong>
          </div>
          <div className="topbar-actions">
            <span className="today-label">Jueves, 5 de noviembre</span>
            <span className="topbar-divider" />
            <button className="topbar-avatar" aria-label={`Sesión de ${userName}`}>{initials}</button>
          </div>
        </header>

        <div className="page-content">
          {children}
          <footer className="page-footer">
            <span>Daylú Dulce <i>·</i> Punto de venta</span>
            <span>Hecho con cariño en Villahermosa, Tabasco ♡</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
