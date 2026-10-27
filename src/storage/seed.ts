import type {
  AppData,
  Vehicle,
  CatalogItem,
  Quote,
  LedgerEntry,
  StateChange,
} from '../domain/types';
import { SCHEMA_VERSION } from './schema';

function offsetIso(baseIso: string, minutesAgo: number): string {
  const d = new Date(baseIso);
  const time = d.getTime() - minutesAgo * 60 * 1000;
  return new Date(time).toISOString();
}

export function createSeed(baseNow?: string): AppData {
  const now = baseNow ?? '2026-10-26T16:00:00.000Z';

  const catalog: CatalogItem[] = [
    {
      id: 'cat-balatas',
      label: 'Balatas delanteras',
      suggestedPrice: 1450,
    },
    {
      id: 'cat-amortiguadores',
      label: 'Amortiguadores traseros',
      suggestedPrice: 3200,
    },
    {
      id: 'cat-distribucion',
      label: 'Banda de distribución',
      suggestedPrice: 2800,
    },
    {
      id: 'cat-bateria',
      label: 'Cambio de batería',
      suggestedPrice: 2100,
    },
    {
      id: 'cat-afinacion',
      label: 'Afinación mayor',
      suggestedPrice: 3600,
    },
    {
      id: 'cat-llantas',
      label: 'Juego de llantas',
      suggestedPrice: 6500,
    },
  ];

  // 1. Vehículo Recibido
  const veh1: Vehicle = {
    id: 'seed-veh-1',
    token: 'Rm7kQ2xVb9Ld',
    isSeed: true,
    clientName: 'Roberto Gómez',
    phone: '525512345678',
    vehicleDesc: 'Nissan Versa 2020 Plata',
    plates: 'NVA1234',
    reason: 'Ruido metálico leve al frenar',
    state: 'recibido',
    pausedFrom: null,
    pauseId: null,
    createdAt: offsetIso(now, 30),
    updatedAt: offsetIso(now, 30),
  };

  // 2. Vehículo En diagnóstico
  const veh2: Vehicle = {
    id: 'seed-veh-2',
    token: 'Tk8mP3yWc1Ne',
    isSeed: true,
    clientName: 'María Luisa Fernández',
    phone: '525587654321',
    vehicleDesc: 'Volkswagen Jetta 2018 Blanco',
    plates: 'VWJ5678',
    reason: 'Testigo de check engine encendido y pérdida de potencia',
    state: 'diagnostico',
    pausedFrom: null,
    pauseId: null,
    createdAt: offsetIso(now, 120),
    updatedAt: offsetIso(now, 60),
  };

  // 3. Vehículo Esperando aprobación (pausado en diagnostico)
  const pauseId3 = 'seed-pause-3';
  const veh3: Vehicle = {
    id: 'seed-veh-3',
    token: 'Wn9qR4zXd2Pf',
    isSeed: true,
    clientName: 'Carlos Mendoza',
    phone: '525533445566',
    vehicleDesc: 'Chevrolet Aveo 2019 Rojo',
    plates: 'AVE9012',
    reason: 'Falla al arrancar por las mañanas',
    state: 'espera_aprobacion',
    pausedFrom: 'diagnostico',
    pauseId: pauseId3,
    createdAt: offsetIso(now, 240),
    updatedAt: offsetIso(now, 90),
  };

  // 4. Vehículo En reparación (tuvo cotizaciones aprobadas y rechazadas)
  const veh4: Vehicle = {
    id: 'seed-veh-4',
    token: 'Yp1sS5aYe3Qg',
    isSeed: true,
    clientName: 'Laura Patricia Sánchez',
    phone: '525544556677',
    vehicleDesc: 'Honda Civic 2021 Azul',
    plates: 'HND3456',
    reason: 'Revisión preventiva antes de salir a carretera',
    state: 'reparacion',
    pausedFrom: null,
    pauseId: null,
    createdAt: offsetIso(now, 360),
    updatedAt: offsetIso(now, 180),
  };

  // 5. Vehículo Listo para entregar
  const veh5: Vehicle = {
    id: 'seed-veh-5',
    token: 'Zr2tT6bZf4Rh',
    isSeed: true,
    clientName: 'Fernando Morales',
    phone: '525566778899',
    vehicleDesc: 'Mazda 3 2017 Negro',
    plates: 'MZD7890',
    reason: 'Cambio de banda de distribución y revisión general',
    state: 'listo',
    pausedFrom: null,
    pauseId: null,
    createdAt: offsetIso(now, 480),
    updatedAt: offsetIso(now, 45),
  };

  // 6. Vehículo Entregado
  const veh6: Vehicle = {
    id: 'seed-veh-6',
    token: 'As3uU7cAg5Si',
    isSeed: true,
    clientName: 'Sofía Valenzuela',
    phone: '525577889900',
    vehicleDesc: 'Ford Fiesta 2016 Blanco',
    plates: 'FRD2345',
    reason: 'Afinación mayor completa y cambio de balatas',
    state: 'entregado',
    pausedFrom: null,
    pauseId: null,
    createdAt: offsetIso(now, 1440),
    updatedAt: offsetIso(now, 120),
  };

  const vehicles: Vehicle[] = [veh1, veh2, veh3, veh4, veh5, veh6];

  // Cotización pendiente para Vehículo 3
  const quote3: Quote = {
    id: 'seed-quote-3-1',
    vehicleId: veh3.id,
    pauseId: pauseId3,
    catalogItemId: 'cat-bateria',
    label: 'Cambio de batería',
    note: 'Batería sulfatada sin retención de carga, vida útil agotada',
    amount: 2100,
    exactDescription: 'Cambio de batería — Nota: Batería sulfatada sin retención de carga, vida útil agotada',
    status: 'pendiente',
    sentAt: offsetIso(now, 90),
    sentBy: 'mecanico',
  };

  // Cotizaciones resueltas para Vehículo 4
  const pauseId4 = 'seed-pause-4';
  const quote4Approved: Quote = {
    id: 'seed-quote-4-1',
    vehicleId: veh4.id,
    pauseId: pauseId4,
    catalogItemId: 'cat-balatas',
    label: 'Balatas delanteras',
    note: 'Desgaste al 90% con daño leve en discos',
    amount: 1450,
    exactDescription: 'Balatas delanteras — Nota: Desgaste al 90% con daño leve en discos',
    status: 'aprobada',
    sentAt: offsetIso(now, 240),
    sentBy: 'mecanico',
  };

  const quote4Rejected: Quote = {
    id: 'seed-quote-4-2',
    vehicleId: veh4.id,
    pauseId: pauseId4,
    catalogItemId: 'cat-amortiguadores',
    label: 'Amortiguadores traseros',
    note: 'Fuga ligera de aceite en vástago derecho',
    amount: 3200,
    exactDescription: 'Amortiguadores traseros — Nota: Fuga ligera de aceite en vástago derecho',
    status: 'rechazada',
    sentAt: offsetIso(now, 235),
    sentBy: 'jefe',
  };

  const quotes: Quote[] = [quote3, quote4Approved, quote4Rejected];

  // Ledger de decisiones inmutables
  const ledger: LedgerEntry[] = [
    {
      id: 'seed-ledger-4-1',
      vehicleId: veh4.id,
      quoteId: quote4Approved.id,
      result: 'aprobada',
      decidedBy: 'Laura Patricia Sánchez',
      actor: { kind: 'cliente' },
      at: offsetIso(now, 185),
      amount: quote4Approved.amount,
      exactDescription: quote4Approved.exactDescription,
    },
    {
      id: 'seed-ledger-4-2',
      vehicleId: veh4.id,
      quoteId: quote4Rejected.id,
      result: 'rechazada',
      decidedBy: 'Laura Patricia Sánchez',
      actor: { kind: 'cliente' },
      at: offsetIso(now, 180),
      amount: quote4Rejected.amount,
      exactDescription: quote4Rejected.exactDescription,
    },
  ];

  // Historial de cambios de estado para cada vehículo
  const history: StateChange[] = [
    // Vehículo 1
    {
      id: 'seed-hist-1-1',
      vehicleId: veh1.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 30),
      actor: { kind: 'taller', role: 'jefe' },
    },

    // Vehículo 2
    {
      id: 'seed-hist-2-1',
      vehicleId: veh2.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 120),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-2-2',
      vehicleId: veh2.id,
      from: 'recibido',
      to: 'diagnostico',
      at: offsetIso(now, 60),
      actor: { kind: 'taller', role: 'mecanico' },
    },

    // Vehículo 3
    {
      id: 'seed-hist-3-1',
      vehicleId: veh3.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 240),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-3-2',
      vehicleId: veh3.id,
      from: 'recibido',
      to: 'diagnostico',
      at: offsetIso(now, 180),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-3-3',
      vehicleId: veh3.id,
      from: 'diagnostico',
      to: 'espera_aprobacion',
      at: offsetIso(now, 90),
      actor: { kind: 'sistema' },
    },

    // Vehículo 4
    {
      id: 'seed-hist-4-1',
      vehicleId: veh4.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 360),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-4-2',
      vehicleId: veh4.id,
      from: 'recibido',
      to: 'diagnostico',
      at: offsetIso(now, 300),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-4-3',
      vehicleId: veh4.id,
      from: 'diagnostico',
      to: 'espera_aprobacion',
      at: offsetIso(now, 240),
      actor: { kind: 'sistema' },
    },
    {
      id: 'seed-hist-4-4',
      vehicleId: veh4.id,
      from: 'espera_aprobacion',
      to: 'reparacion',
      at: offsetIso(now, 180),
      actor: { kind: 'sistema' },
    },

    // Vehículo 5
    {
      id: 'seed-hist-5-1',
      vehicleId: veh5.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 480),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-5-2',
      vehicleId: veh5.id,
      from: 'recibido',
      to: 'diagnostico',
      at: offsetIso(now, 420),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-5-3',
      vehicleId: veh5.id,
      from: 'diagnostico',
      to: 'reparacion',
      at: offsetIso(now, 300),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-5-4',
      vehicleId: veh5.id,
      from: 'reparacion',
      to: 'listo',
      at: offsetIso(now, 45),
      actor: { kind: 'taller', role: 'jefe' },
    },

    // Vehículo 6 (Entregado con historial completo)
    {
      id: 'seed-hist-6-1',
      vehicleId: veh6.id,
      from: null,
      to: 'recibido',
      at: offsetIso(now, 1440),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-6-2',
      vehicleId: veh6.id,
      from: 'recibido',
      to: 'diagnostico',
      at: offsetIso(now, 1300),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-6-3',
      vehicleId: veh6.id,
      from: 'diagnostico',
      to: 'reparacion',
      at: offsetIso(now, 1000),
      actor: { kind: 'taller', role: 'mecanico' },
    },
    {
      id: 'seed-hist-6-4',
      vehicleId: veh6.id,
      from: 'reparacion',
      to: 'listo',
      at: offsetIso(now, 500),
      actor: { kind: 'taller', role: 'jefe' },
    },
    {
      id: 'seed-hist-6-5',
      vehicleId: veh6.id,
      from: 'listo',
      to: 'entregado',
      at: offsetIso(now, 120),
      actor: { kind: 'taller', role: 'jefe' },
    },
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    vehicles,
    quotes,
    ledger,
    history,
    catalog,
  };
}
