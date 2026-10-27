import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppData, DemoPrefs, Role, Result } from '../domain/types';
import type { AppAction } from '../domain/app';
import { applyAppAction } from '../domain/app';
import {
  loadData,
  saveData,
  loadPrefs,
  savePrefs,
  resetDemo as resetDemoStorage,
  subscribeToStorage,
} from '../storage/repository';

export interface AppContextValue {
  data: AppData;
  prefs: DemoPrefs;
  notice: string | null;
  setRole: (role: Role) => void;
  setView: (view: 'taller' | 'cliente') => void;
  resetDemo: () => void;
  setNotice: (notice: string | null) => void;
  dismissNotice: () => void;
  dispatch: (action: AppAction) => Result<AppData>;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [dataState, setDataState] = useState<AppData>(() => {
    const initial = loadData();
    return initial.data;
  });

  const [prefsState, setPrefsState] = useState<DemoPrefs>(() => loadPrefs());

  const [noticeState, setNoticeState] = useState<string | null>(() => {
    const initial = loadData();
    return initial.notice ?? null;
  });

  // Suscripción a eventos storage para sincronización multiventana (RF-35)
  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      const fresh = loadData();
      setDataState(fresh.data);
      if (fresh.notice) {
        setNoticeState(fresh.notice);
      }
    });

    return unsubscribe;
  }, []);

  const setRole = useCallback((role: Role) => {
    setPrefsState((prev) => {
      const next: DemoPrefs = { ...prev, role };
      savePrefs(next);
      return next;
    });
  }, []);

  const setView = useCallback((view: 'taller' | 'cliente') => {
    setPrefsState((prev) => {
      const next: DemoPrefs = { ...prev, view };
      savePrefs(next);
      return next;
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = resetDemoStorage();
    setDataState(fresh);
    setNoticeState(null);
  }, []);

  const dismissNotice = useCallback(() => {
    setNoticeState(null);
  }, []);

  const setNotice = useCallback((msg: string | null) => {
    setNoticeState(msg);
  }, []);

  /**
   * Despacho atómico:
   * 1. Lee datos frescos de localStorage
   * 2. Aplica reducer puro (applyAppAction)
   * 3. Si ok: guarda en localStorage y actualiza estado
   * 4. Si error: actualiza el estado local con los datos frescos para reflejar
   *    el estado real (ej. si otra pestaña ya aprobó o retiró la cotización) (RF-17, RNF-09).
   */
  const dispatch = useCallback((action: AppAction): Result<AppData> => {
    const fresh = loadData();
    const result = applyAppAction(fresh.data, action);

    if (result.ok) {
      saveData(result.data);
      setDataState(result.data);
      return result;
    } else {
      setDataState(fresh.data);
      return result;
    }
  }, []);

  const value: AppContextValue = {
    data: dataState,
    prefs: prefsState,
    notice: noticeState,
    setRole,
    setView,
    resetDemo,
    setNotice,
    dismissNotice,
    dispatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
