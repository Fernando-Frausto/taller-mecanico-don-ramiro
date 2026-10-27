# Constitución — Taller Mecánico "Don Ramiro"

Principios innegociables. Toda spec, plan, tarea e implementación debe cumplirlos.

1. **Mobile-first y "manos sucias"**: la vista del mecánico se diseña para celular; toda acción frecuente (cambiar estado, proponer reparación adicional) se completa en ≤ 2 toques, con objetivos táctiles ≥ 48 px y sin escritura obligatoria (opciones predefinidas / botones grandes).

2. **Cero fricción para el cliente**: el cliente accede con un enlace único por vehículo (compartible por WhatsApp/SMS), sin cuenta ni app, y entiende el estado de su coche en menos de 5 segundos.

3. **Trazabilidad inmutable de aprobaciones**: cada aprobación o rechazo de cotización registra nombre de quien decide, fecha/hora, monto, descripción exacta aceptada e identificador; el registro es de solo-agregar (no editable ni borrable) y visible para taller y cliente.

4. **Alcance acotado**: fuera inventario (ya está en Excel), facturación, pagos y autenticación real. Demo sin backend: persistencia en `localStorage` con datos semilla y botón "Reiniciar demo".

5. **TDD obligatorio**: la lógica de dominio vive en módulos TypeScript puros (sin UI) con tests en Vitest; primero tests en rojo, luego código. Ninguna tarea se cierra con tests en rojo.

6. **Simplicidad y despliegue**: React + Vite + TypeScript, build estático desplegable en Vercel; sin dependencias innecesarias; UI en español (es-MX) y accesible (contraste WCAG AA, etiquetas en controles).
