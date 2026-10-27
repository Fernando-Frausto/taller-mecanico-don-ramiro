/**
 * Módulo para generación de enlaces y mensajes de WhatsApp — Taller Mecánico "Don Ramiro"
 * Cumple con RF-02, RF-23, RF-24, RF-25, RF-37; CA-12, CA-23.
 */

import type { Vehicle, Quote, VehicleState } from './types';
import { formatCurrencyMXN } from './format';

/**
 * Nombres amigables en español de cada estado del vehículo para la comunicación con el cliente.
 */
export const STATE_LABELS: Record<VehicleState, string> = {
  recibido: 'Recibido',
  diagnostico: 'En diagnóstico',
  espera_aprobacion: 'Esperando aprobación',
  reparacion: 'En reparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
};

/**
 * Construye la URL de seguimiento única para el cliente utilizando hash routing (RF-37, CA-23).
 * Ejemplos:
 * - `https://taller-don-ramiro.com/#/c/Rm7kQ2xVb9Ld`
 * - `#/c/Rm7kQ2xVb9Ld` (cuando no se especifica baseUrl y window no está definido)
 */
export function buildClientUrl(token: string, baseUrl?: string): string {
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('El token es obligatorio para generar la URL del cliente.');
  }

  if (baseUrl !== undefined) {
    const clean = baseUrl.replace(/#.*$/, '');
    if (!clean) {
      return `#/c/${token}`;
    }
    return clean.endsWith('/') ? `${clean}#/c/${token}` : `${clean}/#/c/${token}`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin ?? '';
    const pathname = window.location.pathname ?? '';
    const base = `${origin}${pathname}`;
    if (!base) {
      return `#/c/${token}`;
    }
    return base.endsWith('/') ? `${base}#/c/${token}` : `${base}/#/c/${token}`;
  }

  return `#/c/${token}`;
}

/**
 * Construye un mensaje en español amigable para avisar del estado actual del vehículo
 * y compartir el enlace único de seguimiento por WhatsApp (RF-23, CA-12).
 */
export function buildStatusUpdateMessage(vehicle: Vehicle, clientUrl: string): string {
  const stateLabel = STATE_LABELS[vehicle.state] ?? vehicle.state;

  return (
    `Hola ${vehicle.clientName}, te informamos desde Taller Mecánico "Don Ramiro" ` +
    `que tu vehículo ${vehicle.vehicleDesc} (Placas: ${vehicle.plates}) ` +
    `se encuentra en estado: ${stateLabel}.\n\n` +
    `Puedes consultar los detalles y dar seguimiento en:\n${clientUrl}`
  );
}

/**
 * Construye un mensaje prellenado para avisar de una reparación adicional identificada,
 * incluyendo monto en formato MXN y enlace para aprobar o rechazar (RF-24, CA-12).
 */
export function buildQuoteMessage(
  vehicle: Vehicle,
  quote: Quote,
  clientUrl: string
): string {
  const formattedAmount = formatCurrencyMXN(quote.amount);

  return (
    `Hola ${vehicle.clientName}, en Taller Mecánico "Don Ramiro" identificamos ` +
    `una reparación adicional para tu vehículo ${vehicle.vehicleDesc} (Placas: ${vehicle.plates}):\n\n` +
    `• Reparación: ${quote.exactDescription}\n` +
    `• Monto: ${formattedAmount}\n\n` +
    `Por favor revisa los detalles y confirma si deseas aprobar o rechazar la cotización en el siguiente enlace:\n` +
    `${clientUrl}`
  );
}

/**
 * Construye una URL para abrir WhatsApp (`https://wa.me/52...?text=...`)
 * codificando adecuadamente el texto prellenado (RF-23, RF-24, CA-12).
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
