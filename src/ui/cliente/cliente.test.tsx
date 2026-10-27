import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../store';
import { ClientView } from './ClientView';
import { InvalidLink } from './InvalidLink';
import App from '../../App';
import { resetDemo, loadData, saveData } from '../../storage/repository';

describe('UI Cliente (Spec 001 - T9)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemo();
    window.location.hash = '#/c/Rm7kQ2xVb9Ld';
  });

  describe('InvalidLink', () => {
    it('muestra mensaje amigable de enlace no válido y sugerencia de contacto (RF-13, CA-08)', () => {
      render(
        <AppProvider>
          <InvalidLink />
        </AppProvider>
      );

      expect(
        screen.getByRole('heading', { name: /enlace no válido o vehículo no encontrado/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Taller Don Ramiro/i)).toBeInTheDocument();
      expect(screen.getByText(/\(55\) 5555-1234/i)).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /ir a la vista del taller|volver al inicio/i })
      ).toBeInTheDocument();
    });

    it('no expone datos de ningún vehículo (RF-13)', () => {
      render(
        <AppProvider>
          <InvalidLink />
        </AppProvider>
      );

      // No debe contener placas de vehículos registrados
      expect(screen.queryByText(/NVA1234/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/VWJ5678/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/AVE9012/i)).not.toBeInTheDocument();
    });
  });

  describe('ClientView - Visualización general y estados', () => {
    it('renderiza InvalidLink si el token no existe en el almacenamiento (RF-13, CA-08)', () => {
      render(
        <AppProvider>
          <ClientView token="token-invalido-999" />
        </AppProvider>
      );

      expect(
        screen.getByRole('heading', { name: /enlace no válido o vehículo no encontrado/i })
      ).toBeInTheDocument();
      expect(screen.queryByText(/Nissan Versa/i)).not.toBeInTheDocument();
    });

    it('muestra datos del vehículo, estado con StatusBadge y línea de progreso en < 5s (RF-12, CA-07)', () => {
      // seed-veh-1 token = Rm7kQ2xVb9Ld (Recibido)
      render(
        <AppProvider>
          <ClientView token="Rm7kQ2xVb9Ld" />
        </AppProvider>
      );

      // Datos del vehículo
      expect(screen.getByText(/Nissan Versa 2020 Plata/i)).toBeInTheDocument();
      expect(screen.getByText('NVA1234')).toBeInTheDocument();
      expect(screen.getByText(/Roberto Gómez/i)).toBeInTheDocument();

      // Estado destacado
      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveTextContent(/Recibido/i);

      // Línea de progreso de los 5 estados principales
      const progressSteps = screen.getByRole('list', { name: /progreso de la reparación/i });
      expect(within(progressSteps).getByText(/Recibido/i)).toBeInTheDocument();
      expect(within(progressSteps).getByText(/En diagnóstico/i)).toBeInTheDocument();
      expect(within(progressSteps).getByText(/En reparación/i)).toBeInTheDocument();
      expect(within(progressSteps).getByText(/Listo para entregar/i)).toBeInTheDocument();
      expect(within(progressSteps).getByText(/Entregado/i)).toBeInTheDocument();

      // Fecha y hora de última actualización
      expect(screen.getByText(/Última actualización:/i)).toBeInTheDocument();

      // Datos de contacto del taller Don Ramiro
      expect(screen.getByText(/Taller Mecánico Don Ramiro/i)).toBeInTheDocument();
      expect(screen.getByText(/\(55\) 5555-1234/i)).toBeInTheDocument();
    });

    it('solo muestra la información del vehículo consultado y no de otros (RF-14)', () => {
      render(
        <AppProvider>
          <ClientView token="Rm7kQ2xVb9Ld" />
        </AppProvider>
      );

      // Pertenece a seed-veh-1
      expect(screen.getByText(/Nissan Versa 2020 Plata/i)).toBeInTheDocument();

      // NO debe tener información de otros vehículos (seed-veh-2, seed-veh-3, etc.)
      expect(screen.queryByText(/Volkswagen Jetta/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Chevrolet Aveo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/VWJ5678/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/AVE9012/i)).not.toBeInTheDocument();
    });

    it('muestra vista de solo lectura con mensaje de agradecimiento cuando el vehículo está entregado (RF-40, CA-19)', () => {
      // seed-veh-6 token = As3uU7cAg5Si (Entregado)
      render(
        <AppProvider>
          <ClientView token="As3uU7cAg5Si" />
        </AppProvider>
      );

      expect(screen.getByText(/Ford Fiesta 2016 Blanco/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Vehículo entregado\. Gracias por su preferencia/i)
      ).toBeInTheDocument();

      // No debe haber botones de aprobación ni rechazo
      expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /rechazar/i })).not.toBeInTheDocument();
    });
  });

  describe('ClientView - Cotizaciones pendientes y decisiones', () => {
    it('muestra cartel destacado de pausa y cotización pendiente con botones >= 48px (RF-14, RF-15, CA-07)', () => {
      // seed-veh-3 token = Wn9qR4zXd2Pf (espera_aprobacion con cotización de batería)
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      // Cartel de alerta destacado
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        /Reparación adicional requerida: el trabajo se encuentra en pausa esperando su autorización/i
      );

      // Monto y descripción de la cotización pendiente
      expect(screen.getByText(/\$2,100\.00/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Cambio de batería — Nota: Batería sulfatada sin retención de carga, vida útil agotada/i)
      ).toBeInTheDocument();

      // Botones de acción táctiles grandes
      const approveBtn = screen.getByRole('button', { name: /aprobar reparación/i });
      const rejectBtn = screen.getByRole('button', { name: /rechazar reparación/i });

      expect(approveBtn).toBeInTheDocument();
      expect(approveBtn).toHaveClass('touch-target-48');
      expect(rejectBtn).toBeInTheDocument();
      expect(rejectBtn).toHaveClass('touch-target-48');
    });

    it('abre el DecisionModal al presionar "Aprobar reparación" con datos inalterables y nombre prellenado (RF-16, CA-09)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      const approveBtn = screen.getByRole('button', { name: /aprobar reparación/i });
      await user.click(approveBtn);

      // Diálogo modal accesible
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(within(dialog).getByRole('heading', { name: /confirmar aprobación/i })).toBeInTheDocument();

      // Resumen inalterable
      expect(within(dialog).getByText(/\$2,100\.00/i)).toBeInTheDocument();
      expect(
        within(dialog).getByText(/Cambio de batería — Nota: Batería sulfatada/i)
      ).toBeInTheDocument();

      // Campo de nombre prellenado con el cliente del vehículo
      const nameInput = within(dialog).getByLabelText(/nombre de quien autoriza/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Carlos Mendoza');

      // Botón de confirmación
      expect(within(dialog).getByRole('button', { name: /confirmar aprobación/i })).toBeInTheDocument();
    });

    it('valida que el nombre de quien decide sea obligatorio y tenga entre 2 y 60 caracteres (RF-16, CA-20)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      await user.click(screen.getByRole('button', { name: /aprobar reparación/i }));

      const dialog = screen.getByRole('dialog');
      const nameInput = within(dialog).getByLabelText(/nombre de quien autoriza/i);
      const confirmBtn = within(dialog).getByRole('button', { name: /confirmar aprobación/i });

      // Limpiar el campo (dejarlo vacío)
      await user.clear(nameInput);
      await user.click(confirmBtn);

      expect(within(dialog).getByText(/el nombre es obligatorio/i)).toBeInTheDocument();

      // Solo espacios
      await user.type(nameInput, '   ');
      await user.click(confirmBtn);
      expect(within(dialog).getByText(/el nombre es obligatorio/i)).toBeInTheDocument();

      // Menos de 2 caracteres
      await user.clear(nameInput);
      await user.type(nameInput, 'A');
      await user.click(confirmBtn);
      expect(within(dialog).getByText(/al menos 2 caracteres/i)).toBeInTheDocument();

      // El modal no debe haberse cerrado
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('al confirmar aprobación, actualiza el estado a En reparación y agrega registro inmutable al ledger (RF-11, RF-18, CA-09)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      await user.click(screen.getByRole('button', { name: /aprobar reparación/i }));

      const dialog = screen.getByRole('dialog');
      const confirmBtn = within(dialog).getByRole('button', { name: /confirmar aprobación/i });

      await user.click(confirmBtn);

      // Modal debe cerrarse
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // La alerta de cotización pendiente ya no debe estar
      expect(
        screen.queryByText(/el trabajo se encuentra en pausa esperando su autorización/i)
      ).not.toBeInTheDocument();

      // Estado actualizado a 'En reparación' (RF-11)
      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveTextContent(/En reparación/i);

      // Entrada agregada en el registro inmutable (Ledger) (RF-21)
      const ledgerSection = screen.getByRole('region', { name: /registro inmutable de cotizaciones/i });
      expect(within(ledgerSection).getByText(/^aprobada$/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/\$2,100\.00/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/Carlos Mendoza/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/Cambio de batería/i)).toBeInTheDocument();
    });

    it('al confirmar rechazo, regresa el vehículo al estado previo y registra rechazo en el ledger (RF-11, RF-18, CA-06)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      await user.click(screen.getByRole('button', { name: /rechazar reparación/i }));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByRole('heading', { name: /confirmar rechazo/i })).toBeInTheDocument();

      const confirmBtn = within(dialog).getByRole('button', { name: /confirmar rechazo/i });
      await user.click(confirmBtn);

      // Modal cerrado
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Como era la única cotización y fue rechazada, regresa a 'diagnostico' (su pausedFrom)
      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toHaveTextContent(/En diagnóstico/i);

      // Ledger muestra rechazo
      const ledgerSection = screen.getByRole('region', { name: /registro inmutable de cotizaciones/i });
      expect(within(ledgerSection).getByText(/^rechazada$/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/\$2,100\.00/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/Carlos Mendoza/i)).toBeInTheDocument();
    });

    it('muestra error y previene decisión duplicada si la cotización ya fue resuelta desde otra pestaña (RF-17, CA-21)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <ClientView token="Wn9qR4zXd2Pf" />
        </AppProvider>
      );

      // Abrir modal de aprobación
      await user.click(screen.getByRole('button', { name: /aprobar reparación/i }));
      const dialog = screen.getByRole('dialog');

      // Simular que otra pestaña resolvió la cotización modificando directamente el storage
      const currentData = loadData().data;
      const updatedQuotes = currentData.quotes.map((q) =>
        q.id === 'seed-quote-3-1' ? { ...q, status: 'aprobada' as const } : q
      );
      saveData({
        ...currentData,
        quotes: updatedQuotes,
      });

      // Intentar confirmar en esta ventana
      const confirmBtn = within(dialog).getByRole('button', { name: /confirmar aprobación/i });
      await user.click(confirmBtn);

      // Debe mostrar aviso de que la cotización ya fue resuelta
      expect(
        within(dialog).getByText(/ya ha sido resuelta previamente|ya fue resuelta/i)
      ).toBeInTheDocument();

      // No debe permitir confirmar de nuevo
      expect(confirmBtn).toBeDisabled();
    });
  });

  describe('ClientView - Visualización de Ledger existente (RF-21)', () => {
    it('muestra historial inmutable de decisiones previas en el vehículo (RF-21, CA-11)', () => {
      // seed-veh-4 token = Yp1sS5aYe3Qg (tiene 1 aprobada y 1 rechazada en la semilla)
      render(
        <AppProvider>
          <ClientView token="Yp1sS5aYe3Qg" />
        </AppProvider>
      );

      const ledgerSection = screen.getByRole('region', { name: /registro inmutable de cotizaciones/i });
      expect(within(ledgerSection).getByText(/Balatas delanteras/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/\$1,450\.00/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/Amortiguadores traseros/i)).toBeInTheDocument();
      expect(within(ledgerSection).getByText(/\$3,200\.00/i)).toBeInTheDocument();
      expect(within(ledgerSection).getAllByText(/Laura Patricia Sánchez/i).length).toBe(2);
    });
  });

  describe('Integración con App.tsx', () => {
    it('renderiza ClientView en lugar del placeholder cuando la ruta es #/c/:token', () => {
      window.location.hash = '#/c/Rm7kQ2xVb9Ld';
      render(<App />);

      expect(screen.queryByTestId('client-view-placeholder')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /Nissan Versa 2020 Plata/i })
      ).toBeInTheDocument();
      expect(screen.getByText('NVA1234')).toBeInTheDocument();
    });
  });
});
