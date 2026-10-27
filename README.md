# Taller Mecánico "Don Ramiro" — Estado de Vehículos y Cotizaciones Adicionales

Sistema web mobile-first diseñado para resolver la fricción operativa y de comunicación en talleres mecánicos automotrices. Permite a los clientes consultar el estado de su vehículo en tiempo real y autorizar reparaciones complementarias sin llamadas telefónicas, garantizando un registro inmutable de decisiones y una interfaz optimizada para mecánicos con manos ocupadas o sucias.

---

## 📌 Problema Resuelto (Problema #2: Taller Mecánico)

Don Ramiro dirige un taller mecánico con cuatro mecánicos que trabajan exclusivamente con teléfonos celulares, habitualmente con las manos sucias o con guantes. La dinámica tradicional provocaba tres problemas críticos:

1. **Interrupciones constantes por llamadas:** Los clientes llamaban varias veces al día para consultar si su auto estaba listo, deteniendo el trabajo técnico.
2. **Vehículos varados por reparaciones adicionales:** Al detectar fallas adicionales durante el diagnóstico o reparación, el auto quedaba detenido horas o días esperando que el cliente contestara el teléfono para aprobar el presupuesto.
3. **Disputas de cobro por falta de evidencia:** En ocasiones los clientes negaban haber autorizado reparaciones extras acordadas por teléfono, provocando tensiones y pérdidas económicas.

### Solución Implementada
Una aplicación web estática (sin backend obligatorio) que proporciona:
- **Vista del Taller optimizada para celular:** Avance de estado y cotización de reparaciones predefinidas del catálogo en **≤ 2 toques**, con botones de al menos 48 px.
- **Portal del Cliente sin fricción:** Acceso directo mediante enlace único (`#/c/:token`), sin registro, cuentas ni instalación de aplicaciones; el estado del vehículo se comprende en **menos de 5 segundos**.
- **Registro Inmutable (Ledger de solo-agregar):** Cada aprobación, rechazo o retiro de cotización queda registrado con identificador, fecha/hora, actor, monto y descripción exacta mostrada al cliente.
- **Transiciones y pausas automáticas:** El sistema pausa automáticamente el vehículo al emitir una cotización adicional y lo reanuda a "En reparación" en cuanto el cliente la aprueba.

---

## 🏛️ Cumplimiento de los 6 Principios Constitucionales

| Principio | Requisito Constitucional | Implementación en el Proyecto |
|---|---|---|
| **1. Mobile-first y manos sucias** | Vista del mecánico para celular; acciones frecuentes en ≤ 2 toques; objetivos táctiles ≥ 48 px; sin escritura obligatoria. | Botón rápido "Avanzar" en lista y ficha (1 toque); catálogo de reparaciones con botones grandes (1 toque para abrir borrador, 1 toque para enviar = 2 toques sin teclear). Todos los botones cumplen con `min-height: 48px`. |
| **2. Cero fricción para el cliente** | Enlace único por vehículo; sin login ni app; estado comprensible en < 5 segundos. | Rutas `# /c/:token` con token aleatorio de 12 caracteres; estado destacado con icono, color y texto de alto contraste; línea de progreso de 5 fases; cotizaciones pendientes destacadas al inicio. |
| **3. Trazabilidad inmutable de aprobaciones** | Registro de solo-agregar con nombre de quien decide, fecha/hora, monto, descripción exacta e identificador; visible para taller y cliente. | Módulo de dominio `ledger.ts` y reducer puro; entradas congeladas e inalterables en la interfaz; visibles tanto en la ficha del taller como en el portal del cliente. |
| **4. Alcance acotado** | Fuera inventario, facturación, pagos y autenticación real; persistencia en `localStorage` con semilla determinista y botón "Reiniciar demo". | Datos iniciales deterministas con 6 vehículos en distintos estados (incluyendo cotización pendiente en pausa); botón "Reiniciar demo" accesible con diálogo de confirmación. |
| **5. TDD obligatorio** | Lógica de dominio pura sin dependencias de UI; pruebas antes de código; 100% de tests en verde. | Suite con **17 archivos de prueba y 240 tests unitarios y de integración** pasando limpiamente en Vitest con 0 fallos. |
| **6. Simplicidad y despliegue** | React + Vite + TypeScript; build estático para Vercel; español (es-MX) y moneda MXN; accesibilidad WCAG AA. | TypeScript en modo estricto, formato con `Intl.NumberFormat` y `Intl.DateTimeFormat` (es-MX), contraste visual de alto contraste y soporte de foco con teclado (`:focus-visible`). |

---

## 🧭 Guía para el Evaluador

La aplicación cuenta con una **Barra Superior de Demostración** fija (`DemoBar`) diseñada para facilitar la evaluación rápida de todos los roles y escenarios:

### 1. Barra de Demo Superior
- **Selector de Vista (`🔧 Taller` / `📱 Cliente`):** Permite alternar entre la consola del taller y el portal público del cliente sin recargar la página.
- **Selector de Rol del Taller (`Jefe Don Ramiro` / `Mecánico`):**
  - **Jefe:** Tiene acceso completo (Alta de nuevos vehículos, edición de precios del catálogo, borradores de cotización y avance de estados).
  - **Mecánico:** Interfaz simplificada y protegida: no se le muestran opciones de alta ni edición de tarifas (RF-38, CA-14).
- **Selector rápido "Saltar a vehículo":** Desplegable para navegar de inmediato a cualquier vehículo de la flota en vista taller o cliente.
- **Botón "Reiniciar demo":** Diálogo de confirmación accesible para restaurar los datos semilla deterministas en cualquier momento.

### 2. Flujo de Prueba Recomendado (Paso a Paso)

#### Paso A: Evaluar el vehículo en pausa esperando aprobación
1. En la barra superior, abre el selector "Saltar a vehículo" y selecciona:  
   **Volkswagen Jetta 2019 (JKL-012) — espera_aprobacion** (Token del cliente: `Rm7kQ2xVb9Ld`).
2. Observa la **ficha del taller**:
   - Muestra el cartel de **"Trabajo en pausa"** con la cotización pendiente: *Banda de distribución ($3,800.00 MXN)*.
   - Los botones de avance manual están deshabilitados mientras existan cotizaciones pendientes (RF-10, CA-05).
3. Cambia a la **Vista Cliente** (tocando el botón `📱 Cliente` en la barra superior o navegando a `#/c/Rm7kQ2xVb9Ld`):
   - La cotización pendiente aparece destacada en primer lugar con fondo amarillo de alta visibilidad (RF-15).
   - Toca el botón verde **"✓ Aprobar reparación"**.
   - Se abrirá el modal accesible: el nombre del propietario viene precargado ("Sofía Morales"). Puedes editarlo o confirmarlo.
   - Al confirmar, el sistema registra la decisión en el **Registro inmutable de cotizaciones** y reanuda el vehículo automáticamente al estado **"En reparación"** (RF-11, RF-18, CA-09).
4. Vuelve a la **Vista Taller**:
   - El vehículo ahora está en "En reparación" y en el historial se aprecia la transición automática por el actor `⚙️ Sistema`.

#### Paso B: Proponer reparación en ≤ 2 toques (Rol Mecánico)
1. En la lista de vehículos activos, selecciona el **Chevrolet Aveo 2018 (DEF-456)** (en estado "En diagnóstico").
2. Ve a la sección **"Proponer reparación adicional"**.
3. **Toque 1:** Toca cualquier botón del catálogo (por ejemplo, *Cambio de balatas delanteras — $1,200.00 MXN*).
4. **Toque 2:** En el modal de borrador, toca **"Enviar cotización al cliente"**.
5. El vehículo entra inmediatamente en estado **"Esperando aprobación"**, guardando su estado previo (`pausedFrom = diagnostico`).

#### Paso C: Probar WhatsApp y Copiar Enlace
1. En la ficha de cualquier vehículo, observa los botones de seguimiento:
   - **"💬 Compartir por WhatsApp":** Genera la URL codificada oficial `https://wa.me/52...?text=...` con el mensaje prellenado que incluye placas, estado y enlace único (RF-23, RF-24).
   - **"📋 Copiar enlace del cliente":** Copia la URL directa al portapapeles con confirmación visual. Si el vehículo no es semilla, advierte que solo funciona en el navegador actual (RF-34).

#### Paso D: Probar filtros y vehículos entregados
1. En la vista principal del taller, usa las pestañas **"Vehículos Activos"** y **"Entregados"**.
2. Los vehículos en estado "Entregado" se excluyen de la lista principal para evitar saturación visual y se consultan en su pestaña dedicada (RF-32).
3. Al abrir la vista cliente de un vehículo entregado (`Nissan March 2021 - PQR-789`, token `X7mK9pL2vN4q`), la página se muestra en modo de solo lectura con mensaje de agradecimiento e historial completo (RF-40, CA-19).

#### Paso E: Sincronización entre pestañas
1. Abre dos pestañas del navegador en la misma URL.
2. En una pestaña, aprueba o avanza un estado; la otra pestaña se actualizará automáticamente mediante el listener de almacenamiento (RF-35).
3. Si ambas pestañas intentan decidir la misma cotización, la segunda pestaña es rechazada mostrando la resolución previa (RF-17, RNF-09).

---

## 💻 Instrucciones de Ejecución Local

### Prerrequisitos
- Node.js versión 18 o superior.
- npm (incluido con Node.js).

### Instalación
```bash
# 1. Clonar el repositorio y situarse en la carpeta
cd taller-mecanico

# 2. Instalar dependencias
npm install
```

### Comandos disponibles
```bash
# Iniciar servidor de desarrollo local
npm run dev

# Ejecutar suite completa de pruebas unitarias y de integración (Vitest no interactivo)
npm test

# Compilar build estático de producción (TypeScript + Vite)
npm run build

# Previsualizar el build generado en dist/
npm run preview
```

---

## 🧪 Cobertura de Pruebas Automatizadas (TDD)

El proyecto cuenta con **240 pruebas automatizadas** que cubren el 100% de la lógica de negocio y los criterios de aceptación:

- `src/domain/states.test.ts`: Flujo lineal, transiciones válidas/inválidas, actores e inmutabilidad de estados.
- `src/domain/validation.test.ts`: Validación de altas, formato de teléfonos MX (`52...`), unicidad de placas y nombre de quien autoriza.
- `src/domain/token.test.ts`: Generación de tokens aleatorios alfanuméricos ≥ 10 caracteres.
- `src/domain/permissions.test.ts`: Restricciones de permisos por rol (Mecánico vs Jefe).
- `src/domain/quotes.test.ts`: Creación de borradores, envío, pausa automática, reanudación condicional y retiro de cotizaciones.
- `src/domain/ledger.test.ts`: Registro de solo-agregar, congelamiento de datos y formato de decisiones.
- `src/domain/whatsapp.test.ts`: Generación correcta de enlaces `wa.me` y codificación de URLs.
- `src/domain/app.test.ts`: Reducer principal de la aplicación, manejo de acciones y tipos de error.
- `src/storage/seed.test.ts`: Semilla determinista con 6 vehículos en estados representativos.
- `src/storage/repository.test.ts`: Persistencia en `localStorage`, sincronización entre pestañas y recuperación ante datos corruptos.
- `src/ui/router.test.ts`: Enrutamiento hash seguro (`#/taller`, `#/c/:token`, etc.).
- `src/ui/store.test.tsx`: Estado global, dispatch y suscripción a eventos de almacenamiento.
- `src/ui/components/components.test.tsx`: Diálogos accesibles, insignias de estado y barras de demo.
- `src/ui/taller/taller.test.tsx`: Flujo en ≤ 2 toques, alta de vehículo, edición de catálogo y filtros.
- `src/ui/cliente/cliente.test.tsx`: Portal del cliente, visualización inmediata, validación y confirmación de decisiones.

---

## 📬 Formulario de Entrega

- **Enlace de entrega:** [Formulario Oficial de Entrega](https://forms.gle/avwjqcDjXUJ32AE89)
