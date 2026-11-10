import { useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';

interface SetPasswordFormProps {
  email?: string;
  completeInvitation: boolean;
}

export function SetPasswordForm({ email, completeInvitation }: SetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('No se pudo guardar la contraseña. Vuelve a abrir una invitación o solicita recuperar el acceso.');
        return;
      }

      // This also clears the first-login flag when the password was changed
      // through account recovery, not only when accepting an invitation.
      const { error: completionError } = await supabase.rpc('complete_password_setup');
      if (completionError) {
        setError('La contraseña se actualizó, pero no se pudo finalizar el cambio. Recarga la página para reintentar.');
        return;
      }

      window.location.assign('/app');
    } catch {
      setError('Ocurrió un error al guardar la contraseña. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="password-title">
        <a className="auth-brand" href="/" aria-label="Volver a Daylú Dulce">
          <span className="brand-mark" aria-hidden="true"><i>✿</i></span>
          <span><strong>Daylú Dulce</strong><small>Punto de venta</small></span>
        </a>
        <p className="auth-eyebrow">{completeInvitation ? 'Invitación aceptada' : 'Recuperación de acceso'}</p>
        <h1 id="password-title">{completeInvitation ? 'Crea tu contraseña.' : 'Elige una nueva contraseña.'}</h1>
        <p className="auth-description">
          {completeInvitation
            ? `Configura la contraseña de${email ? ` ${email}` : ' tu cuenta'} para iniciar sesión la próxima vez.`
            : 'Usa esta contraseña para volver a entrar a tu cuenta.'}
        </p>
        <form className="auth-form" onSubmit={savePassword}>
          <label htmlFor="new-password">Contraseña nueva</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSaving}
          />
          <label htmlFor="confirm-password">Confirma la contraseña</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={isSaving}
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </section>
      <p className="auth-footer">Daylú Dulce <span>·</span> Villahermosa, Tabasco</p>
    </main>
  );
}
