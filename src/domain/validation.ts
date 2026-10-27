/**
 * Módulo de validaciones de dominio — Taller Mecánico "Don Ramiro"
 * Cumple con RF-01, RF-02, RF-16, RF-33, RF-39; CA-01, CA-17, CA-20.
 */

import type {
  Vehicle,
  VehicleInput,
  VehicleValidationResult,
  VehicleFieldErrors,
  DecisionNameValidationResult,
} from './types';

/**
 * Normaliza un número de teléfono mexicano a 12 dígitos ('52' + 10 dígitos locales).
 * Acepta formatos con espacios, guiones, paréntesis y prefijos +52 o 52.
 * Devuelve null si no corresponde a un número mexicano válido de 10 dígitos.
 */
export function normalizePhone(raw: string): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  // Eliminar todo lo que no sea dígito
  const digits = raw.replace(/\D/g, '');

  // 10 dígitos locales (México) -> prefijar con 52
  if (digits.length === 10) {
    return `52${digits}`;
  }

  // 12 dígitos que ya comienzan con '52'
  if (digits.length === 12 && digits.startsWith('52')) {
    return digits;
  }

  // 13 dígitos que comienzan con '521' (antiguo formato móvil en WhatsApp)
  if (digits.length === 13 && digits.startsWith('521')) {
    return `52${digits.slice(3)}`;
  }

  return null;
}

/**
 * Normaliza placas vehiculares: mayúsculas y solo caracteres alfanuméricos (sin espacios ni guiones).
 */
export function normalizePlates(raw: string): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Valida los datos para dar de alta un vehículo en el taller.
 * - clientName: obligatorio, trim
 * - phone: obligatorio, 10 dígitos México normalizado con prefijo 52
 * - vehicleDesc: obligatorio, trim
 * - plates: obligatorio, alfanumérico normalizado, único entre vehículos no entregados (RF-33)
 * - reason: opcional, trim
 * Retorna mapeo de campo -> error para visualización en la UI (RF-39) y datos normalizados si es válido.
 */
export function validateNewVehicle(
  input: VehicleInput,
  existingVehicles: Vehicle[] = []
): VehicleValidationResult {
  const errors: VehicleFieldErrors = {};

  // 1. Nombre del cliente
  const trimmedClientName = (input.clientName ?? '').trim();
  if (!trimmedClientName) {
    errors.clientName = 'El nombre del cliente es obligatorio.';
  }

  // 2. Teléfono
  const rawPhone = (input.phone ?? '').trim();
  const normalizedPhone = normalizePhone(rawPhone);
  if (!rawPhone) {
    errors.phone = 'El teléfono del cliente es obligatorio (10 dígitos).';
  } else if (!normalizedPhone) {
    errors.phone = 'El teléfono debe contener exactamente 10 dígitos.';
  }

  // 3. Descripción del vehículo
  const trimmedVehicleDesc = (input.vehicleDesc ?? '').trim();
  if (!trimmedVehicleDesc) {
    errors.vehicleDesc = 'La descripción del vehículo es obligatoria.';
  }

  // 4. Placas
  const rawPlates = (input.plates ?? '').trim();
  const normalizedPlates = normalizePlates(rawPlates);

  if (!rawPlates) {
    errors.plates = 'Las placas son obligatorias.';
  } else if (!normalizedPlates) {
    errors.plates = 'Las placas deben contener caracteres alfanuméricos válidos.';
  } else {
    // Verificar unicidad entre vehículos no entregados (state !== 'entregado')
    const hasConflict = existingVehicles.some((v) => {
      if (v.state === 'entregado') {
        return false;
      }
      return normalizePlates(v.plates) === normalizedPlates;
    });

    if (hasConflict) {
      errors.plates =
        'Conflicto: ya existe un vehículo en taller con las mismas placas.';
    }
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return {
      isValid: false,
      errors,
    };
  }

  const trimmedReason = input.reason?.trim() ? input.reason.trim() : undefined;

  return {
    isValid: true,
    errors: {},
    data: {
      clientName: trimmedClientName,
      phone: normalizedPhone!,
      vehicleDesc: trimmedVehicleDesc,
      plates: normalizedPlates,
      reason: trimmedReason,
    },
  };
}

/**
 * Valida el nombre capturado al aprobar o rechazar una cotización.
 * RF-16 y CA-20: obligatorio, trim, entre 2 y 60 caracteres tras recortar espacios.
 */
export function validateDecisionName(name: string): DecisionNameValidationResult {
  if (typeof name !== 'string') {
    return {
      isValid: false,
      error: 'El nombre es obligatorio.',
      trimmedName: '',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'El nombre es obligatorio.',
      trimmedName: '',
    };
  }

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'El nombre debe tener al menos 2 caracteres.',
      trimmedName: trimmed,
    };
  }

  if (trimmed.length > 60) {
    return {
      isValid: false,
      error: 'El nombre debe tener como máximo 60 caracteres.',
      trimmedName: trimmed,
    };
  }

  return {
    isValid: true,
    trimmedName: trimmed,
  };
}
