import type { AppData, DemoPrefs } from '../domain/types';
import {
  SCHEMA_VERSION,
  STORAGE_KEY_DATA,
  STORAGE_KEY_PREFS,
  isAppData,
} from './schema';
import { createSeed } from './seed';

export const DEFAULT_PREFS: DemoPrefs = {
  view: 'taller',
  role: 'jefe',
};

export interface LoadDataResult {
  data: AppData;
  notice?: 'reset-corrupt';
}

export function loadData(): LoadDataResult {
  if (typeof localStorage === 'undefined') {
    return { data: createSeed() };
  }

  const raw = localStorage.getItem(STORAGE_KEY_DATA);

  if (raw === null || raw.trim() === '') {
    const seed = createSeed();
    saveData(seed);
    return { data: seed };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as { schemaVersion?: unknown }).schemaVersion === SCHEMA_VERSION &&
      isAppData(parsed)
    ) {
      return { data: parsed };
    }
  } catch {
    // JSON malformado
  }

  // Si los datos están corruptos o el esquema es incompatible, regenerar semilla
  const freshSeed = createSeed();
  saveData(freshSeed);
  return {
    data: freshSeed,
    notice: 'reset-corrupt',
  };
}

export function saveData(data: AppData): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
}

export function resetDemo(): AppData {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_DATA);
  }
  const fresh = createSeed();
  saveData(fresh);
  return fresh;
}

export function loadPrefs(): DemoPrefs {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_PREFS;
  }

  const raw = localStorage.getItem(STORAGE_KEY_PREFS);
  if (!raw) {
    return DEFAULT_PREFS;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      ((parsed as DemoPrefs).view === 'taller' || (parsed as DemoPrefs).view === 'cliente') &&
      ((parsed as DemoPrefs).role === 'mecanico' || (parsed as DemoPrefs).role === 'jefe')
    ) {
      return parsed as DemoPrefs;
    }
  } catch {
    // Malformado
  }

  return DEFAULT_PREFS;
}

export function savePrefs(prefs: DemoPrefs): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
}

export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY_DATA || event.key === null) {
      callback();
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}
