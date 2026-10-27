import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { NoticeBanner } from './NoticeBanner';
import { DemoBanner } from './DemoBanner';
import { DemoBar } from './DemoBar';
import { AppProvider } from '../store';
import type { VehicleState } from '../../domain/types';

describe('Componentes Comunes', () => {
  describe('StatusBadge', () => {
    const states: { state: VehicleState; expectedText: string; expectedIcon: string }[] = [
      { state: 'recibido', expectedText: 'Recibido', expectedIcon: '📋' },
      { state: 'diagnostico', expectedText: 'En diagnóstico', expectedIcon: '🔍' },
      { state: 'espera_aprobacion', expectedText: 'Esperando aprobación', expectedIcon: '⏳' },
      { state: 'reparacion', expectedText: 'En reparación', expectedIcon: '🛠️' },
      { state: 'listo', expectedText: 'Listo para entregar', expectedIcon: '✅' },
      { state: 'entregado', expectedText: 'Entregado', expectedIcon: '🏁' },
    ];

    it.each(states)(
      'renderiza texto "$expectedText" e icono "$expectedIcon" para el estado "$state" (RNF-02, RNF-03)',
      ({ state, expectedText, expectedIcon }) => {
        render(<StatusBadge state={state} />);
        const badge = screen.getByRole('status');
        expect(badge).toBeInTheDocument();
        expect(badge.textContent).toContain(expectedText);
        expect(badge.textContent).toContain(expectedIcon);
      }
    );
  });

  describe('ConfirmDialog', () => {
    it('no renderiza nada cuando isOpen es false', () => {
      const { container } = render(
        <ConfirmDialog
          isOpen={false}
          title="Confirmar acción"
          message="¿Está seguro?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renderiza con atributos accesibles role="dialog" y aria-modal="true" cuando isOpen es true', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Confirmar acción"
          message="¿Está seguro de continuar?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByText('Confirmar acción')).toBeInTheDocument();
      expect(screen.getByText('¿Está seguro de continuar?')).toBeInTheDocument();
    });

    it('invoca onConfirm al presionar el botón de confirmación', async () => {
      const handleConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Eliminar"
          message="Acción destructiva"
          confirmLabel="Sí, continuar"
          onConfirm={handleConfirm}
          onCancel={vi.fn()}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: 'Sí, continuar' });
      await user.click(confirmBtn);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('invoca onCancel al presionar Cancelar o presionar Escape', async () => {
      const handleCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="Título"
          message="Mensaje"
          cancelLabel="No, cancelar"
          onConfirm={vi.fn()}
          onCancel={handleCancel}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: 'No, cancelar' });
      await user.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      // Presionar Escape
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleCancel).toHaveBeenCalledTimes(2);
    });

    it('los botones tienen tamaño táctil accesible ≥ 48px', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="Título"
          message="Mensaje"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      for (const btn of buttons) {
        expect(btn).toHaveClass('touch-target-48');
      }
    });
  });

  describe('NoticeBanner', () => {
    it('no renderiza nada si notice es null', () => {
      const { container } = render(<NoticeBanner notice={null} onDismiss={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('renderiza mensaje explicativo para reset-corrupt', () => {
      render(<NoticeBanner notice="reset-corrupt" onDismiss={vi.fn()} />);
      expect(
        screen.getByText(/datos almacenados estaban dañados o eran incompatibles/i)
      ).toBeInTheDocument();
    });

    it('renderiza mensaje personalizado si se pasa como string', () => {
      render(<NoticeBanner notice="Operación realizada con éxito" onDismiss={vi.fn()} />);
      expect(screen.getByText('Operación realizada con éxito')).toBeInTheDocument();
    });

    it('invoca onDismiss al pulsar el botón de cerrar', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();

      render(<NoticeBanner notice="Alerta de prueba" onDismiss={handleDismiss} />);
      const closeBtn = screen.getByRole('button', { name: /cerrar aviso/i });
      await user.click(closeBtn);

      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('DemoBanner', () => {
    it('renderiza información visible del modo demo (RF-30)', () => {
      render(<DemoBanner />);
      expect(
        screen.getByText(/Modo Demo: sin backend, datos en el navegador, sin cargos ni envíos reales/i)
      ).toBeInTheDocument();
    });
  });

  describe('DemoBar', () => {
    beforeEach(() => {
      localStorage.clear();
      window.location.hash = '#/taller';
    });

    it('muestra controles de vista y rol, selector de vehículos y botón de reiniciar', () => {
      render(
        <AppProvider>
          <DemoBar />
        </AppProvider>
      );

      expect(screen.getByRole('region', { name: /barra de demostración/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vista taller/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vista cliente/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/rol del taller/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/saltar a vehículo/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reiniciar demo/i })).toBeInTheDocument();
    });

    it('permite alternar el rol entre Jefe y Mecánico', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <DemoBar />
        </AppProvider>
      );

      const roleSelect = screen.getByLabelText(/rol del taller/i);
      expect(roleSelect).toHaveValue('jefe');

      await user.selectOptions(roleSelect, 'mecanico');
      expect(roleSelect).toHaveValue('mecanico');
    });

    it('el botón "Reiniciar demo" abre el diálogo de confirmación y al confirmar ejecuta el reset', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <DemoBar />
        </AppProvider>
      );

      const resetBtn = screen.getByRole('button', { name: /reiniciar demo/i });
      await user.click(resetBtn);

      // Debe abrirse el ConfirmDialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/¿desea reiniciar la demo\?/i)).toBeInTheDocument();

      // Confirmar
      const confirmBtn = screen.getByRole('button', { name: /sí, reiniciar/i });
      await user.click(confirmBtn);

      // El diálogo debe cerrarse
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
