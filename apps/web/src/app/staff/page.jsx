'use client'

import { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'

const PEDIDOS_INIT = [
  {
    id: 1, mesa: 'Mesa 3', cliente: 'María López', hora: '23:14',
    estado: 'pendiente',
    items: [{ nombre: 'Gin Tonic Premium', cantidad: 2 }, { nombre: 'Nachos', cantidad: 1 }],
  },
  {
    id: 2, mesa: 'Mesa 7', cliente: 'Alex García', hora: '23:21',
    estado: 'pendiente',
    items: [{ nombre: 'Cerveza Artesana', cantidad: 3 }, { nombre: 'Patatas bravas', cantidad: 2 }],
  },
  {
    id: 3, mesa: 'Sala Roja', cliente: 'Carlos Ruiz', hora: '23:05',
    estado: 'completado',
    items: [{ nombre: 'Vino tinto', cantidad: 1 }, { nombre: 'Tabla de quesos', cantidad: 1 }],
  },
  {
    id: 4, mesa: 'Mesa 1', cliente: 'Laura Sanz', hora: '23:30',
    estado: 'pendiente',
    items: [{ nombre: 'Mojito', cantidad: 4 }],
  },
  {
    id: 5, mesa: 'Mesa 12', cliente: 'Pedro Gil', hora: '22:58',
    estado: 'completado',
    items: [{ nombre: 'Hamburguesa Flex', cantidad: 2 }, { nombre: 'Coca-Cola', cantidad: 2 }],
  },
]

export default function PaginaStaff() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INIT)
  const [filtro, setFiltro] = useState('todos')

  function completar(id) {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: 'completado' } : p))
  }

  const pedidosFiltrados = filtro === 'todos' ? pedidos
    : pedidos.filter(p => p.estado === filtro)

  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Panel de Staff</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión de pedidos en tiempo real</p>
        </div>
        {pendientes > 0 && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm px-4 py-2 rounded-xl">
            {pendientes} pedido{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total pedidos</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{pedidos.length}</p>
        </div>
        <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Pendientes</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pedidos.filter(p => p.estado === 'pendiente').length}</p>
        </div>
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Completados</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{pedidos.filter(p => p.estado === 'completado').length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {['todos', 'pendiente', 'completado'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filtro === f ? 'bg-gold-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista pedidos */}
      <div className="space-y-3">
        {pedidosFiltrados.map(pedido => (
          <div
            key={pedido.id}
            className={`bg-zinc-900 border rounded-xl p-5 flex items-center gap-6 ${
              pedido.estado === 'pendiente' ? 'border-amber-500/30' : 'border-zinc-800'
            }`}
          >
            {/* Estado icono */}
            <div className={`shrink-0 ${pedido.estado === 'pendiente' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {pedido.estado === 'pendiente'
                ? <Clock size={24} />
                : <CheckCircle size={24} />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-zinc-100 font-semibold">{pedido.mesa}</span>
                <span className="text-zinc-500 text-sm">·</span>
                <span className="text-zinc-400 text-sm">{pedido.cliente}</span>
                <span className="text-zinc-600 text-xs ml-auto">{pedido.hora}</span>
              </div>
              <p className="text-zinc-500 text-sm">
                {pedido.items.map(i => `${i.cantidad}× ${i.nombre}`).join(' · ')}
              </p>
            </div>

            {/* Acción */}
            {pedido.estado === 'pendiente' && (
              <button
                onClick={() => completar(pedido.id)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/30 transition-colors"
              >
                <CheckCircle size={15} /> Completado
              </button>
            )}
            {pedido.estado === 'completado' && (
              <span className="shrink-0 text-xs text-emerald-600 font-medium">Entregado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
