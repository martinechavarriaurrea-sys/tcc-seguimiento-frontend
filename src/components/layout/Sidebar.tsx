'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Package,
  PlusCircle,
  Server,
  LogOut,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthContext } from '@/contexts/AuthContext';
import { APP_NAME } from '@/lib/constants';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/guias', label: 'Guías', icon: Package },
  { href: '/guias/nueva', label: 'Registrar guía', icon: PlusCircle },
  { href: '/sistema', label: 'Estado del sistema', icon: Server },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-100">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-700 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
          <Truck className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">{APP_NAME}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-700 p-3">
        <div className="mb-2 px-3 py-1">
          <p className="text-xs text-slate-400">Sesión activa</p>
          <p className="truncate text-sm font-medium text-slate-200">{user?.username ?? '—'}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
