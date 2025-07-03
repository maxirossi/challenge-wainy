// components/layout/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const routes = [
  { name: 'Home', path: '/' },
  { name: 'Deudores', path: '/deudores' },
  { name: 'Buscar por CUIT', path: '/about' },
  { name: 'Top', path: '/top' },
  { name: 'Entidades', path: '/entidades' },
  { name: 'Estadísticas', path: '/stats' }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      <nav className="space-y-2">
        {routes.map((route) => (
          <Link
            key={route.path}
            href={route.path}
            className={cn(
              'block py-2 px-4 rounded hover:bg-gray-700',
              pathname === route.path && 'bg-gray-700'
            )}
          >
            {route.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
