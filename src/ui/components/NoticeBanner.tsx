export interface NoticeBannerProps {
  notice: string | null;
  onDismiss: () => void;
}

/**
 * Alerta accesible para notificaciones del sistema (RF-36).
 * Por ejemplo, aviso de recuperación automática ante datos corruptos.
 */
export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  if (!notice) {
    return null;
  }

  const message =
    notice === 'reset-corrupt'
      ? 'Aviso: los datos almacenados estaban dañados o eran incompatibles y se restablecieron a los valores iniciales de la demo.'
      : notice;

  return (
    <div
      role="alert"
      className="notice-banner"
      style={{
        backgroundColor: '#fffbeb',
        color: '#92400e',
        borderBottom: '2px solid #fcd34d',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.95rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
        <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>
          ⚠️
        </span>
        <span>{message}</span>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="touch-target-48 btn-close-notice"
        style={{
          minHeight: '48px',
          minWidth: '48px',
          background: 'transparent',
          border: 'none',
          color: '#92400e',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '1.2rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
        }}
      >
        ✕
      </button>
    </div>
  );
}
