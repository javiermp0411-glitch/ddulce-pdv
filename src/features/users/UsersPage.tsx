import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';
import { PageHeading } from '../../components/ui/PageHeading';
import type { AppRole, PermissionKey } from '../../types/app';

type UserStatus = 'pending' | 'active' | 'disabled';
type OperationalPermission = Exclude<PermissionKey, 'users.read' | 'users.manage'>;

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: AppRole;
  status: UserStatus;
  must_set_password: boolean;
  created_at: string;
}

interface UserPermission {
  user_id: string;
  permission_key: PermissionKey;
}

interface UserDraft {
  role: 'admin' | 'staff';
  status: UserStatus;
  permissions: OperationalPermission[];
}

const permissionOptions: { key: OperationalPermission; label: string }[] = [
  { key: 'dashboard.read', label: 'Consultar dashboard' },
  { key: 'sales.read', label: 'Consultar ventas' },
  { key: 'sales.create', label: 'Registrar ventas' },
  { key: 'pos.use', label: 'Usar punto de venta' },
  { key: 'inventory.read', label: 'Consultar almacén' },
  { key: 'inventory.adjust', label: 'Ajustar inventario' },
  { key: 'expenses.read', label: 'Consultar gastos' },
  { key: 'expenses.create', label: 'Registrar gastos' },
];

const statusLabels: Record<UserStatus, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  disabled: 'Desactivado',
};

function getInitials(profile: Profile) {
  const source = profile.display_name?.trim() || profile.email;
  return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function toDraft(profile: Profile, permissions: UserPermission[]): UserDraft {
  return {
    role: profile.role === 'admin' ? 'admin' : 'staff',
    status: profile.status,
    permissions: permissions
      .filter((permission) => permission.user_id === profile.id)
      .map((permission) => permission.permission_key)
      .filter((key): key is OperationalPermission => key !== 'users.read' && key !== 'users.manage'),
  };
}

function hasDraftChanges(profile: Profile, draft: UserDraft, permissions: UserPermission[]) {
  if (profile.role !== draft.role || profile.status !== draft.status) return true;
  if (draft.role === 'admin') return false;

  const savedPermissions = toDraft(profile, permissions).permissions;
  return savedPermissions.length !== draft.permissions.length
    || savedPermissions.some((permission) => !draft.permissions.includes(permission));
}

export function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [drafts, setDrafts] = useState<Record<string, UserDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [savingUserId, setSavingUserId] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
  const [invitePermissions, setInvitePermissions] = useState<OperationalPermission[]>(['pos.use']);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const [profileResult, permissionResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, display_name, role, status, must_set_password, created_at')
        .order('created_at', { ascending: false })
        .overrideTypes<Profile[], { merge: false }>(),
      supabase
        .from('user_permissions')
        .select('user_id, permission_key')
        .overrideTypes<UserPermission[], { merge: false }>(),
    ]);

    if (profileResult.error || permissionResult.error) {
      setError('No se pudo cargar el equipo. Verifica que tu cuenta owner tenga acceso y vuelve a intentar.');
      setIsLoading(false);
      return;
    }

    const nextProfiles = profileResult.data ?? [];
    const nextPermissions = permissionResult.data ?? [];
    setProfiles(nextProfiles);
    setPermissions(nextPermissions);
    setDrafts(Object.fromEntries(nextProfiles.map((profile) => [profile.id, toDraft(profile, nextPermissions)])));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const togglePermission = (
    current: OperationalPermission[],
    permission: OperationalPermission,
  ) => current.includes(permission)
    ? current.filter((item) => item !== permission)
    : [...current, permission];

  const inviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsInviting(true);
    setError('');
    setNotice('');

    const { error: inviteError } = await supabase.functions.invoke('invite-user', {
      body: {
        email: inviteEmail.trim(),
        displayName: inviteName.trim(),
        role: inviteRole,
        permissions: inviteRole === 'staff' ? invitePermissions : [],
      },
    });

    if (inviteError) {
      let serverMessage = '';
      if (inviteError.context instanceof Response) {
        const details = await inviteError.context.clone().json().catch(() => null) as { error?: unknown } | null;
        if (typeof details?.error === 'string') serverMessage = details.error;
      }
      setError(serverMessage || 'No se pudo enviar la invitación. Revisa la conexión e inténtalo de nuevo.');
      setIsInviting(false);
      return;
    }

    setNotice(`Invitación enviada a ${inviteEmail.trim()}. La persona configurará su contraseña desde el correo.`);
    setInviteName('');
    setInviteEmail('');
    setInviteRole('staff');
    setInvitePermissions(['pos.use']);
    setInviteOpen(false);
    setIsInviting(false);
    await loadUsers();
  };

  const saveUser = async (profile: Profile) => {
    const draft = drafts[profile.id];
    if (!draft || profile.role === 'owner') return;
    setSavingUserId(profile.id);
    setError('');
    setNotice('');

    const { error: accessError } = await supabase.rpc('owner_update_user_access', {
      target_user_id: profile.id,
      requested_role: draft.role,
      requested_status: draft.status,
      requested_permissions: draft.role === 'staff' ? draft.permissions : [],
    });

    if (accessError) {
      setError(`No se pudieron guardar los cambios de ${profile.email}.`);
      setSavingUserId('');
      return;
    }

    setNotice(`Cambios guardados para ${profile.email}.`);
    setSavingUserId('');
    await loadUsers();
  };

  const setDraft = (profileId: string, update: Partial<UserDraft>) => {
    setDrafts((current) => ({
      ...current,
      [profileId]: { ...current[profileId], ...update },
    }));
  };

  return (
    <>
      <PageHeading eyebrow="Acceso al sistema" title="Usuarios y permisos" description="Invita al equipo y define qué módulos puede consultar u operar cada persona." />

      {error && <p className="user-feedback user-feedback-error" role="alert">{error}</p>}
      {notice && <p className="user-feedback" role="status">{notice}</p>}

      <section className="panel page-panel users-panel">
        <div className="panel-heading">
          <div>
            <h2>Equipo</h2>
            <p>Solo las cuentas owner pueden consultar o modificar esta sección.</p>
          </div>
          <button className="button button-primary" type="button" onClick={() => setInviteOpen((open) => !open)}>
            {inviteOpen ? 'Cancelar' : '＋ Invitar usuario'}
          </button>
        </div>

        {inviteOpen && (
          <form className="user-invite-form" onSubmit={inviteUser}>
            <h3>Invitar a una persona</h3>
            <div className="user-form-grid">
              <label>Nombre
                <input value={inviteName} onChange={(event) => setInviteName(event.target.value)} maxLength={120} required />
              </label>
              <label>Correo electrónico
                <input type="email" autoComplete="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
              </label>
              <label>Rol
                <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'admin' | 'staff')}>
                  <option value="staff">Personal</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
            </div>
            {inviteRole === 'staff' ? (
              <fieldset className="permission-options">
                <legend>Permisos de módulos</legend>
                {permissionOptions.map(({ key, label }) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={invitePermissions.includes(key)}
                      onChange={() => setInvitePermissions((current) => togglePermission(current, key))}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="user-hint">El rol administrador accede a todos los módulos operativos, excepto Usuarios y permisos.</p>
            )}
            <p className="user-hint">La cuenta se crea al enviar la invitación; la persona no necesita registrarse antes.</p>
            <button className="button button-primary" type="submit" disabled={isInviting}>
              {isInviting ? 'Enviando invitación…' : 'Enviar invitación'}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="user-empty">Cargando equipo…</p>
        ) : profiles.length === 0 ? (
          <p className="user-empty">Todavía no hay cuentas para mostrar.</p>
        ) : (
          <div className="users-list">
            {profiles.map((profile) => {
              const draft = drafts[profile.id];
              const isOwner = profile.role === 'owner';
              const hasChanges = draft ? hasDraftChanges(profile, draft, permissions) : false;
              return (
                <article className="user-card" key={profile.id}>
                  <div className="user-row">
                    <span className="user-avatar">{getInitials(profile)}</span>
                    <div className="user-details">
                      <strong>{profile.display_name || profile.email}</strong>
                      <span>{profile.email} · {new Date(profile.created_at).toLocaleDateString('es-MX')}</span>
                    </div>
                    <span className="role-badge">{isOwner ? 'Owner' : profile.role === 'admin' ? 'Administrador' : 'Personal'}</span>
                    <span className={profile.status === 'active' ? 'status-pill' : 'stock-pill'}>
                      {profile.must_set_password && profile.status === 'active' ? 'Invitación enviada' : statusLabels[profile.status]}
                    </span>
                  </div>

                  {isOwner ? (
                    <p className="user-hint">Las cuentas owner no se pueden modificar desde esta pantalla.</p>
                  ) : draft && (
                    <div className="user-access-form">
                      <div className="user-form-grid">
                        <label>Rol
                          <select value={draft.role} onChange={(event) => setDraft(profile.id, { role: event.target.value as 'admin' | 'staff' })}>
                            <option value="staff">Personal</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </label>
                        <label>Estado
                          <select value={draft.status} onChange={(event) => setDraft(profile.id, { status: event.target.value as UserStatus })}>
                            <option value="active">Activo</option>
                            <option value="pending">Pendiente</option>
                            <option value="disabled">Desactivado</option>
                          </select>
                        </label>
                      </div>
                      {draft.status === 'pending' && (
                        <p className="user-hint">Pendiente bloquea el acceso. Al volver a Activo, podrá entrar con el rol y los permisos guardados.</p>
                      )}
                      {draft.role === 'staff' ? (
                        <fieldset className="permission-options">
                          <legend>Permisos de módulos</legend>
                          {permissionOptions.map(({ key, label }) => (
                            <label key={key}>
                              <input
                                type="checkbox"
                                checked={draft.permissions.includes(key)}
                                onChange={() => setDraft(profile.id, { permissions: togglePermission(draft.permissions, key) })}
                              />
                              {label}
                            </label>
                          ))}
                        </fieldset>
                      ) : (
                        <p className="user-hint">Administrador: acceso a módulos operativos; no incluye administración de usuarios.</p>
                      )}
                      <button className="button button-secondary" type="button" disabled={!hasChanges || savingUserId === profile.id} onClick={() => void saveUser(profile)}>
                        {savingUserId === profile.id ? 'Guardando…' : 'Guardar cambios'}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="permissions-note">
          <span>✳</span>
          <div><strong>Acceso reservado</strong><p>Solo owner puede invitar personas o administrar cuentas y permisos. Los permisos operativos de personal se aplican módulo por módulo.</p></div>
        </div>
      </section>
    </>
  );
}
