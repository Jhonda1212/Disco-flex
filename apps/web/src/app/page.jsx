'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, X } from 'lucide-react'

const PRODUCTOS = [
  { id: 1,  nombre: 'Cerveza Artesana',    categoria: 'Bebida', precio: 4.5,  emoji: '🍺' },
  { id: 2,  nombre: 'Gin Tonic Premium',   categoria: 'Bebida', precio: 9.0,  emoji: '🍹' },
  { id: 3,  nombre: 'Agua mineral',        categoria: 'Bebida', precio: 2.0,  emoji: '💧' },
  { id: 4,  nombre: 'Mojito',              categoria: 'Bebida', precio: 8.5,  emoji: '🍃' },
  { id: 5,  nombre: 'Coca-Cola',           categoria: 'Bebida', precio: 3.0,  emoji: '🥤' },
  { id: 6,  nombre: 'Vino tinto',          categoria: 'Bebida', precio: 5.5,  emoji: '🍷' },
  { id: 7,  nombre: 'Nachos con guacamole',categoria: 'Comida', precio: 7.0,  emoji: '🌮' },
  { id: 8,  nombre: 'Tabla de quesos',     categoria: 'Comida', precio: 12.0, emoji: '🧀' },
  { id: 9,  nombre: 'Alitas BBQ',          categoria: 'Comida', precio: 9.5,  emoji: '🍗' },
  { id: 10, nombre: 'Patatas bravas',      categoria: 'Comida', precio: 5.0,  emoji: '🥔' },
  { id: 11, nombre: 'Hamburguesa Flex',    categoria: 'Comida', precio: 11.0, emoji: '🍔' },
  { id: 12, nombre: 'Mini pizzas',         categoria: 'Comida', precio: 8.0,  emoji: '🍕' },
]

const CATEGORIAS = ['Todo', 'Bebida', 'Comida']

export default function PaginaPedir() {
  const [cat, setCat] = useState('Todo')
  const [carrito, setCarrito] = useState([])
  const [pedidoEnviado, setPedidoEnviado] = useState(false)

  const productosFiltrados = cat === 'Todo' ? PRODUCTOS : PRODUCTOS.filter(p => p.categoria === cat)

  function añadir(producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id)
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { ...producto, cantidad: 1 }]
    })
  }

  function quitar(id) {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id)
      if (item.cantidad === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i)
    })
  }

  function eliminar(id) {
    setCarrito(prev => prev.filter(i => i.id !== id))
  }

  const total = carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  const totalItems = carrito.reduce((sum, i) => sum + i.cantidad, 0)

  function enviarPedido() {
    setPedidoEnviado(true)
    setCarrito([])
    setTimeout(() => setPedidoEnviado(false), 3000)
  }

  return (
    <div className="flex h-full">
      {/* Productos */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">Pedir a mesa</h1>
          <p className="text-zinc-500 text-sm mt-1">Mesa 7 · Sala Principal</p>
        </div>

        <div className="flex gap-2 mb-6">
          {CATEGORIAS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                cat === c
                  ? 'bg-gold-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {productosFiltrados.map(p => {
            const enCarrito = carrito.find(i => i.id === p.id)
            return (
              <div key={p.id} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-3">
                <div className="h-24 bg-zinc-800 rounded-lg flex items-center justify-center text-4xl">
                  {p.emoji}
                </div>
                <div>
                  <p className="text-zinc-100 font-medium text-sm">{p.nombre}</p>
                  <p className="text-xs text-zinc-500">{p.categoria}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-gold-400 font-semibold">{p.precio.toFixed(2)} €</span>
                  {enCarrito ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => quitar(p.id)} className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600">
                        <Minus size={12} />
                      </button>
                      <span className="text-zinc-100 text-sm w-4 text-center">{enCarrito.cantidad}</span>
                      <button onClick={() => añadir(p)} className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center hover:bg-gold-600">
                        <Plus size={12} className="text-zinc-950" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => añadir(p)}
                      className="flex items-center gap-1 px-3 py-1 bg-gold-500 hover:bg-gold-600 text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Plus size={12} /> Añadir
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Carrito lateral */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center gap-2">
          <ShoppingCart size={18} className="text-gold-400" />
          <h2 className="font-semibold text-zinc-100">Mi pedido</h2>
          {totalItems > 0 && (
            <span className="ml-auto bg-gold-500 text-zinc-950 text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {pedidoEnviado && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">
              ¡Pedido enviado! Llega en 10–15 min.
            </div>
          )}
          {carrito.length === 0 && !pedidoEnviado ? (
            <p className="text-zinc-600 text-sm text-center mt-8">Tu pedido está vacío</p>
          ) : (
            <ul className="space-y-3">
              {carrito.map(item => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-100 truncate">{item.nombre}</p>
                    <p className="text-xs text-zinc-500">{item.cantidad} × {item.precio.toFixed(2)} €</p>
                  </div>
                  <span className="text-sm text-gold-400 font-medium shrink-0">{(item.precio * item.cantidad).toFixed(2)} €</span>
                  <button onClick={() => eliminar(item.id)} className="text-zinc-600 hover:text-zinc-400">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {carrito.length > 0 && (
          <div className="px-4 py-4 border-t border-zinc-800">
            <div className="flex justify-between text-sm mb-4">
              <span className="text-zinc-400">Total</span>
              <span className="text-zinc-100 font-bold text-lg">{total.toFixed(2)} €</span>
            </div>
            <button
              onClick={enviarPedido}
              className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold rounded-xl transition-colors"
            >
              Enviar pedido
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
