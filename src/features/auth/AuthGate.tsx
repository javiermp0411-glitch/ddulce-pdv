import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../db/supabase';
import type { AppRole, PermissionKey } from '../../types/app';
import PosDashboard from '../../components/PosDashboard';
import { AuthNotice } from './AuthNotice';
import { SetPasswordForm } from './SetPasswordForm';
import { SignInForm } from './SignInForm';

type ProfileStatus = 'pending' | 'active' | 'disabled';

type GateState =
  | { kind: 'checking' }
  | { kind: 'signed-out' }
  | { kind: 'pending'; email: string }
  | { kind: 'disabled'; email: string }
  | { kind: 'no-permissions'; email: string }
  | { kind: 'set-password'; email: string }
  | { kind: 'password-recovery' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; role: AppRole; permissions: PermissionKey[]; email: string; displayName: string | null };

interface ProfileRow {
  email: string;
  display_name: string | null;
  role: AppRole;
  status: ProfileStatus;
  must_set_password: boolean;
}

interface PermissionRow {
  permission_key: PermissionKey;
}

export default function AuthGate() {
  const [gate, setGate] = useState<GateState>({ kind: 'checking' });
  const requestId = useRef(0);
  const passwordRecovery = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      if (passwordRecovery.current) {
        setGate({ kind: 'password-recovery' });
        return;
      }

      const request = ++requestId.current;
      setGate({ kind: 'checking' });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!mounted || request !== requestId.current) return;

      if (userError) {
        if (userError.name === 'AuthSessionMissingError') {
          setGate({ kind: 'signed-out' });
        } else {
          setGate({ kind: 'error', message: 'No se pudo validar tu sesión. Revisa tu conexión e inténtalo de nuevo.' });
        }
        return;
      }

      const user = userData.user;
      if (!user) {
        setGate({ kind: 'signed-out' });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, display_name, role, status, must_set_password')
        .eq('id', user.id)
        .maybeSingle()
        .overrideTypes<ProfileRow, { merge: false }>();

      if (!mounted || request !== requestId.current) return;
      if (profileError) {
        setGate({ kind: 'error', message: 'No se pudo consultar tu perfil. Inténtalo de nuevo.' });
        return;
      }

      if (!profile) {
        setGate({ kind: 'pending', email: user.email ?? '' });
        return;
      }

      if (profile.status === 'disabled') {
        setGate({ kind: 'disabled', email: user.email ?? '' });
        return;
      }

      if (profile.must_set_password) {
        setGate({ kind: 'set-password', email: profile.email });
        return;
      }

      if (profile.status === 'pending') {
        setGate({ kind: 'pending', email: profile.email });
        return;
      }

      const { data: permissionRows, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('permission_key')
        .eq('user_id', user.id)
        .overrideTypes<PermissionRow[], { merge: false }>();

      if (!mounted || request !== requestId.current) return;
      if (permissionsError) {
        setGate({ kind: 'error', message: 'No se pudieron verificar tus permisos. Inténtalo de nuevo.' });
        return;
      }

      const permissions = (permissionRows ?? [])
        .map(({ permission_key }) => permission_key)
        .filter((permission) => permission !== 'users.read' && permission !== 'users.manage');
      if (profile.role === 'staff' && permissions.length === 0) {
        setGate({ kind: 'no-permissions', email: profile.email });
        return;
      }

      setGate({
        kind: 'ready',
        role: profile.role,
        permissions,
        email: profile.email,
        displayName: profile.display_name,
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        passwordRecovery.current = true;
        requestId.current += 1;
        setGate({ kind: 'password-recovery' });
        return;
      }

      if (passwordRecovery.current && session) {
        setGate({ kind: 'password-recovery' });
        return;
      }

      if (!session) {
        passwordRecovery.current = false;
        requestId.current += 1;
        setGate({ kind: 'signed-out' });
        return;
      }

      // Defer Supabase calls outside the auth callback to avoid locking the client.
      window.setTimeout(() => void loadCurrentUser(), 0);
    });

    const initialize = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setGate({ kind: 'error', message: 'No se pudo leer la sesión. Inténtalo de nuevo.' });
      } else if (session) {
        if (passwordRecovery.current) {
          setGate({ kind: 'password-recovery' });
        } else {
          await loadCurrentUser();
        }
      } else {
        setGate({ kind: 'signed-out' });
      }
    };

    void initialize();

    return () => {
      mounted = false;
      requestId.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setGate({ kind: 'error', message: 'No se pudo cerrar la sesión. Inténtalo de nuevo.' });
    } else {
      setGate({ kind: 'signed-out' });
    }
  };

  if (gate.kind === 'checking') {
    return <AuthNotice title="Verificando acceso" message="Espera un momento…" />;
  }

  if (gate.kind === 'signed-out') {
    return <SignInForm />;
  }

  if (gate.kind === 'pending') {
    return <AuthNotice title="Acceso pendiente" message={`La cuenta ${gate.email} espera activación de un owner.`} onSignOut={signOut} />;
  }

  if (gate.kind === 'disabled') {
    return <AuthNotice title="Cuenta desactivada" message="Pide a un administrador de Daylú Dulce que revise tu acceso." onSignOut={signOut} />;
  }

  if (gate.kind === 'set-password') {
    return <SetPasswordForm email={gate.email} completeInvitation />;
  }

  if (gate.kind === 'password-recovery') {
    return <SetPasswordForm completeInvitation={false} />;
  }

  if (gate.kind === 'no-permissions') {
    return <AuthNotice title="Aún no tienes permisos" message={`Un owner debe asignar permisos a ${gate.email} antes de entrar a los módulos.`} onSignOut={signOut} />;
  }

  if (gate.kind === 'error') {
    return <AuthNotice title="No se pudo validar el acceso" message={gate.message} onSignOut={signOut} />;
  }

  return <PosDashboard role={gate.role} permissions={gate.permissions} userEmail={gate.email} displayName={gate.displayName} onSignOut={signOut} />;
}
