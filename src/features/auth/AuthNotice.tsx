interface AuthNoticeProps {
  title: string;
  message: string;
  onSignOut?: () => void;
}

export function AuthNotice({ title, message, onSignOut }: AuthNoticeProps) {
  return (
    <main className="auth-screen">
      <section className="auth-card auth-notice-card" aria-labelledby="auth-notice-title">
        <a className="auth-brand" href="/" aria-label="Volver a Daylú Dulce">
          <span className="brand-mark" aria-hidden="true"><i>✿</i></span>
          <span><strong>Daylú Dulce</strong><small>Punto de venta</small></span>
        </a>
        <span className="auth-message-icon" aria-hidden="true">✿</span>
        <h1 id="auth-notice-title">{title}</h1>
        <p className="auth-description">{message}</p>
        {onSignOut && <button className="auth-text-button" onClick={onSignOut}>Cerrar sesión</button>}
      </section>
      <p className="auth-footer">Daylú Dulce <span>·</span> Villahermosa, Tabasco</p>
    </main>
  );
}
