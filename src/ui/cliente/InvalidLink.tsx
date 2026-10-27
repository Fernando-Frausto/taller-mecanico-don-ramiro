/**
 * Pantalla amigable cuando el enlace no corresponde a ningún vehículo (RF-13, CA-08).
 * Sin exponer datos de otros vehículos.
 */
export function InvalidLink() {
  return (
    <div
      role="region"
      aria-label="Enlace no válido"
      style={{
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem 1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 1.25rem auto',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
        }}
        aria-hidden="true"
      >
        🔍
      </div>

      <h2
        style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: '#0f172a',
          margin: '0 0 0.75rem 0',
        }}
      >
        Enlace no válido o vehículo no encontrado
      </h2>

      <p
        style={{
          fontSize: '1rem',
          lineHeight: '1.5',
          color: '#475569',
          margin: '0 0 1.5rem 0',
        }}
      >
        El enlace que utilizó no corresponde a ningún vehículo registrado o ya no se encuentra disponible.
      </p>

      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'left',
        }}
      >
        <p
          style={{
            margin: '0 0 0.5rem 0',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: '#1e293b',
          }}
        >
          ¿Necesita asistencia?
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
          Por favor comuníquese con el <strong>Taller Don Ramiro</strong> al teléfono{' '}
          <strong>(55) 5555-1234</strong> para verificar el estatus de su vehículo o solicitar un nuevo enlace.
        </p>
      </div>

      <a
        href="#/taller"
        className="touch-target-48"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '48px',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '1rem',
        }}
      >
        Ir a la vista del taller
      </a>
    </div>
  );
}
