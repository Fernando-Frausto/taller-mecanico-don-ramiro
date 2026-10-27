import { Role } from './types';

/**
 * Permisos por rol en el taller — Taller Mecánico "Don Ramiro"
 * Cumple con RF-01, RF-04, RF-05, RF-06, RF-07, RF-31, RF-38 y CA-14.
 */

/**
 * Solo el rol Jefe puede dar de alta nuevos vehículos (RF-01, RF-38, CA-14).
 */
export function canCreateVehicle(role: Role): boolean {
  return role === 'jefe';
}

/**
 * Solo el rol Jefe puede editar los precios sugeridos del catálogo (RF-07, RF-38, CA-14).
 */
export function canEditCatalogPrice(role: Role): boolean {
  return role === 'jefe';
}

/**
 * Solo el rol Jefe puede editar el precio en un borrador de cotización (RF-07).
 */
export function canEditQuoteDraftPrice(role: Role): boolean {
  return role === 'jefe';
}

/**
 * Tanto Mecánico como Jefe pueden avanzar el estado manual del vehículo (RF-04).
 */
export function canAdvanceState(role: Role): boolean {
  return role === 'mecanico' || role === 'jefe';
}

/**
 * Tanto Mecánico como Jefe pueden proponer cotizaciones adicionales (RF-06).
 */
export function canProposeQuote(role: Role): boolean {
  return role === 'mecanico' || role === 'jefe';
}

/**
 * Tanto Mecánico como Jefe pueden retirar cotizaciones pendientes (RF-31).
 */
export function canWithdrawQuote(role: Role): boolean {
  return role === 'mecanico' || role === 'jefe';
}

/**
 * Tanto Mecánico como Jefe pueden corregir el estado al anterior con confirmación (RF-05).
 */
export function canCorrectState(role: Role): boolean {
  return role === 'mecanico' || role === 'jefe';
}
