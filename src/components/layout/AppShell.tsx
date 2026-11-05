import { useState, type ReactNode } from 'react';
import { navigation } from '../../data/demo';
import type { Section } from '../../types/app';

interface AppShellProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  children: ReactNode;
}

export function AppShell({ activeSection, onNavigate, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentPage = navigation.find((item) => item.id === activeSection)!;
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
            {navigation.map((item) => (
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
            <span className="user-avatar owner-avatar">DD</span>
            <span><strong>Daylú Dulce</strong><small>Propietarios</small></span>
            <span className="more-button" aria-hidden="true">···</span>
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
            <button className="topbar-avatar" aria-label="Perfil de Daylú Dulce">DD</button>
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
