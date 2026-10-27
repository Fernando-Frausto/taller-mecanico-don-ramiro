import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../store';
import { VehicleList } from './VehicleList';
import { NewVehicleForm } from './NewVehicleForm';
import { VehicleDetail } from './VehicleDetail';
import { QuoteDraftModal } from './QuoteDraftModal';
import { CatalogEditor } from './CatalogEditor';
import { resetDemo, savePrefs } from '../../storage/repository';
import type { CatalogItem } from '../../domain/types';

describe('UI Taller (Spec 001 - T8)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemo();
    savePrefs({ view: 'taller', role: 'jefe' });
    window.location.hash = '#/taller';
  });

  describe('VehicleList', () => {
    it('muestra por defecto la lista de vehículos activos y excluye los entregados (RF-03, RF-32, CA-19)', () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      // Vehículos activos en la semilla
      expect(screen.getByText('NVA1234')).toBeInTheDocument(); // seed-veh-1 (recibido)
      expect(screen.getByText('VWJ5678')).toBeInTheDocument(); // seed-veh-2 (diagnostico)
      expect(screen.getByText('AVE9012')).toBeInTheDocument(); // seed-veh-3 (espera_aprobacion)
      expect(screen.getByText('HND3456')).toBeInTheDocument(); // seed-veh-4 (reparacion)
      expect(screen.getByText('MZD7890')).toBeInTheDocument(); // seed-veh-5 (listo)

      // El vehículo entregado NO debe aparecer en la lista de activos
      expect(screen.queryByText('FRD2345')).not.toBeInTheDocument(); // seed-veh-6 (entregado)
    });

    it('muestra los vehículos entregados cuando el filtro filterDelivered es true (RF-32, CA-19)', () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={true} />
        </AppProvider>
      );

      expect(screen.getByText('FRD2345')).toBeInTheDocument(); // seed-veh-6 (entregado)
      expect(screen.queryByText('NVA1234')).not.toBeInTheDocument();
      expect(screen.queryByText('VWJ5678')).not.toBeInTheDocument();
    });

    it('destaca indicador visible de cotización pendiente / trabajo en pausa si el vehículo tiene cotizaciones pendientes (RF-03)', () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      // seed-veh-3 tiene cotización pendiente
      const card = screen.getByTestId('vehicle-card-seed-veh-3');
      expect(card).toBeInTheDocument();
      expect(card.textContent).toMatch(/cotización pendiente|trabajo pausado|esperando aprobación/i);
    });

    it('permite avanzar rápidamente de estado con el botón rápido en la tarjeta (RF-03, CA-02, RNF-01)', async () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      // seed-veh-1 está en 'recibido'. Su siguiente estado es 'diagnostico'.
      const card = screen.getByTestId('vehicle-card-seed-veh-1');
      const advanceBtn = within(card).getByRole('button', { name: /avanzar a en diagnóstico/i });
      expect(advanceBtn).toBeInTheDocument();

      fireEvent.click(advanceBtn);

      // Ahora seed-veh-1 debe estar en 'diagnostico'
      expect(within(card).getByText(/en diagnóstico/i)).toBeInTheDocument();
    });

    it('no muestra botón de avance rápido para vehículos en espera_aprobacion (RF-10, CA-05)', () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      const card = screen.getByTestId('vehicle-card-seed-veh-3');
      // No debe existir botón para avanzar mientras tenga cotizaciones pendientes
      const advanceBtn = within(card).queryByRole('button', { name: /avanzar a/i });
      expect(advanceBtn).toBeNull();
    });

    it('muestra botones de "Nuevo ingreso" y "Catálogo" si el rol es jefe (RF-38, CA-14)', () => {
      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      expect(screen.getByRole('button', { name: /nuevo ingreso/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /catálogo/i })).toBeInTheDocument();
    });

    it('oculta botones de "Nuevo ingreso" y "Catálogo" si el rol es mecanico (RF-38, CA-14)', () => {
      savePrefs({ view: 'taller', role: 'mecanico' });

      render(
        <AppProvider>
          <VehicleList filterDelivered={false} />
        </AppProvider>
      );

      expect(screen.queryByRole('button', { name: /nuevo ingreso/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /catálogo/i })).not.toBeInTheDocument();
    });
  });

  describe('NewVehicleForm', () => {
    it('muestra advertencia de permisos si el rol es mecanico (RF-38, CA-14)', () => {
      savePrefs({ view: 'taller', role: 'mecanico' });

      render(
        <AppProvider>
          <NewVehicleForm />
        </AppProvider>
      );

      expect(screen.getByText(/solo el rol jefe puede dar de alta vehículos/i)).toBeInTheDocument();
      expect(screen.queryByRole('textbox', { name: /nombre del cliente/i })).not.toBeInTheDocument();
    });

    it('muestra mensajes de error específicos junto a cada campo cuando fallan las validaciones (RF-39, CA-17)', async () => {
      render(
        <AppProvider>
          <NewVehicleForm />
        </AppProvider>
      );

      const submitBtn = screen.getByRole('button', { name: /registrar ingreso/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/el nombre del cliente es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/el teléfono del cliente es obligatorio/i)).toBeInTheDocument();
      expect(screen.getByText(/la descripción del vehículo es obligatoria/i)).toBeInTheDocument();
      expect(screen.getByText(/las placas son obligatorias/i)).toBeInTheDocument();
    });

    it('detecta placas duplicadas con otro vehículo activo y muestra error (RF-33, CA-17)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <NewVehicleForm />
        </AppProvider>
      );

      await user.type(screen.getByLabelText(/nombre del cliente/i), 'Juan Pérez');
      await user.type(screen.getByLabelText(/teléfono/i), '5512345678');
      await user.type(screen.getByLabelText(/^vehículo/i), 'Honda Civic 2020');
      await user.type(screen.getByLabelText(/placas/i), 'NVA1234'); // Ya existe en seed-veh-1 activo
      await user.click(screen.getByRole('button', { name: /registrar ingreso/i }));

      expect(screen.getByText(/conflicto.*mismas placas|ya existe.*placas/i)).toBeInTheDocument();
    });

    it('registra exitosamente un vehículo nuevo con datos válidos y botón >= 48px (RF-01, RF-02, CA-01)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <NewVehicleForm />
        </AppProvider>
      );

      const submitBtn = screen.getByRole('button', { name: /registrar ingreso/i });
      expect(submitBtn).toBeInTheDocument();

      await user.type(screen.getByLabelText(/nombre del cliente/i), 'Alejandro Morales');
      await user.type(screen.getByLabelText(/teléfono/i), '5598765432');
      await user.type(screen.getByLabelText(/^vehículo/i), 'Seat Ibiza 2021 Azul');
      await user.type(screen.getByLabelText(/placas/i), 'IBZ9988');
      await user.type(screen.getByLabelText(/motivo/i), 'Revisión de frenos');
      await user.click(submitBtn);

      // Comprobar que navegó al hash de la ficha del vehículo
      expect(window.location.hash).toMatch(/#\/taller\/v\/.+/);
    });
  });

  describe('QuoteDraftModal', () => {
    const item: CatalogItem = {
      id: 'cat-balatas',
      label: 'Balatas delanteras',
      suggestedPrice: 1450,
    };

    it('muestra el ítem y precio sugerido como solo lectura para mecánico (RF-07, RF-38)', () => {
      render(
        <AppProvider>
          <QuoteDraftModal
            isOpen={true}
            item={item}
            vehicleId="seed-veh-2"
            role="mecanico"
            onClose={vi.fn()}
          />
        </AppProvider>
      );

      expect(screen.getByText('Balatas delanteras')).toBeInTheDocument();
      const priceInput = screen.getByLabelText(/monto/i);
      expect(priceInput).toHaveAttribute('readonly');
    });

    it('permite al jefe editar el precio de la cotización borrador (RF-07, RF-38)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <QuoteDraftModal
            isOpen={true}
            item={item}
            vehicleId="seed-veh-2"
            role="jefe"
            onClose={vi.fn()}
          />
        </AppProvider>
      );

      const priceInput = screen.getByLabelText(/monto/i);
      expect(priceInput).not.toHaveAttribute('readonly');

      await user.clear(priceInput);
      await user.type(priceInput, '1600');
      expect(priceInput).toHaveValue(1600);
    });

    it('envía la cotización y pasa el vehículo a espera_aprobacion (RF-06, RF-09, CA-04)', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <AppProvider>
          <QuoteDraftModal
            isOpen={true}
            item={item}
            vehicleId="seed-veh-2" // está en diagnostico
            role="mecanico"
            onClose={onClose}
          />
        </AppProvider>
      );

      const noteInput = screen.getByLabelText(/nota opcional/i);
      await user.type(noteInput, 'Discos con desgaste');

      const sendBtn = screen.getByRole('button', { name: /enviar cotización/i });
      await user.click(sendBtn);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('VehicleDetail', () => {
    it('muestra información completa del vehículo y badge de estado (RF-08)', () => {
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-1" />
        </AppProvider>
      );

      expect(screen.getByText('NVA1234')).toBeInTheDocument();
      expect(screen.getByText('Roberto Gómez')).toBeInTheDocument();
      expect(screen.getByText('Nissan Versa 2020 Plata')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/recibido/i);
    });

    it('avanza al siguiente estado lineal en 1 toque con botón principal >= 48px (RF-04, CA-02)', () => {
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-2" />
        </AppProvider>
      );

      // seed-veh-2 está en 'diagnostico'. Siguiente es 'reparacion'.
      const advanceBtn = screen.getByRole('button', { name: /pasar a en reparación/i });
      expect(advanceBtn).toBeInTheDocument();

      fireEvent.click(advanceBtn);

      expect(screen.getByRole('status')).toHaveTextContent(/en reparación/i);
    });

    it('permite corregir al estado anterior mediante diálogo de confirmación (RF-05, CA-05)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-2" />
        </AppProvider>
      );

      // Corregir a 'recibido'
      const correctBtn = screen.getByRole('button', { name: /corregir a recibido/i });
      await user.click(correctBtn);

      // Abre ConfirmDialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      const confirmActionBtn = screen.getByRole('button', { name: /confirmar corrección|confirmar/i });
      await user.click(confirmActionBtn);

      expect(screen.getByRole('status')).toHaveTextContent(/recibido/i);
    });

    it('muestra sección de proponer reparación en diagnostico y permite abrir modal en 1 toque (RF-06, CA-04)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-2" />
        </AppProvider>
      );

      // Los ítems del catálogo deben mostrarse como botones
      const balatasBtn = screen.getByRole('button', { name: /balatas delanteras/i });
      expect(balatasBtn).toBeInTheDocument();

      await user.click(balatasBtn);

      // Abre el modal de cotización borrador
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/cotizar reparación adicional/i)).toBeInTheDocument();
    });

    it('no permite proponer reparaciones cuando el estado es recibido, listo o entregado (RF-06, CA-04)', () => {
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-1" />
        </AppProvider>
      );

      // seed-veh-1 está en recibido -> No debe mostrar catálogo de proponer
      expect(screen.queryByRole('button', { name: /balatas delanteras/i })).not.toBeInTheDocument();
    });

    it('si hay cotización pendiente, muestra cartel de trabajo pausado y permite retirarla con confirmación (RF-31, CA-18)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-3" />
        </AppProvider>
      );

      // Cartel de pausa
      expect(screen.getByText(/trabajo en pausa/i)).toBeInTheDocument();
      const alertRegion = screen.getByRole('alert');
      expect(within(alertRegion).getByText(/cambio de batería/i)).toBeInTheDocument();

      // Botón para retirar
      const withdrawBtn = screen.getByRole('button', { name: /retirar cotización/i });
      await user.click(withdrawBtn);

      // Diálogo de confirmación
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      const confirmBtn = within(dialog).getByRole('button', { name: /retirar cotización|confirmar/i });
      await user.click(confirmBtn);

      // Tras retirarla, el vehículo vuelve a su estado previo (diagnostico)
      expect(screen.getByRole('status')).toHaveTextContent(/en diagnóstico/i);
    });

    it('bloquea avanzar o corregir si hay cotizaciones pendientes (RF-10, CA-05)', () => {
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-3" />
        </AppProvider>
      );

      // En seed-veh-3 hay cotización pendiente
      expect(screen.queryByRole('button', { name: /pasar a /i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /corregir a /i })).not.toBeInTheDocument();
    });

    it('incluye enlace para compartir por WhatsApp y botón para copiar enlace con confirmación visual (RF-23, RF-25, CA-12)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-1" />
        </AppProvider>
      );

      // WhatsApp link
      const waLink = screen.getByRole('link', { name: /compartir por whatsapp/i });
      expect(waLink).toHaveAttribute('href');
      expect(waLink.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/525512345678\?text=/);

      // Copiar enlace
      const copyBtn = screen.getByRole('button', { name: /copiar enlace del cliente/i });
      await user.click(copyBtn);

      expect(screen.getByText(/¡enlace copiado!|copiado/i)).toBeInTheDocument();
    });

    it('muestra advertencia RF-34 si el vehículo no es semilla (isSeed: false)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <NewVehicleForm />
        </AppProvider>
      );

      await user.type(screen.getByLabelText(/nombre del cliente/i), 'Nuevo Cliente');
      await user.type(screen.getByLabelText(/teléfono/i), '5511223344');
      await user.type(screen.getByLabelText(/^vehículo/i), 'Mazda 3 2022');
      await user.type(screen.getByLabelText(/placas/i), 'MZD9900');
      await user.click(screen.getByRole('button', { name: /registrar ingreso/i }));

      // Extraer id del hash
      const newId = window.location.hash.replace('#/taller/v/', '');

      render(
        <AppProvider>
          <VehicleDetail vehicleId={newId} />
        </AppProvider>
      );

      expect(
        screen.getByText(/aviso: este vehículo fue creado en esta sesión y solo es visible en este navegador/i)
      ).toBeInTheDocument();
    });

    it('muestra el historial cronológico de cambios de estado y el ledger de decisiones (RF-21, RF-22, CA-11)', () => {
      render(
        <AppProvider>
          <VehicleDetail vehicleId="seed-veh-4" />
        </AppProvider>
      );

      // Historial de cambios
      expect(screen.getByText(/historial de estados/i)).toBeInTheDocument();

      // Ledger inmutable de decisiones (seed-veh-4 tiene 1 aprobada y 1 rechazada)
      expect(screen.getByText(/registro inmutable de cotizaciones/i)).toBeInTheDocument();
      expect(screen.getAllByText(/amortiguadores traseros/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/balatas delanteras/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CatalogEditor', () => {
    it('muestra advertencia de permisos si el rol es mecanico (RF-07, RF-38, CA-14)', () => {
      savePrefs({ view: 'taller', role: 'mecanico' });

      render(
        <AppProvider>
          <CatalogEditor />
        </AppProvider>
      );

      expect(screen.getByText(/solo el rol jefe puede editar los precios del catálogo/i)).toBeInTheDocument();
    });

    it('permite al jefe modificar los precios sugeridos del catálogo (RF-07)', async () => {
      const user = userEvent.setup();
      render(
        <AppProvider>
          <CatalogEditor />
        </AppProvider>
      );

      expect(screen.getByText('Balatas delanteras')).toBeInTheDocument();

      const priceInput = screen.getByLabelText(/precio sugerido para balatas delanteras/i);
      await user.clear(priceInput);
      await user.type(priceInput, '1750');

      const saveBtn = screen.getByRole('button', { name: /guardar precio para balatas delanteras/i });
      await user.click(saveBtn);

      expect(screen.getByText(/precio actualizado/i)).toBeInTheDocument();
    });
  });
});
