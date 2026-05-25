'use client'

import { useState } from 'react'
import { Ticket, MapPin, ShoppingBag } from 'lucide-react'

const ENTRADAS = [
  { id: 1, evento: 'Jazz Nights', fecha: 'Sáb, 25 mayo · 22:00h', tipo: 'Pista Principal', precio: 15, codigo: 'FLEX-2C7B' },
  { id: 2, evento: 'Soul & Blues', fecha: 'Vie, 31 mayo · 22:00h', tipo: 'Pista Principal', precio: 12, codigo: 'FLEX-8K1M' },
]

const ZONAS = [
  { id: 1, nombre: 'Pista Principal', descripcion: 'Acceso zona delantera', evento: 'Jazz Nights', fecha: '25 mayo' },
  { id: 2, nombre: 'Sala Roja VIP',   descripcion: 'Reserva 23:00–01:00 · 2h', evento: 'Jazz Nights', fecha: '25 mayo' },
]

const PEDIDOS = [
  {
    id: 1, fecha: '25 mayo · 23:14', mesa: 'Mesa 7', estado: 'completado',
    items: [{ nombre: 'Gin Tonic Premium', cantidad: 2, precio: 9.0 }, { nombre: 'Nachos', cantidad: 1, precio: 7.0 }],
  },
  {
    id: 2, fecha: '25 mayo · 00:02', mesa: 'Mesa 7', estado: 'pendiente',
    items: [{ nombre: 'Mojito', cantidad: 2, precio: 8.5 }],
  },
]

const TABS = [
  { id: 'entradas', label: 'Entradas',         icon: Ticket },
  { id: 'zonas',   label: 'Mis zonas',         icon: MapPin },
  { id: 'pedidos', label: 'Pedidos',           icon: ShoppingBag },
]

export default function PaginaMiArea() {
  const [tab, setTab] = useState('entradas')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Mi área</h1>
        <p className="text-zinc-500 text-sm mt-1">Alex García · Cliente</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-gold-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Entradas */}
      {tab === 'entradas' && (
        <div className="space-y-4 max-w-2xl">
          {ENTRADAS.map(e => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-xl shrink-0 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array(16).fill(0).map((_, i) => (
                    <div key={i} className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-zinc-900' : 'bg-white'}`} />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-zinc-100">{e.evento}</h3>
                <p className="text-zinc-400 text-sm mt-0.5">{e.fecha}</p>
                <p className="text-zinc-500 text-sm">{e.tipo}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-gold-400 font-bold text-xl">{e.precio} €</p>
                <p className="text-zinc-600 text-xs mt-1 font-mono">{e.codigo}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zonas */}
      {tab === 'zonas' && (
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          {ZONAS.map(z => (
            <div key={z.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <MapPin size={18} className="text-gold-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-zinc-100">{z.nombre}</h3>
                  <p className="text-zinc-500 text-sm">{z.descripcion}</p>
                </div>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>{z.evento}</span>
                <span>{z.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pedidos */}
      {tab === 'pedidos' && (
        <div className="space-y-4 max-w-2xl">
          {PEDIDOS.map(p => {
            const total = p.items.reduce((s, i) => s + i.precio * i.cantidad, 0)
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-zinc-100 font-medium text-sm">{p.mesa}</p>
                    <p className="text-zinc-500 text-xs">{p.fecha}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.estado === 'completado'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {p.estado === 'completado' ? 'Entregado' : 'En camino'}
                  </span>
                </div>
                <ul className="space-y-1 border-t border-zinc-800 pt-3">
                  {p.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{item.cantidad}× {item.nombre}</span>
                      <span className="text-zinc-500">{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-zinc-500 text-xs">Total</span>
                  <span className="text-gold-400 font-bold">{total.toFixed(2)} €</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
