# 03 — Interfaz estática: Next.js + maquetación de Flex

> **Objetivo:** crear la estructura de carpetas del proyecto, instalar Next.js y maquetar todas las pantallas con datos estáticos (sin base de datos ni estado global todavía).

---

## Estructura del monorepo

```text
flex/                   ← raíz del monorepo
  apps/
    web/                ← aquí va Next.js
  docs/
  supabase/
  package.json
```

---

## 1. Crear `apps/web` con Next.js

Desde la raíz del proyecto:

```bash
mkdir apps
npx create-next-app@latest web --no-typescript --tailwind --app --src-dir --import-alias "@/*"
```

Opciones al asistente interactivo:

| Pregunta          | Respuesta |
| ----------------- | --------- |
| TypeScript        | No        |
| ESLint            | Sí        |
| Tailwind CSS      | Sí        |
| `src/` directory  | Sí        |
| App Router        | Sí        |
| Import alias      | `@/*`     |

```bash
cd apps/web
npm install lucide-react
```

Arrancamos:

```bash
npm run dev
```

---

## 2. Tailwind v4 y estilos globales

Con Tailwind v4 no hay `tailwind.config.js`. Todo va en CSS.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-gold-400: #D4A843;
  --color-gold-500: #C9A030;
  --color-gold-600: #A07820;
}

:root {
  --background: #0a0a0a;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  @apply antialiased;
}

::-webkit-scrollbar { @apply w-1; }
::-webkit-scrollbar-track { @apply bg-zinc-900; }
::-webkit-scrollbar-thumb { @apply bg-zinc-700 rounded-full; }
```

---

## 3. Layout raíz + Sidebar

El layout define la estructura compartida: sidebar fija izquierda + área principal scrollable.

```jsx
// src/app/layout.jsx
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = {
  title: 'Flex — Live Experience',
  description: 'Tu noche, tu ritmo',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
```

La Sidebar agrupa los enlaces en dos secciones: **Cliente** y **Gestión**.

```jsx
// src/components/Sidebar.jsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Crown, User, ShieldCheck, QrCode, LayoutDashboard } from 'lucide-react'

const NAV_CLIENTE = [
  { icon: ShoppingCart,    label: 'Pedir',       href: '/' },
  { icon: Crown,           label: 'Salas VIP',   href: '/vip' },
  { icon: User,            label: 'Mi área',     href: '/mi-area' },
]

const NAV_STAFF = [
  { icon: ShieldCheck,     label: 'Panel Staff', href: '/staff' },
  { icon: QrCode,          label: 'Porteros',    href: '/porteros' },
  { icon: LayoutDashboard, label: 'Admin',       href: '/admin' },
]
```

---

## 4. Páginas

### 4.1 Pedir a mesa — `/`

El cliente filtra por categoría (Bebida / Comida), añade productos y envía el pedido.

**Datos estáticos:** 12 productos hardcoded con `nombre`, `categoria`, `precio`, `emoji`.

**Estado local con `useState`:**

- `cat` — categoría activa
- `carrito` — array de `{ ...producto, cantidad }`
- `pedidoEnviado` — banner de confirmación temporal

La página usa un layout de dos columnas: grid de productos a la izquierda, carrito lateral a la derecha.

```jsx
// src/app/page.jsx  (fragmento)
'use client'
import { useState } from 'react'

const PRODUCTOS = [
  { id: 1, nombre: 'Cerveza Artesana', categoria: 'Bebida', precio: 4.5, emoji: '🍺' },
  // ...
]
```

---

### 4.2 Dashboard Admin — `/admin`

Gestión de usuarios y productos. Tabs para cambiar entre tablas. Botón "Nuevo" abre un modal con formulario.

**Funcionalidades estáticas:**

- Crear usuario (nombre, email, rol)
- Crear producto (nombre, categoría, precio)
- Eliminar fila de la tabla

```text
Roles disponibles: Cliente · Staff · Portero · Admin
Categorías disponibles: Bebida · Comida
```

---

### 4.3 Dashboard Staff — `/staff`

Vista de todos los pedidos del local. Cada pedido muestra mesa, cliente, hora, ítems y estado.

**Flujo:** botón "Completado" → cambia `estado` de `pendiente` a `completado` en el array local.

Filtros: `todos` / `pendiente` / `completado`.

---

### 4.4 Dashboard Porteros — `/porteros`

Panel de validación de QR en puerta.

**Interacción estática:** input manual de código → si empieza por `FLEX-` y tiene 9 chars → válido. Muestra resultado verde/rojo 4 segundos. Añade al historial.

```text
Formato código válido: FLEX-XXXX  (9 caracteres total)
```

---

### 4.5 Reserva VIP — `/vip`

Tres salas: **Roja** (150 €/h · 10 personas), **Negra** (200 €/h · 15 personas), **Dorada** (300 €/h · 20 personas).

**Flujo:** seleccionar sala → elegir fecha, hora de inicio, duración → ver precio total → confirmar reserva → pantalla de confirmación.

La sala Negra aparece como ocupada (deshabilitada).

---

### 4.6 Mi área — `/mi-area`

Área personal del cliente con tres pestañas:

| Tab | Contenido |
| --- | --------- |
| Entradas | QR placeholder + evento, fecha, tipo, código |
| Mis zonas | Zonas asignadas (pista, sala VIP) con descripción |
| Pedidos | Historial de pedidos con ítems, estado y total |

---

## 5. Estructura final de archivos

```text
apps/web/src/
  app/
    layout.jsx              ← sidebar + estructura global
    globals.css             ← Tailwind v4 + tema dorado
    page.jsx                ← pedir comida/bebida
    admin/
      page.jsx              ← dashboard admin
    staff/
      page.jsx              ← dashboard staff
    porteros/
      page.jsx              ← scanner QR porteros
    vip/
      page.jsx              ← reserva salas VIP
    mi-area/
      page.jsx              ← área personal cliente
  components/
    Sidebar.jsx
```

Todos los datos son arrays hardcoded en cada archivo. En el siguiente apunte añadiremos **Supabase** para persistir usuarios, productos y pedidos.

---

## Navegación

[← 02 — Seguridad con RLS](./02-seguridad-rls.md) · [Teoría previa: Estado en React →](./teoria/04-teoria.md)
