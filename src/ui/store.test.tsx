import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from './store';
import { createSeed } from '../storage/seed';
import { STORAGE_KEY_DATA, STORAGE_KEY_PREFS } from '../storage/schema';
import { advanceStateAction, updateCatalogPriceAction } from '../domain/app';

describe('App Store y Context', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lanza error si useApp se utiliza fuera de AppProvider', () => {
    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp debe ser usado dentro de un AppProvider');
  });

  it('inicializa con datos de la semilla cuando localStorage está vacío', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.data.vehicles.length).toBeGreaterThanOrEqual(5);
    expect(result.current.prefs.role).toBe('jefe');
    expect(result.current.notice).toBeNull();
  });

  it('permite cambiar el rol y persiste en DemoPrefs', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setRole('mecanico');
    });

    expect(result.current.prefs.role).toBe('mecanico');
    const storedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}');
    expect(storedPrefs.role).toBe('mecanico');
  });

  it('permite cambiar la vista y persiste en DemoPrefs', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setView('cliente');
    });

    expect(result.current.prefs.view).toBe('cliente');
    const storedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFS) || '{}');
    expect(storedPrefs.view).toBe('cliente');
  });

  it('despacha acciones válidas, actualiza el estado y persiste en localStorage', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    // Actualizar precio de catálogo
    const firstItem = result.current.data.catalog[0];
    const newPrice = firstItem.suggestedPrice + 500;

    let dispatchResult: any;
    act(() => {
      dispatchResult = result.current.dispatch(
        updateCatalogPriceAction(firstItem.id, newPrice, 'jefe')
      );
    });

    expect(dispatchResult.ok).toBe(true);
    expect(result.current.data.catalog[0].suggestedPrice).toBe(newPrice);

    // Verificar en localStorage
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_DATA)!);
    expect(saved.catalog[0].suggestedPrice).toBe(newPrice);
  });

  it('despacha acciones concurrentes/fallidas y actualiza el estado local con datos frescos', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    // Simular que otra pestaña modificó los datos en localStorage
    const initialSeed = createSeed();
    const modifiedSeed = {
      ...initialSeed,
      catalog: initialSeed.catalog.map((c, i) =>
        i === 0 ? { ...c, suggestedPrice: 9999 } : c
      ),
    };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(modifiedSeed));

    // Despachar una acción inválida (vehículo inexistente)
    let dispatchResult: any;
    act(() => {
      dispatchResult = result.current.dispatch(
        advanceStateAction('veh-inexistente', 'jefe')
      );
    });

    expect(dispatchResult.ok).toBe(false);
    expect(dispatchResult.error.code).toBe('not_found');
    // El estado local debe haberse sincronizado con los datos frescos del storage (9999)
    expect(result.current.data.catalog[0].suggestedPrice).toBe(9999);
  });

  it('sincroniza automáticamente los datos ante eventos de almacenamiento multiventana (RF-35)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    const newSeed = createSeed();
    const updatedSeed = {
      ...newSeed,
      catalog: newSeed.catalog.map((c, i) =>
        i === 0 ? { ...c, suggestedPrice: 7777 } : c
      ),
    };
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedSeed));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY_DATA,
        })
      );
    });

    expect(result.current.data.catalog[0].suggestedPrice).toBe(7777);
  });

  it('resetDemo restaura los datos semilla deterministas y actualiza el estado', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.resetDemo();
    });

    expect(result.current.data.vehicles.length).toBeGreaterThanOrEqual(5);
    expect(result.current.notice).toBeNull();
  });

  it('maneja y descarta avisos del sistema (notice / dismissNotice)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppProvider>{children}</AppProvider>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setNotice('Aviso de prueba');
    });

    expect(result.current.notice).toBe('Aviso de prueba');

    act(() => {
      result.current.dismissNotice();
    });

    expect(result.current.notice).toBeNull();
  });
});
