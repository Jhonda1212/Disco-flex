# 12 — Teoría: Estrategias de renderizado en Next.js

> Si entiendes cuándo y por qué se genera cada página, sabrás tomar las decisiones correctas para que Flex sea rápida.

---

## El problema: ¿cuándo se genera el HTML?

Cuando un usuario abre una página web, su navegador recibe HTML. La pregunta clave es: **¿cuándo se generó ese HTML?**

Hay tres momentos posibles:

```text
1. Al hacer el build (antes de que llegue ningún usuario)  → SSG / ISR
2. Cuando el usuario hace la petición                      → SSR
3. En el navegador del usuario                             → CSR
```

Cada estrategia tiene un coste diferente y un caso de uso distinto. Elegir mal significa páginas lentas, datos desactualizados, o servidores sobrecargados.

---

## CSR — Client-Side Rendering (lo que ya conoces)

El servidor envía un HTML casi vacío. El navegador descarga JavaScript, lo ejecuta, llama a la API, y por fin muestra los datos.

```text
Usuario ──▶ Servidor  →  HTML vacío + bundle.js
                ↓
           Navegador ejecuta JS
                ↓
           fetch('/api/datos')  →  Servidor  →  JSON
                ↓
           Navegador pinta la UI
```

**Ventajas:** simple, fácil de implementar, funciona en cualquier servidor estático.

**Problemas:**
- El usuario ve una pantalla en blanco o un spinner mientras carga.
- Google tarda más en indexar el contenido (SEO peor).
- Cada usuario hace sus propias peticiones aunque todos pidan lo mismo.

**En Flex:** el panel del staff funciona así. Tiene sentido: es privado, no necesita SEO, y los datos cambian en tiempo real por WebSocket. CSR es la elección correcta aquí.

---

## SSR — Server-Side Rendering

El HTML se genera en el servidor **cada vez que un usuario hace una petición**. El servidor consulta la base de datos, construye el HTML con los datos ya dentro, y lo envía completo al navegador.

```text
Usuario ──▶ Servidor
              ↓
         Consulta BD (en ese momento)
              ↓
         Genera HTML con datos
              ↓
Usuario ◀── HTML completo
```

**Ventajas:**
- El usuario ve contenido real desde el primer instante (sin spinner).
- SEO perfecto: los bots de Google reciben HTML con contenido.
- Los datos siempre son frescos: se consultan en el momento exacto.

**Problemas:**
- Cada petición cuesta tiempo de servidor y una consulta a BD.
- Si hay 1000 usuarios simultáneos pidiendo la misma página, hay 1000 consultas.
- El servidor tiene que estar siempre encendido (no vale un CDN estático).

**En Next.js:** se usa `async` en el componente de página y se hacen consultas directamente (en App Router, los Server Components son SSR por defecto).

```tsx
// app/carta/page.tsx — SSR
export default async function CartaPage() {
  const productos = await supabase.from('productos').select('*')
  return <ListaProductos productos={productos.data} />
}
```

---

## Concepto previo: CDN

Un **CDN (Content Delivery Network)** es una red de servidores repartidos por todo el mundo que almacenan copias de tu contenido estático.

```text
Sin CDN:
  Usuario en Madrid ──▶ Servidor en EE.UU. (~150ms)

Con CDN:
  Usuario en Madrid ──▶ Nodo CDN en Madrid (~5ms)
```

La idea clave: en lugar de que cada usuario viaje hasta tu servidor, el contenido ya está copiado en un nodo cercano a él. Esto solo es posible con contenido que no cambia entre usuarios — un archivo HTML estático, una imagen, un CSS. No puedes cachear en CDN una página que depende de quién está logueado.

Esto es importante porque SSG e ISR se apoyan directamente en esta idea.

---

## SSG — Static Site Generation

El HTML se genera **una sola vez, durante el build**. El resultado es un archivo HTML estático que se puede servir desde un CDN global.

```text
npm run build
    ↓
Servidor consulta BD (una sola vez)
    ↓
Genera archivos HTML estáticos
    ↓
Se suben a CDN

──────────────────────────────────

Usuario ──▶ CDN (archivo estático)
Usuario ◀── HTML (instantáneo, sin servidor)
```

**Ventajas:**
- Velocidad máxima: el CDN sirve el archivo desde el nodo más cercano al usuario.
- Sin coste de servidor por petición.
- Resistente a picos de tráfico: un CDN puede servir millones de peticiones simultáneas.

**Problemas:**
- Los datos se quedan congelados en el momento del build.
- Para actualizar contenido hay que volver a hacer un deploy completo.
- No vale para páginas con datos únicos por usuario.

**En Next.js:** cualquier página que no haga peticiones dinámicas se convierte en SSG automáticamente durante el build.

```tsx
// app/sobre-nosotros/page.tsx — SSG automático (sin fetching dinámico)
export default function SobreNosotros() {
  return <h1>Bienvenidos a Flex</h1>
}
```

---

## ISR — Incremental Static Regeneration

ISR es la solución al principal problema de SSG: los datos congelados.

Con ISR, la página se genera estáticamente **pero se regenera automáticamente** cada X segundos en el servidor. El usuario siempre recibe un archivo estático (rápido), pero ese archivo se actualiza periódicamente sin necesidad de un deploy.

```text
Primera petición:
  Usuario ──▶ CDN  →  HTML estático (t=0, datos frescos del build)

A los 60 segundos, alguien pide la página:
  CDN sirve el HTML antiguo (rápido) y en segundo plano...
  Servidor regenera el HTML con datos nuevos de BD

Siguiente petición:
  Usuario ──▶ CDN  →  HTML nuevo (t=60s)
```

La clave: el usuario **nunca espera** a que se regenere la página. Siempre recibe la versión cacheada disponible. La regeneración ocurre en segundo plano.

**Ventajas:**
- Velocidad de SSG + datos relativamente frescos.
- Sin deploy para actualizar contenido.
- Escalable como SSG.

**Limitaciones:**
- Los datos pueden tener hasta X segundos de retraso (según el revalidate configurado).
- No es adecuado para datos que deben ser exactos en tiempo real.

**En Next.js (App Router):**

```tsx
// app/carta/page.tsx — ISR, se regenera cada 60 segundos
export const revalidate = 60

export default async function CartaPage() {
  const productos = await supabase.from('productos').select('*')
  return <ListaProductos productos={productos.data} />
}
```

---

## Comparativa rápida

| Estrategia | ¿Cuándo se genera el HTML? | Velocidad | Datos frescos | SEO |
|------------|---------------------------|-----------|---------------|-----|
| CSR        | En el navegador del usuario | Lenta (spinner) | Sí | Malo |
| SSR        | En cada petición           | Media     | Sí (al instante) | Perfecto |
| SSG        | En el build                | Máxima    | No (congelados) | Perfecto |
| ISR        | En el build + cada X seg   | Máxima    | Casi (X seg de retraso) | Perfecto |

---

## Cómo aplicarlo en Flex

Flex tiene páginas con naturaleza muy diferente. Aquí tiene sentido usar cada estrategia:

### SSG — Páginas que nunca cambian
La página de inicio, la página "sobre nosotros", o cualquier landing estática. No hay datos dinámicos. Next.js las convierte en SSG automáticamente.

### ISR — La carta pública
La página `/carta` que ven los clientes antes de sentarse podría usar ISR con `revalidate = 60`. Los productos no cambian cada minuto, y si un camarero añade un producto nuevo, los clientes lo verán en menos de un minuto sin necesidad de deploy.

```tsx
// app/carta/page.tsx
export const revalidate = 60

export default async function CartaPage() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
  return <MenuPublico productos={productos} />
}
```

### SSR — Páginas con datos únicos por sesión
El resumen de un pedido específico (`/pedido/[id]`) necesita datos exactos y en tiempo real. SSR tiene sentido aquí: se consulta la BD en el momento exacto de la petición.

### CSR + Realtime — El panel del staff
Ya lo implementamos. Los datos cambian segundo a segundo y la pantalla es privada. CSR con suscripción Realtime es la mejor opción.

---

## El flujo de decisión

Cuando crees una página nueva en Flex, hazte estas preguntas en orden:

```
¿Los datos son iguales para todos los usuarios?
    ├── No  →  SSR o CSR (depende de si necesita SEO)
    └── Sí
         ↓
¿Los datos cambian con frecuencia?
    ├── No  →  SSG (build estático)
    └── Sí
         ↓
¿Cuánta latencia es aceptable?
    ├── Minutos/horas  →  ISR (revalidate alto)
    ├── Segundos       →  ISR (revalidate bajo) o SSR
    └── Tiempo real    →  CSR + WebSocket / Realtime
```

---

## Las 4 estrategias en código

El mismo objetivo en los cuatro casos: mostrar una lista de productos. Solo cambia **cuándo y dónde** se obtienen los datos.

---

### CSR — Los datos se cargan en el navegador

```tsx
// app/carta/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function CartaPage() {
  const [productos, setProductos] = useState([])

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => setProductos(data))
  }, [])

  return (
    <ul>
      {productos.map(p => <li key={p.id}>{p.nombre}</li>)}
    </ul>
  )
}
```

El servidor envía esta página **vacía**. El navegador ejecuta el `useEffect`, llama a la API, y entonces pinta los productos. El usuario ve un momento en blanco.

---

### SSR — Los datos se obtienen en cada petición

```tsx
// app/carta/page.tsx
async function getProductos() {
  const res = await fetch('https://mi-api.com/productos', { cache: 'no-store' })
  return res.json()
}

export default async function CartaPage() {
  const productos = await getProductos()

  return (
    <ul>
      {productos.map(p => <li key={p.id}>{p.nombre}</li>)}
    </ul>
  )
}
```

`cache: 'no-store'` le dice a Next.js que no cachee nada: cada vez que alguien pida esta página, se consulta la API en ese momento y se genera el HTML con los datos de ese instante.

---

### SSG — Los datos se obtienen una sola vez en el build

```tsx
// app/carta/page.tsx
async function getProductos() {
  const res = await fetch('https://mi-api.com/productos')
  return res.json()
}

export default async function CartaPage() {
  const productos = await getProductos()

  return (
    <ul>
      {productos.map(p => <li key={p.id}>{p.nombre}</li>)}
    </ul>
  )
}
```

El código es casi idéntico al SSR. La diferencia es que **no hay `cache: 'no-store'`**: Next.js cachea el resultado por defecto y genera un HTML estático durante el build. Ese archivo se sube al CDN y todos los usuarios reciben exactamente el mismo.

**¿Y en ssg, si hay algun cambio en los productos de la base de datos? qué pasa?**

- Si añades un producto nuevo a la base de datos, los usuarios seguirán viendo el HTML antiguo que se generó en el build. No importa cuántas veces recarguen — están recibiendo un archivo estático del CDN, el servidor ni se entera de la petición.

Para que los cambios aparezcan, tienes dos opciones:

- Hacer un nuevo deploy — Next.js vuelve a ejecutar el build, consulta la BD, y genera un HTML nuevo. Simple pero manual.
- Cambiar a ISR — misma velocidad, pero la página se regenera automáticamente cada X segundos. Es exactamente para esto para lo que existe ISR.

---

### ISR — Como SSG, pero se regenera cada X segundos

```tsx
// app/carta/page.tsx
export const revalidate = 60 // regenerar cada 60 segundos

async function getProductos() {
  const res = await fetch('https://mi-api.com/productos')
  return res.json()
}

export default async function CartaPage() {
  const productos = await getProductos()

  return (
    <ul>
      {productos.map(p => <li key={p.id}>{p.nombre}</li>)}
    </ul>
  )
}
```

Una sola línea de diferencia respecto a SSG: `export const revalidate = 60`. Con eso, Next.js regenera la página en segundo plano cada 60 segundos. Los usuarios siempre reciben un HTML estático (rápido), pero los datos se van actualizando solos sin necesidad de deploy.

---

### Resumen visual

```text
CSR  →  'use client' + useEffect + fetch en el navegador
SSR  →  async component + fetch(..., { cache: 'no-store' })
SSG  →  async component + fetch(...)                        ← igual que SSR pero sin no-store
ISR  →  export const revalidate = 60 + async component + fetch(...)
```
