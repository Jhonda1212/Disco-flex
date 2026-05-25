'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart, Crown, User,
  ShieldCheck, QrCode, LayoutDashboard,
} from 'lucide-react'

const NAV_CLIENTE = [
  { icon: ShoppingCart, label: 'Pedir',       href: '/' },
  { icon: Crown,        label: 'Salas VIP',   href: '/vip' },
  { icon: User,         label: 'Mi área',     href: '/mi-area' },
]

const NAV_STAFF = [
  { icon: ShieldCheck,    label: 'Panel Staff',   href: '/staff' },
  { icon: QrCode,         label: 'Porteros',      href: '/porteros' },
  { icon: LayoutDashboard,label: 'Admin',         href: '/admin' },
]

function NavGroup({ title, items, pathname }) {
  return (
    <div className="mb-2">
      <p className="px-3 mb-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider">{title}</p>
      {items.map(({ icon: Icon, label, href }) => {
        const activo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activo
                ? 'bg-gold-500/20 text-gold-400'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
      <div className="px-6 py-6 border-b border-zinc-800">
        <span className="text-2xl font-bold text-gold-400 tracking-widest">ƒFLEX</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
        <NavGroup title="Cliente" items={NAV_CLIENTE} pathname={pathname} />
        <NavGroup title="Gestión" items={NAV_STAFF} pathname={pathname} />
      </nav>

      <div className="px-4 py-4 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100">Alex</p>
            <p className="text-xs text-zinc-500">Cliente</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
