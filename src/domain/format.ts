/**
 * Formateadores de moneda y fecha/hora para es-MX.
 * Cumple con S-08 y RNF-04: moneda MXN e idioma es-MX.
 */

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto numérico a moneda mexicana (MXN), ej. "$1,500.00".
 */
export function formatCurrencyMXN(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return currencyFormatter.format(amount);
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
});

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/**
 * Formatea una fecha ISO a fecha y hora en español mexicano.
 */
export function formatDateTime(
  date: string | Date,
  customOptions?: Intl.DateTimeFormatOptions
): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  if (customOptions) {
    return new Intl.DateTimeFormat('es-MX', customOptions).format(d);
  }
  return dateTimeFormatter.format(d);
}

/**
 * Formatea una fecha ISO solo con día, mes y año.
 */
export function formatDate(date: string | Date): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  return dateFormatter.format(d);
}

/**
 * Formatea una fecha ISO solo con hora y minutos.
 */
export function formatTime(date: string | Date): string {
  const d = toDate(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  return timeFormatter.format(d);
}
