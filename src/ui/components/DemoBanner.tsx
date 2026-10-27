/**
 * Franja informativa visible requerida por RF-30.
 * Indica que la aplicación opera en modo demostración con datos locales.
 */
export function DemoBanner() {
  return (
    <div
      role="region"
      aria-label="Aviso de Modo Demostración"
      className="demo-banner"
      style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        textAlign: 'center',
        padding: '0.4rem 1rem',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}
    >
      <span aria-hidden="true" style={{ marginRight: '0.4rem' }}>
        🚀
      </span>
      <span>
        Modo Demo: sin backend, datos en el navegador, sin cargos ni envíos reales.
      </span>
    </div>
  );
}
