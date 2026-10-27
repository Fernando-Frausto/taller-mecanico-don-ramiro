import { useState } from 'react';
import { useApp } from '../store';
import { navigate } from '../router';
import { updateCatalogPriceAction } from '../../domain/app';
import { formatCurrencyMXN } from '../../domain/format';

export function CatalogEditor() {
  const { data, prefs, dispatch } = useApp();
  const isBoss = prefs.role === 'jefe';

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    data.catalog.forEach((item) => {
      initial[item.id] = item.suggestedPrice;
    });
    return initial;
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isBoss) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          Solo el rol Jefe puede editar los precios del catálogo (RF-07, RF-38).
        </div>
        <button
          type="button"
          onClick={() => navigate('#/taller')}
          className="touch-target-48"
          style={{
            minHeight: '48px',
            padding: '0.5rem 1.5rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Volver a la lista de vehículos
        </button>
      </div>
    );
  }

  const handlePriceChange = (itemId: string, val: number) => {
    setPrices((prev) => ({ ...prev, [itemId]: val }));
    setFeedback(null);
  };

  const handleSavePrice = (itemId: string, itemLabel: string) => {
    const currentPrice = prices[itemId];
    if (typeof currentPrice !== 'number' || currentPrice <= 0 || isNaN(currentPrice)) {
      setFeedback(`Error: El precio para ${itemLabel} debe ser un número positivo.`);
      return;
    }

    const action = updateCatalogPriceAction(itemId, currentPrice, prefs.role);
    const result = dispatch(action);

    if (result.ok) {
      setFeedback(`Precio actualizado correctamente para "${itemLabel}" a ${formatCurrencyMXN(currentPrice)}.`);
    } else {
      setFeedback(`Error al actualizar: ${result.error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('#/taller')}
          aria-label="Volver a la lista de vehículos"
          className="touch-target-48"
          style={{
            minHeight: '48px',
            minWidth: '48px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ⬅️
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
            Catálogo de Reparaciones y Precios
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Los precios fijados aquí se utilizarán como sugeridos al cotizar reparaciones adicionales (RF-07).
          </span>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: feedback.startsWith('Error') ? '#fee2e2' : '#dcfce7',
            color: feedback.startsWith('Error') ? '#991b1b' : '#166534',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontWeight: 600,
          }}
        >
          {feedback}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.catalog.map((item) => {
          const currentPrice = prices[item.id] ?? item.suggestedPrice;

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#0f172a' }}>
                  {item.label}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Precio actual guardado: {formatCurrencyMXN(item.suggestedPrice)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label htmlFor={`price-${item.id}`} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                  Precio sugerido para {item.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#475569' }}>$</span>
                  <input
                    id={`price-${item.id}`}
                    type="number"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                    min={1}
                    step={50}
                    style={{
                      width: '120px',
                      minHeight: '48px',
                      padding: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="button"
                  aria-label={`Guardar precio para ${item.label}`}
                  onClick={() => handleSavePrice(item.id, item.label)}
                  className="touch-target-48"
                  style={{
                    minHeight: '48px',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
