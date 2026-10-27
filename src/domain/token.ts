/**
 * Generador y validador de tokens únicos para enlaces de clientes.
 * Cumple con RF-02 y CA-01: tokens alfanuméricos de al menos 10 caracteres (por defecto 12).
 */

const ALPHANUMERIC_CHARSET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Genera un token alfanumérico aleatorio o determinista con longitud >= 10.
 * @param length Longitud deseada del token (por defecto 12, mínimo 10)
 * @param randomFn Función que retorna un número en [0, 1) (por defecto Math.random)
 */
export function generateToken(
  length: number = 12,
  randomFn: () => number = Math.random
): string {
  if (length < 10) {
    throw new Error('El token debe tener al menos 10 caracteres alfanuméricos.');
  }

  const chars: string[] = [];
  const charsetLength = ALPHANUMERIC_CHARSET.length;

  for (let i = 0; i < length; i++) {
    const rand = Math.floor(randomFn() * charsetLength);
    chars.push(ALPHANUMERIC_CHARSET[rand % charsetLength]);
  }

  return chars.join('');
}

/**
 * Valida si un valor corresponde a un token alfanumérico válido (>= 10 caracteres).
 */
export function isValidToken(token: unknown): token is string {
  if (typeof token !== 'string') {
    return false;
  }
  if (token.length < 10) {
    return false;
  }
  return /^[a-zA-Z0-9]+$/.test(token);
}
