# 06 — Panel del Camarero con Realtime y Despliegue en Vercel

> **Proyecto Flex** · Stack: Next.js · Supabase · Zustand · Stripe  
> Nivel: Intermedio

---

## ¿Por qué Supabase Realtime?

Sin Realtime, el staff tendría que recargar la página para ver pedidos nuevos. Con Realtime, Supabase abre una conexión WebSocket y empuja los cambios de la base de datos directamente al navegador en cuanto ocurren.

```
Sin Realtime:
  Staff ──▶ Recarga página ──▶ SELECT pedidos ──▶ DB
  (manual, lento, propenso a errores)

Con Realtime:
  DB cambia ──▶ Supabase Realtime ──▶ WebSocket ──▶ Staff
  (automático, inmediato, sin recargar)
```

Supabase Realtime escucha cambios a nivel de tabla usando la **replicación lógica** de PostgreSQL. Solo hay que habilitarlo en las tablas que nos interesan.

---

## 1. Habilitar Realtime en Supabase

Antes de escribir código, la tabla tiene que estar incluida en la publicación de replicación. Se hace desde el Dashboard de Supabase:

1. Ve a **Editar tabla → Enable realtime**
2. Activa el toggle de la tabla `pedidos`

Sin este paso, el canal se suscribe pero nunca recibe eventos.

---

## 2. Carga inicial de datos

Cuando el componente del panel monta, se hace una consulta normal a Supabase para obtener los pedidos actuales. Esta consulta trae los pedidos con todas sus relaciones (mesa, items, productos).

El resultado se guarda en el estado del componente. A partir de aquí, el estado se mantiene actualizado solo mediante los eventos Realtime — ya no hace falta volver a consultar la base de datos.

---

## 3. Abrir el canal Realtime

Una vez cargados los pedidos iniciales, se abre un canal Supabase. Un canal es una sala de escucha con nombre único que mantiene una conexión WebSocket activa con el servidor.

Sobre ese canal se registran tres listeners, uno por tipo de evento:

### INSERT — llega un pedido nuevo

Cuando un cliente confirma un pedido, Supabase emite un evento `INSERT`. El payload solo contiene las columnas directas de la fila, sin relaciones (sin mesa, sin items). Por eso es necesario hacer una segunda consulta para obtener el pedido completo. Una vez obtenido, se añade al array de pedidos en el estado.

### UPDATE — cambia el estado de un pedido

Cuando el staff avanza el estado de un pedido (o lo hace otro compañero desde otro dispositivo), llega un evento `UPDATE`. En este caso el payload sí contiene el campo actualizado, así que no hace falta consultar nada: simplemente se actualiza el campo `estado` del pedido correspondiente en el array.

### DELETE — se elimina un pedido

Si un pedido se cancela o elimina desde administración, llega un evento `DELETE`. Se filtra el pedido del array por su `id`.

---

## 4. Actualización optimista al avanzar estado

Cuando el staff pulsa el botón para avanzar un pedido, no se espera a que llegue el evento Realtime para actualizar la pantalla. Se actualiza el estado local inmediatamente (optimistic update) y en paralelo se llama al servidor para persistir el cambio. Si la llamada al servidor falla, se revierte el estado local al valor anterior.

El evento `UPDATE` de Realtime llegará después y confirmará el cambio, o lo sincronizará en los dispositivos de otros miembros del staff.

---

## 5. Cerrar el canal al desmontar

Cuando el staff navega fuera del panel, el componente se desmonta. En ese momento hay que cerrar el canal Realtime explícitamente. Sin este paso, la conexión WebSocket quedaría abierta en memoria indefinidamente, consumiendo recursos y recibiendo eventos que nadie escucha.

## 6. Reto

Si un portero valida la reserva de un cliente, ¿cómo sabe otr portero que el ticket está validado? ¿Aquí también necesitamos realtime? Si es que sí, ¿cómo lo implementaríamos?