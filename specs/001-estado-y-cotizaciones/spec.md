# Spec 001 — Estado del vehículo y cotizaciones adicionales

- **Proyecto:** Taller Mecánico "Don Ramiro"
- **Estado:** Revisión 2 (cambios aprobados tras QA)
- **Fecha:** 2026-10-26
- **Constitución aplicable:** `docs/constitution.md` (principios 1–6)

## 1. Problema (POR QUÉ)

Don Ramiro tiene un taller con cuatro mecánicos que solo usan el celular, casi siempre con las manos sucias. Hoy:

1. Los clientes **llaman varias veces al día** para saber si su coche está listo; cada llamada interrumpe el trabajo.
2. Cuando aparece una **reparación adicional**, el trabajo se detiene hasta que el cliente aprueba el costo por teléfono, lo que **puede tardar días**.
3. A veces el cliente **niega haber aprobado** una reparación, y no hay evidencia.

**Objetivo:** que el cliente conozca el estado de su coche sin llamar y pueda aprobar/rechazar cotizaciones rápido, dejando un registro inmutable; todo como **demo web pública sin backend**.

### Métricas de éxito (de la demo)
- El cliente identifica el estado actual de su coche en < 5 s al abrir su enlace.
- El mecánico avanza el estado o propone una reparación adicional en ≤ 2 toques desde la ficha del vehículo.
- Toda decisión o retiro de cotización queda registrado con quién, cuándo, monto, descripción exacta e identificador, y no puede alterarse desde la interfaz.

## 2. Actores

| Actor | Descripción |
|---|---|
| **Taller — rol Jefe** (Don Ramiro) | Da de alta vehículos, fija/edita precios (catálogo y borradores de cotización), comparte enlaces; además puede hacer todo lo del rol Mecánico. |
| **Taller — rol Mecánico** | Usa solo celular; actualiza estado, propone y envía reparaciones adicionales del catálogo, retira cotizaciones pendientes. |
| **Cliente** | Dueño del vehículo; accede por enlace único, sin cuenta ni app; aprueba o rechaza cotizaciones. |
| **Sistema** | Ejecuta las transiciones automáticas (pausa y reanudación). |
| **Evaluador** | Persona que revisa la demo pública; necesita datos semilla y navegación entre vistas/roles. |

## 3. Supuestos documentados

- **S-01** Flujo manual lineal: `Recibido → En diagnóstico → En reparación → Listo para entregar → Entregado`. "Esperando aprobación" es un **estado de pausa** que solo asigna el Sistema; el taller nunca lo elige manualmente.
- **S-02** Solo el rol Jefe da de alta vehículos; el cliente nunca crea registros.
- **S-03** Las reparaciones adicionales se eligen de un **catálogo predefinido** (descripción + precio sugerido). La cotización nace como borrador (precio precargado, editable solo por el Jefe, más nota opcional) y se vuelve inmutable al enviarse.
- **S-04** Mientras exista al menos una cotización pendiente, el vehículo está en "Esperando aprobación" (trabajo pausado).
- **S-05** No hay autenticación real: en el modo demo se elige la vista (Taller / Cliente) y, en Taller, el rol (Mecánico / Jefe). El acceso del cliente se basa en la posesión del enlace único.
- **S-06** No hay envío real de mensajes: la notificación consiste en generar un enlace `wa.me` con texto prellenado que el usuario abre manualmente.
- **S-07** Los datos viven solo en el navegador del usuario; cada visitante de la demo ve su propia copia. Los vehículos semilla tienen enlaces fijos que funcionan en cualquier navegador; los vehículos creados durante la demo solo existen en el navegador donde se crearon (limitación aceptada de la demo).
- **S-08** Moneda: pesos mexicanos (MXN); idioma y formato de fecha/hora: es-MX. Teléfonos: 10 dígitos de México; se almacenan con prefijo de país `52` para su uso en `wa.me`.
- **S-09** El nombre de quien decide una cotización lo captura el cliente al aprobar/rechazar (prellenado con el nombre del dueño registrado, editable, obligatorio).
- **S-10** El "estado previo" a la pausa se guarda únicamente al entrar en pausa (primera cotización pendiente) y no se sobrescribe por cotizaciones enviadas después durante la misma pausa.

## 4. Requisitos funcionales (EARS)

### 4.1 Alta y enlace único del vehículo
- **RF-01 (Where)** Donde el usuario del taller actúa con rol Jefe, el sistema deberá permitir dar de alta un vehículo con los campos obligatorios: nombre del cliente, teléfono del cliente (10 dígitos MX), vehículo (marca/modelo/año o texto libre) y placas; y opcionalmente el motivo de ingreso.
- **RF-02 (When)** Cuando se da de alta un vehículo, el sistema deberá asignarle el estado "Recibido", almacenar el teléfono con prefijo `52` y generar un enlace único con un token aleatorio de al menos 10 caracteres alfanuméricos.
- **RF-03 (Ubiquitous)** El sistema deberá mostrar en la vista Taller la lista de vehículos no entregados con su estado actual, un indicador visible de cotizaciones pendientes y un botón rápido "Avanzar" al siguiente estado manual permitido.
- **RF-33 (If-Then)** Si las placas capturadas coinciden con las de otro vehículo no entregado, entonces el sistema deberá impedir el alta e indicar el conflicto.
- **RF-38 (If-Then)** Si el usuario del taller actúa con rol Mecánico, entonces el sistema no deberá ofrecerle dar de alta vehículos ni editar precios.
- **RF-39 (If-Then)** Si algún campo del alta falta o es inválido (p. ej., teléfono distinto de 10 dígitos), entonces el sistema deberá impedir el alta y mostrar un mensaje de error junto a cada campo afectado.

### 4.2 Vista Taller: estados (≤ 2 toques)
- **RF-04 (When)** Cuando el usuario del taller, desde la ficha del vehículo, toca el botón del siguiente estado manual, el sistema deberá avanzar el vehículo a ese estado según el flujo lineal de S-01 (≤ 2 toques desde la ficha). "Esperando aprobación" nunca deberá ofrecerse como opción manual.
- **RF-05 (If-Then)** Si el usuario del taller intenta saltar estados o retroceder, entonces el sistema deberá impedirlo, salvo la corrección explícita al estado inmediatamente anterior del flujo lineal, previa confirmación.
- **RF-08 (Ubiquitous)** Todos los controles de acción de la vista Taller deberán ser objetivos táctiles de al menos 48 px y operables en pantallas de celular (≥ 360 px de ancho).
- **RF-32 (Ubiquitous)** El sistema deberá excluir de la lista principal los vehículos en "Entregado" y ofrecer un filtro "Entregados" para consultarlos.

### 4.3 Vista Taller: cotizaciones adicionales
- **RF-06 (When)** Cuando el usuario del taller toca "Proponer reparación" en un vehículo que está en "En diagnóstico", "En reparación" o "Esperando aprobación", el sistema deberá abrir un borrador al elegir una opción del catálogo, con descripción y precio precargados y una nota opcional, y crear la cotización pendiente al tocar "Enviar" (elegir + enviar = 2 toques desde la ficha, sin escritura obligatoria).
- **RF-07 (Where)** Donde el usuario del taller actúa con rol Jefe, el sistema deberá permitir editar el precio de una cotización mientras sea borrador, y editar los precios sugeridos del catálogo.
- **RF-20 (Ubiquitous)** Una cotización enviada deberá ser inmutable (monto, descripción y nota); cualquier corrección requerirá retirarla y enviar una nueva.
- **RF-31 (When)** Cuando el usuario del taller retira una cotización pendiente y confirma, el sistema deberá marcarla como "Retirada por taller" y agregar al registro una entrada con fecha/hora y rol (Mecánico/Jefe) de quien la retiró.

### 4.4 Pausa y reanudación automáticas
- **RF-09 (When)** Cuando se envía una cotización y el vehículo no tiene otras pendientes, el sistema (actor Sistema) deberá cambiar el vehículo a "Esperando aprobación" y guardar el estado previo; las cotizaciones enviadas después durante la misma pausa no deberán sobrescribir ese estado previo.
- **RF-10 (While)** Mientras un vehículo tenga al menos una cotización pendiente, el sistema deberá impedir cualquier cambio manual de estado, incluida la corrección al estado anterior.
- **RF-11 (When)** Cuando se resuelve (aprobada, rechazada o retirada) la última cotización pendiente de un vehículo, el sistema (actor Sistema) deberá reanudarlo a "En reparación" si al menos una cotización de esa pausa fue aprobada, o devolverlo al estado previo guardado si todas fueron rechazadas o retiradas.

### 4.5 Vista del cliente
- **RF-12 (When)** Cuando un cliente abre el enlace único de su vehículo, el sistema deberá mostrar sin pedir cuenta ni instalación: vehículo, estado actual destacado, línea de progreso de estados y hora de la última actualización.
- **RF-13 (If-Then)** Si el enlace no corresponde a ningún vehículo, entonces el sistema deberá mostrar un mensaje claro de "enlace no válido" sin exponer datos de otros vehículos.
- **RF-14 (Ubiquitous)** El sistema deberá mostrar al cliente únicamente la información de su propio vehículo.
- **RF-15 (While)** Mientras exista una cotización pendiente, el sistema deberá mostrarla en primer lugar en la vista del cliente con descripción, nota, monto y botones "Aprobar" y "Rechazar".
- **RF-16 (When)** Cuando el cliente toca "Aprobar" o "Rechazar", el sistema deberá pedir confirmación mostrando descripción exacta (incluida la nota) y monto, y solicitar el nombre de quien decide (prellenado con el nombre del dueño), que deberá ser obligatorio y tener entre 2 y 60 caracteres tras recortar espacios.
- **RF-17 (If-Then)** Si al confirmar, tras releer los datos almacenados, la cotización ya está resuelta (decidida o retirada, p. ej., desde otra pestaña), entonces el sistema deberá rechazar la acción y mostrar el resultado existente.
- **RF-40 (While)** Mientras el vehículo esté en "Entregado", el sistema deberá seguir mostrando su enlace del cliente en modo de solo lectura (estado e historiales, sin acciones).

### 4.6 Registro inmutable e historiales
- **RF-18 (When)** Cuando se confirma una decisión, el sistema deberá agregar al registro una entrada con: identificador único, identificador del vehículo y de la cotización, resultado (aprobada/rechazada), nombre de quien decide, fecha y hora, monto y descripción exacta mostrada al cliente (descripción del catálogo + nota).
- **RF-19 (Ubiquitous)** El registro de decisiones deberá ser de solo-agregar: ninguna funcionalidad permitirá editar ni borrar entradas existentes (salvo la excepción de "Reiniciar demo", ver RNF-08).
- **RF-21 (Ubiquitous)** El sistema deberá mostrar el registro de cotizaciones del vehículo (aprobadas, rechazadas y retiradas) tanto en la vista Taller como en la vista Cliente.
- **RF-22 (Ubiquitous)** El sistema deberá mantener un historial cronológico de cambios de estado del vehículo con estado, fecha/hora y actor ∈ {Taller (rol Mecánico o Jefe), Cliente, Sistema}; las transiciones automáticas se registrarán con actor Sistema.

### 4.7 Compartir por WhatsApp
- **RF-23 (When)** Cuando el taller toca "Compartir por WhatsApp" en un vehículo, el sistema deberá abrir un enlace `wa.me` al teléfono del cliente (con prefijo `52`) con un texto prellenado en español que incluye el estado actual y el enlace único.
- **RF-24 (When)** Cuando se envía una cotización, el sistema deberá ofrecer en la vista Taller un botón para notificar por WhatsApp con texto prellenado que menciona la reparación, el monto y el enlace para aprobar.
- **RF-25 (Ubiquitous)** El sistema deberá mostrar siempre un botón "Copiar enlace" junto a cada botón de WhatsApp, que copie el enlace único al portapapeles.
- **RF-34 (When)** Cuando el taller comparte o copia el enlace de un vehículo creado durante la demo (no semilla), el sistema deberá advertir que ese enlace solo funciona en el navegador actual.

### 4.8 Modo demo, persistencia y navegación
- **RF-26 (When)** Cuando la demo se abre por primera vez en un navegador o tras reiniciarla, el sistema deberá cargar datos semilla con al menos 5 vehículos en distintos estados (incluyendo al menos uno con cotización pendiente y uno con decisiones ya registradas), cuyos tokens de enlace son fijos y deterministas para que funcionen en cualquier navegador.
- **RF-27 (Ubiquitous)** El sistema deberá ofrecer un control visible para cambiar entre vista Taller y vista Cliente; en vista Taller, elegir el rol Mecánico o Jefe; y en vista Cliente, elegir qué vehículo simular.
- **RF-28 (When)** Cuando el evaluador toca "Reiniciar demo" y confirma, el sistema deberá borrar los datos locales y restaurar los datos semilla.
- **RF-29 (Ubiquitous)** El sistema deberá persistir los cambios en el navegador de modo que sobrevivan a recargar la página.
- **RF-30 (Ubiquitous)** El sistema deberá indicar de forma visible que es una demo (datos ficticios, sin envíos reales).
- **RF-35 (When)** Cuando los datos almacenados cambian en otra pestaña del mismo navegador, el sistema deberá actualizar la vista abierta para reflejarlos.
- **RF-36 (If-Then)** Si los datos almacenados están corruptos o corresponden a una versión de esquema distinta, entonces el sistema deberá recargar los datos semilla y avisar al usuario.
- **RF-37 (Ubiquitous)** Las rutas de la aplicación deberán basarse en hash (`#/...`) para que los enlaces directos (incluido el enlace del cliente) funcionen en un hosting estático.

## 5. Requisitos no funcionales

- **RNF-01 Usabilidad móvil:** vista Taller diseñada mobile-first; avanzar estado y proponer reparación en ≤ 2 toques desde la ficha (además, botón rápido "Avanzar" en la lista); objetivos táctiles ≥ 48 px; sin escritura obligatoria para el mecánico.
- **RNF-02 Comprensión rápida:** el cliente identifica el estado en < 5 s (estado en texto grande + color + icono, no solo color).
- **RNF-03 Accesibilidad:** contraste WCAG AA; todos los controles con etiqueta accesible; operable con teclado.
- **RNF-04 Idioma/formato:** UI en español (es-MX), fechas/horas y moneda MXN en formato local.
- **RNF-05 Rendimiento:** carga inicial usable en < 3 s en conexión 4G típica.
- **RNF-06 Sin backend:** funciona como sitio estático público; sin servidores ni servicios de terceros obligatorios.
- **RNF-07 Calidad:** la lógica de dominio (transiciones de estado, pausa/reanudación, borrador/envío/retiro de cotizaciones, validaciones y registro) debe estar cubierta por pruebas automatizadas.
- **RNF-08 Integridad en demo:** las entradas del registro y las cotizaciones enviadas no pueden modificarse desde la interfaz; sin backend, la inmutabilidad es a nivel de aplicación (no criptográfica). **"Reiniciar demo" es una excepción explícita** a la inmutabilidad, permitida solo por tratarse de una demo.
- **RNF-09 Consistencia entre pestañas:** ninguna cotización puede quedar con dos decisiones aunque se abra en varias pestañas del mismo navegador.

## 6. Fuera de alcance y limitaciones

**Fuera de alcance**
- Control de inventario (se mantiene en Excel).
- Facturación, pagos y cobros.
- Autenticación real, cuentas de usuario y gestión de permisos (los roles son solo un selector de demo).
- Envío real de WhatsApp/SMS/correo y notificaciones push.
- Sincronización entre dispositivos o backend/base de datos remota.
- Fotos/adjuntos, agenda de citas, reportes y múltiples talleres.

**Limitaciones conocidas de la demo**
- Los vehículos creados durante la demo solo existen en el navegador donde se crearon; su enlace no funciona en otro dispositivo (la app lo advierte, RF-34).
- La inmutabilidad del registro es a nivel de aplicación y "Reiniciar demo" la omite (RNF-08).

## 7. Criterios de aceptación

- **CA-01 (RF-01, RF-02)** Dado el rol Jefe, cuando da de alta un vehículo con datos válidos, entonces aparece en la lista en estado "Recibido", con teléfono almacenado con prefijo `52` y un enlace único con token aleatorio de ≥ 10 caracteres alfanuméricos distinto al de los demás.
- **CA-02 (RF-03, RF-04, RF-08)** Dado un vehículo en "En diagnóstico" sin cotizaciones pendientes, cuando el usuario del taller abre la ficha y toca el botón de siguiente estado, entonces pasa a "En reparación" en ≤ 2 toques; y el botón "Avanzar" de la lista logra lo mismo. Los botones miden ≥ 48 px.
- **CA-03 (RF-04, RF-05)** Dado un vehículo en "Recibido", entonces no se ofrece pasar directamente a "Listo para entregar" ni, en ningún estado, elegir manualmente "Esperando aprobación".
- **CA-04 (RF-06, RF-09)** Dado un vehículo en "En diagnóstico", cuando el mecánico toca "Proponer reparación", elige una opción del catálogo y toca "Enviar", entonces se crea una cotización pendiente y el vehículo pasa a "Esperando aprobación" (actor Sistema) sin escribir texto. Dado un vehículo en "Recibido", "Listo para entregar" o "Entregado", la opción no está disponible.
- **CA-05 (RF-10)** Dado un vehículo con cotización pendiente, entonces no es posible avanzarlo ni corregir su estado manualmente.
- **CA-06 (RF-09, RF-11)** Dado un vehículo pausado desde "En diagnóstico" con dos cotizaciones enviadas, cuando una se aprueba y la otra se rechaza, entonces pasa a "En reparación"; si ambas se rechazan o retiran, vuelve a "En diagnóstico" (estado previo no sobrescrito por la segunda cotización).
- **CA-07 (RF-12, RF-14)** Dado el enlace único de un vehículo, cuando se abre en vista Cliente, entonces se ven el estado actual destacado, la línea de progreso y la última actualización, y ningún dato de otros vehículos.
- **CA-08 (RF-13)** Dado un enlace con token inexistente, cuando se abre, entonces se muestra "enlace no válido".
- **CA-09 (RF-15, RF-16, RF-18)** Dada una cotización pendiente, cuando el cliente toca "Aprobar", captura un nombre válido y confirma, entonces se agrega al registro una entrada con id, resultado, nombre, fecha/hora, monto y descripción exacta (incluida la nota).
- **CA-10 (RF-17, RF-19, RF-20)** Dada una cotización enviada o decidida, entonces no existe forma en la interfaz de editar su monto/descripción/nota, volver a decidirla ni borrar su entrada del registro.
- **CA-11 (RF-21, RF-22)** Dada una decisión o retiro registrado, entonces es visible con los mismos datos en vista Taller y vista Cliente, y el historial de estados muestra el actor correcto (Taller con rol, Cliente o Sistema).
- **CA-12 (RF-23, RF-24, RF-25)** Dado un vehículo, cuando se toca "Compartir por WhatsApp", entonces se abre `https://wa.me/52XXXXXXXXXX?text=...` con estado y enlace único (y, si aplica, reparación y monto); y junto a él siempre hay un botón "Copiar enlace" funcional.
- **CA-13 (RF-26)** Dado un navegador sin datos previos, cuando se abre la demo, entonces se ven ≥ 5 vehículos en distintos estados (uno con cotización pendiente y uno con historial de decisiones), y el enlace de un vehículo semilla abierto en otro navegador muestra ese mismo vehículo.
- **CA-14 (RF-27, RF-38)** Dado el modo demo, cuando se usan los selectores, entonces se alterna entre Taller y Cliente y entre roles Mecánico y Jefe sin recargar; con rol Mecánico no aparecen "Alta de vehículo" ni la edición de precios.
- **CA-15 (RF-28, RF-29)** Dados cambios hechos en la demo, cuando se recarga la página, entonces persisten; cuando se toca "Reiniciar demo" y se confirma, entonces se restauran los datos semilla.
- **CA-16 (RNF-03, RNF-04)** La UI está en español es-MX con montos en MXN, y Lighthouse reporta Accesibilidad ≥ 90 en las vistas Taller y Cliente.
- **CA-17 (RF-33, RF-39)** Dado el formulario de alta, cuando falta un campo obligatorio, el teléfono no tiene 10 dígitos o las placas coinciden con un vehículo no entregado, entonces no se crea el vehículo y se muestra el error junto al campo.
- **CA-18 (RF-31, RF-11)** Dada una única cotización pendiente, cuando el taller la retira y confirma, entonces aparece en el registro como "Retirada por taller" con fecha/hora y rol, y el vehículo vuelve a su estado previo.
- **CA-19 (RF-32, RF-40)** Dado un vehículo que pasa a "Entregado", entonces desaparece de la lista principal, aparece en el filtro "Entregados" y su enlace del cliente sigue abriendo en solo lectura.
- **CA-20 (RF-16)** Dado el diálogo de decisión, cuando el nombre queda vacío, tiene solo espacios, < 2 o > 60 caracteres tras recortar, entonces no se puede confirmar.
- **CA-21 (RF-17, RF-35, RNF-09)** Dada la misma cotización abierta en dos pestañas, cuando se aprueba en una, entonces la otra se actualiza sola, y un intento de decidir en la segunda es rechazado mostrando la decisión existente.
- **CA-22 (RF-36)** Dado un almacenamiento con datos corruptos o versión de esquema distinta, cuando se abre la demo, entonces se cargan los datos semilla y se muestra un aviso.
- **CA-23 (RF-34, RF-37)** Dado un enlace directo `#/...` a un vehículo, cuando se abre en una pestaña nueva del sitio estático, entonces carga la vista correcta; al compartir un vehículo creado en la demo, se muestra la advertencia de que solo funciona en este navegador.
