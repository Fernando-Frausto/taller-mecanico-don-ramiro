# AGENTS.md — Taller Mecánico

## Contexto
Reto: elegir un problema y entregar una solución con URL de demostración pública.
Problema elegido (texto original):

> Don Ramiro tiene un taller con cuatro mecánicos que solo usan el celular, casi siempre con las manos sucias. Los clientes llaman varias veces al día para preguntar si su coche está listo, y cada llamada interrumpe el trabajo. Cuando al revisar un coche aparece una reparación adicional, el trabajo se detiene hasta que el cliente aprueba el costo por teléfono, lo que puede tardar días, y a veces el cliente luego niega haberla aprobado. Necesita que los clientes conozcan el estado de su coche sin llamar y que puedan aprobar cotizaciones de forma rápida y con registro. No necesita control de inventario, que ya se lleva en Excel.

## Stack
- React + Vite + TypeScript, Vitest para tests.
- Sin backend: persistencia en `localStorage`, datos semilla.
- Despliegue: Vercel (build estático).

## Flujo de trabajo
- SDD: `specs/NNN-nombre/{spec.md, plan.md, tasks.md}`.
- Leer siempre `docs/constitution.md` antes de trabajar.
- SO del desarrollador: Windows (PowerShell).
