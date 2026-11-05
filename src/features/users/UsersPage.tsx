import { sampleUsers } from '../../data/demo';
import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';

export function UsersPage() {
  return (
    <>
      <PageHeading eyebrow="Acceso al sistema" title="Usuarios y permisos" description="Define quién puede consultar y operar cada sección." />
      <DemoNotice />

      <section className="panel page-panel">
        <div className="panel-heading">
          <div><h2>Equipo</h2><p>Usuarios ilustrativos; el inicio de sesión y los permisos aún no están conectados.</p></div>
          <button className="button button-primary" type="button" onClick={() => window.alert('La gestión de cuentas se habilitará al implementar autenticación.')}>＋ Invitar usuario</button>
        </div>
        <div className="users-list">
          {sampleUsers.map((user) => (
            <article className="user-row" key={user.name}>
              <span className="user-avatar">{user.initials}</span>
              <div className="user-details"><strong>{user.name}</strong><span>{user.email}</span></div>
              <span className="role-badge">{user.role}</span>
              <span className={user.status === 'Activo' ? 'status-pill' : 'stock-pill'}>{user.status}</span>
              <button className="more-button" aria-label={`Más opciones para ${user.name}`}>···</button>
            </article>
          ))}
        </div>
        <div className="permissions-note">
          <span>✳</span>
          <div><strong>Permisos por rol</strong><p>La matriz de permisos se definirá junto con el flujo de usuarios. Por ahora no hay accesos reales configurados.</p></div>
        </div>
      </section>
    </>
  );
}
