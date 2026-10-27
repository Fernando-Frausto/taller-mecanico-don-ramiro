import { useState, useEffect } from 'react';

export type Route =
  | { kind: 'taller_list' }
  | { kind: 'taller_delivered' }
  | { kind: 'taller_new' }
  | { kind: 'taller_catalog' }
  | { kind: 'taller_vehicle'; vehicleId: string }
  | { kind: 'cliente'; token: string }
  | { kind: 'not_found' };

/**
 * Parsea el hash actual de la URL en una ruta tipada.
 * Rutas soportadas:
 * - #/ o #/taller -> taller_list
 * - #/taller/entregados -> taller_delivered
 * - #/taller/nuevo -> taller_new
 * - #/taller/catalogo -> taller_catalog
 * - #/taller/v/:id -> taller_vehicle
 * - #/c/:token -> cliente
 */
export function parseRoute(hash: string): Route {
  // Limpiar # inicial
  let clean = hash.trim();
  if (clean.startsWith('#')) {
    clean = clean.slice(1);
  }

  // Asegurar que comience con / si tiene algo, o manejar string vacío
  if (!clean || clean === '/' || clean === '/taller' || clean === '/taller/' || clean === 'taller') {
    return { kind: 'taller_list' };
  }

  // Normalizar / al inicio
  const path = clean.startsWith('/') ? clean : `/${clean}`;

  if (path === '/taller/entregados' || path === '/taller/entregados/') {
    return { kind: 'taller_delivered' };
  }

  if (path === '/taller/nuevo' || path === '/taller/nuevo/') {
    return { kind: 'taller_new' };
  }

  if (path === '/taller/catalogo' || path === '/taller/catalogo/') {
    return { kind: 'taller_catalog' };
  }

  const vehicleMatch = path.match(/^\/taller\/v\/([^/]+)\/?$/);
  if (vehicleMatch && vehicleMatch[1].trim()) {
    return {
      kind: 'taller_vehicle',
      vehicleId: decodeURIComponent(vehicleMatch[1].trim()),
    };
  }

  const clientMatch = path.match(/^\/c\/([^/]+)\/?$/);
  if (clientMatch && clientMatch[1].trim()) {
    return {
      kind: 'cliente',
      token: decodeURIComponent(clientMatch[1].trim()),
    };
  }

  return { kind: 'not_found' };
}

/**
 * Actualiza el hash de la URL de forma reactiva en el navegador.
 */
export function navigate(to: string): void {
  const targetHash = to.startsWith('#')
    ? to
    : `#${to.startsWith('/') ? to : '/' + to}`;

  if (typeof window !== 'undefined') {
    const prev = window.location.hash;
    window.location.hash = targetHash;
    if (typeof HashChangeEvent !== 'undefined') {
      window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: prev, newURL: targetHash }));
    } else {
      window.dispatchEvent(new Event('hashchange'));
    }
  }
}

/**
 * Hook para sincronizar la ruta hash actual en componentes React.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window !== 'undefined' ? parseRoute(window.location.hash) : { kind: 'taller_list' }
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleHashChange = () => {
      setRoute(parseRoute(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return route;
}
