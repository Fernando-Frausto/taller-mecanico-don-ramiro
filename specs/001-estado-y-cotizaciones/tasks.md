# Tareas de implementación — Spec 001: Taller Mecánico "Don Ramiro"

- **Spec:** `specs/001-estado-y-cotizaciones/spec.md` (Revisión 2)
- **Plan:** `specs/001-estado-y-cotizaciones/plan.md`
- **Constitución:** `docs/constitution.md`

---

### - [x] T1: Scaffolding del proyecto y configuración de Vitest
- **RF cubiertos:** RNF-05, RNF-06, Constitución §5, §6
- **Archivos:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `vercel.json`, `.gitignore`
- **Descripción:** Crear estructura de proyecto React 18 + Vite + TypeScript de forma no interactiva. Configurar scripts (`dev`, `build`, `test`), dependencias (`react`, `react-dom`, y de desarrollo: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`). Configurar `vitest` con entorno `jsdom` y setup file. Configurar `vercel.json` estático. Instalar paquetes con `npm install`.
- **Hecho cuando:** `npm run build` y `npm test` se ejecutan sin errores y terminan limpiamente.

---

### - [x] T2: Dominio — Tipos base, generación de tokens y validaciones
- **RF cubiertos:** RF-01, RF-02, RF-16, RF-33, RF-39; CA-01, CA-17, CA-20
- **Archivos:** `src/domain/types.ts`, `src/domain/token.ts`, `src/domain/validation.ts`, `src/domain/format.ts`, `src/domain/token.test.ts`, `src/domain/validation.test.ts`
- **Descripción:** TDD: Escribir pruebas para validar campos del alta (nombre, teléfono de 10 dígitos a formato con prefijo 52, vehículo, placas alfanuméricas únicas en mayúsculas), nombre de decisión del cliente (trim, 2–60 caracteres) y generación de token aleatorio alfanumérico ≥ 10 caracteres. Implementar las funciones de validación, formateo de moneda/fecha y generador de tokens.
- **Hecho cuando:** Todos los tests en `src/domain/token.test.ts` y `src/domain/validation.test.ts` pasen en verde con Vitest.

---

### - [x] T3: Dominio — Máquina de estados y permisos por rol
- **RF cubiertos:** RF-04, RF-05, RF-07, RF-10, RF-22, RF-38; CA-02, CA-03, CA-05, CA-14
- **Archivos:** `src/domain/states.ts`, `src/domain/permissions.ts`, `src/domain/states.test.ts`, `src/domain/permissions.test.ts`
- **Descripción:** TDD: Pruebas unitarias para el flujo lineal (`recibido` → `diagnostico` → `reparacion` → `listo` → `entregado`), comprobando que `espera_aprobacion` no se pueda asignar manualmente. Verificar corrección únicamente al estado inmediatamente anterior con confirmación, prohibición de avanzar o corregir si existen cotizaciones pendientes, registro de actor (Taller Mecánico/Jefe, Cliente, Sistema) y restricciones de permisos (el rol Mecánico no puede dar de alta ni editar precios del catálogo). Implementar la lógica pura.
- **Hecho cuando:** Todos los tests de `states.test.ts` y `permissions.test.ts` pasen en verde.

---

### - [x] T4: Dominio — Cotizaciones, registro inmutable (ledger) y pausa/reanudación
- **RF cubiertos:** RF-06, RF-09, RF-11, RF-17, RF-18, RF-19, RF-20, RF-21, RF-31; CA-04, CA-06, CA-09, CA-10, CA-11, CA-18
- **Archivos:** `src/domain/quotes.ts`, `src/domain/ledger.ts`, `src/domain/quotes.test.ts`, `src/domain/ledger.test.ts`
- **Descripción:** TDD: Probar creación de cotización (borrador → enviada), entrada automática en pausa (`espera_aprobacion`) registrando `pausedFrom` sin sobrescribirlo, inmutabilidad tras envío, retiro de cotización por taller, resolución (aprobada/rechazada) por cliente, reanudación automática a `reparacion` si ≥1 aprobada o retorno a `pausedFrom` si todas son rechazadas o retiradas, y creación de entradas en el ledger de solo-agregar con descripción exacta (incluyendo nota). Rechazo de decisiones duplicadas. Implementar la lógica pura.
- **Hecho cuando:** Todos los tests de `quotes.test.ts` y `ledger.test.ts` pasen en verde.

---

### - [x] T5: Dominio — WhatsApp, URLs y Reducer principal de la aplicación
- **RF cubiertos:** RF-02, RF-23, RF-24; CA-12; Integración de dominio
- **Archivos:** `src/domain/whatsapp.ts`, `src/domain/app.ts`, `src/domain/whatsapp.test.ts`, `src/domain/app.test.ts`
- **Descripción:** TDD: Pruebas para generación de URLs de cliente con hash (`#/c/<token>`) y generación de URLs de WhatsApp (`https://wa.me/52...?text=...`) con texto codificado para cambios de estado y para nuevas cotizaciones (reparación + monto). Implementar `src/domain/app.ts` integrando todas las acciones en un reducer puro con errores tipados (`createVehicle`, `advanceState`, `correctState`, `sendQuote`, `withdrawQuote`, `decideQuote`, `updateCatalogPrice`).
- **Hecho cuando:** Todos los tests de `whatsapp.test.ts` y `app.test.ts` pasen en verde.

---

### - [x] T6: Persistencia y almacenamiento — Semilla determinista, localStorage y sincronización
- **RF cubiertos:** RF-26, RF-28, RF-29, RF-35, RF-36; CA-13, CA-15, CA-21, CA-22; RNF-08, RNF-09
- **Archivos:** `src/storage/schema.ts`, `src/storage/seed.ts`, `src/storage/repository.ts`, `src/storage/seed.test.ts`, `src/storage/repository.test.ts`
- **Descripción:** TDD: Crear semilla determinista con 6 vehículos en diversos estados (incluyendo 1 en `espera_aprobacion` con cotización pendiente y tokens fijos de 12 caracteres, más catálogo de repuestos). Implementar repositorio de `localStorage`: guardado, carga con validación de esquema, reinicio de demo, recuperación ante datos corruptos o de esquema incompatible (recargar semilla y generar notificación) y listener de eventos `storage` para sincronización multiventana.
- **Hecho cuando:** Todos los tests de `seed.test.ts` y `repository.test.ts` pasen en verde.

---

### - [x] T7: UI Base — Hash Router, Store Context, DemoBar, DemoBanner y componentes comunes
- **RF cubiertos:** RF-27, RF-28, RF-30, RF-34, RF-37; CA-23; RNF-02, RNF-03
- **Archivos:** `src/ui/router.ts`, `src/ui/store.tsx`, `src/ui/components/DemoBar.tsx`, `src/ui/components/DemoBanner.tsx`, `src/ui/components/ConfirmDialog.tsx`, `src/ui/components/StatusBadge.tsx`, `src/ui/components/NoticeBanner.tsx`, `src/ui/router.test.ts`
- **Descripción:** Crear enrutador hash simple sin dependencias (`useHashRoute`, `navigate`, `parseRoute`). Crear Context + Store de la aplicación con dispatch atómico y suscripción a `storage`. Implementar barra superior de demostración fija (selector de vista Taller/Cliente, rol Mecánico/Jefe, selector rápido de vehículo semilla y botón "Reiniciar demo" con diálogo de confirmación accesible), banner indicador de modo demo y componente accesible para diálogos.
- **Hecho cuando:** `router.test.ts` pase en verde y los componentes rendericen correctamente en el navegador y en tests.

---

### - [x] T8: UI Taller — Lista, avance rápido, ficha del vehículo y cotizaciones
- **RF cubiertos:** RF-01, RF-03, RF-04, RF-06, RF-07, RF-08, RF-25, RF-31, RF-32, RF-38, RF-39; CA-02, CA-04, CA-14, CA-17, CA-18, CA-19
- **Archivos:** `src/ui/taller/VehicleList.tsx`, `src/ui/taller/VehicleDetail.tsx`, `src/ui/taller/NewVehicleForm.tsx`, `src/ui/taller/QuoteDraftModal.tsx`, `src/ui/taller/CatalogEditor.tsx`, `src/ui/taller/taller.test.tsx`
- **Descripción:** Implementar vista Taller: lista de vehículos activos con botón rápido de avance e indicador de cotizaciones pendientes; filtro de entregados; formulario de alta accesible con validaciones visibles (solo Jefe); ficha de vehículo optimizada para móvil y manos sucias con botones ≥ 48px: botón principal de avance (1 toque), selección de catálogo para cotizaciones adicionales con borrador y envío (2 toques), opción de retirar cotización, botones para compartir por WhatsApp y copiar enlace (con aviso para vehículos no semilla RF-34), y visualización de historiales de estado y ledger de decisiones.
- **Hecho cuando:** Los tests de `taller.test.tsx` pasen en verde verificando flujo en ≤ 2 toques, alta de vehículo, cotizaciones y permisos de rol.

---

### - [x] T9: UI Cliente — Portal sin login, aprobación con registro inmutable y entrega
- **RF cubiertos:** RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-21, RF-40; CA-07, CA-08, CA-09, CA-19, CA-21
- **Archivos:** `src/ui/cliente/ClientView.tsx`, `src/ui/cliente/DecisionModal.tsx`, `src/ui/cliente/InvalidLink.tsx`, `src/ui/cliente/cliente.test.tsx`
- **Descripción:** Implementar portal web del cliente accesible por `#/c/:token`: pantalla de bienvenida clara que muestra estado del vehículo en < 5 segundos, línea de progreso e información del taller. Si hay cotización pendiente, destacarla en la parte superior con botones claros "Aprobar" y "Rechazar"; diálogo modal accesible para capturar nombre obligatorio (trim, 2–60 chars) con confirmación explícita de monto y descripción exacta. Prevención de decisiones duplicadas (relectura fresca del storage). Vista de solo lectura para vehículos entregados. Historial de decisiones inmutables visible para el cliente.
- **Hecho cuando:** Los tests de `cliente.test.tsx` pasen en verde verificando visualización inmediata de estado, aprobación/rechazo inmutable y manejo de enlaces no válidos.

---

### - [x] T10: Estilos mobile-first "manos sucias", accesibilidad (WCAG AA) y verificación final de build
- **RF cubiertos:** RF-08, RNF-01, RNF-02, RNF-03, RNF-04; CA-16; Verificación completa
- **Archivos:** `src/styles.css`, `index.html`, `README.md`
- **Descripción:** Ajustar estilos CSS globales y variables de diseño: contraste alto (WCAG AA), tipografía legible, botones táctiles con altura mínima de 48px y espaciado generoso para uso con una sola mano y dedos con grasa/guantes, estados de foco visibles. Ejecutar suite completa de tests de Vitest, validar que `npm run build` genera `dist/` limpio sin warnings de TypeScript, redactar README.md con instrucciones de prueba y enlace al formulario de entrega.
- **Hecho cuando:** La suite completa de Vitest pasa al 100%, el build estático compila exitosamente y la aplicación está lista para despliegue en Vercel.
