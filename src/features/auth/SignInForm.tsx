import { useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';

type FormMode = 'sign-in' | 'reset-password';

export function SignInForm() {
  const [mode, setMode] = useState<FormMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentResetEmail, setSentResetEmail] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) setError('No se pudo iniciar sesión. Revisa el correo y la contraseña.');
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/app`,
        });
        if (resetError) {
          setError('No se pudo enviar el correo de recuperación. Inténtalo de nuevo.');
        } else {
          setSentResetEmail(true);
        }
      }
    } catch {
      setError('No se pudo completar la solicitud. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode: FormMode) => {
    setError('');
    setSentResetEmail(false);
    setMode(nextMode);
  };

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="/" aria-label="Volver a Daylú Dulce">
          <span className="brand-mark" aria-hidden="true"><i>✿</i></span>
          <span><strong>Daylú Dulce</strong><small>Punto de venta</small></span>
        </a>

        {sentResetEmail ? (
          <div className="auth-message-panel" role="status">
            <span className="auth-message-icon" aria-hidden="true">✉</span>
            <h1 id="auth-title">Revisa tu correo</h1>
            <p>Si <strong>{email}</strong> tiene una cuenta, enviaremos instrucciones para restablecer su contraseña.</p>
            <button className="auth-text-button" onClick={() => changeMode('sign-in')}>Volver al inicio de sesión</button>
          </div>
        ) : (
          <>
            <p className="auth-eyebrow">Acceso para el equipo</p>
            <h1 id="auth-title">{mode === 'sign-in' ? 'Qué bueno verte.' : 'Recupera tu acceso.'}</h1>
            <p className="auth-description">
              {mode === 'sign-in'
                ? 'Entra con el correo y la contraseña que configuraste al aceptar tu invitación.'
                : 'Te enviaremos un enlace para que puedas elegir una nueva contraseña.'}
            </p>
            <form className="auth-form" onSubmit={submit}>
              <label htmlFor="staff-email">Correo electrónico</label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
              />
              {mode === 'sign-in' && (
                <>
                  <label htmlFor="staff-password">Contraseña</label>
                  <input
                    id="staff-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </>
              )}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Un momento…'
                  : mode === 'sign-in' ? 'Iniciar sesión' : 'Enviar recuperación'}
              </button>
            </form>
            <button
              className="auth-text-button"
              type="button"
              onClick={() => changeMode(mode === 'sign-in' ? 'reset-password' : 'sign-in')}
            >
              {mode === 'sign-in' ? 'Olvidé mi contraseña' : 'Volver al inicio de sesión'}
            </button>
            <p className="auth-footnote">Las cuentas solo se crean mediante invitación de un administrador.</p>
          </>
        )}
      </section>
      <p className="auth-footer">Daylú Dulce <span>·</span> Villahermosa, Tabasco</p>
    </main>
  );
}
