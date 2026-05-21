'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PublicUser } from '@/lib/types'

const publicLinks = [
  { href: '/', label: 'Início' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/publicacoes', label: 'Publicações' },
  { href: '/projetos', label: 'Linhas de Pesquisa' },
  { href: '/ferramentas', label: 'Ferramentas' },
]

const authLinks = [
  { href: '/area/projetos', label: 'Projetos' },
  { href: '/calendario', label: 'Calendário' },
]

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function NavbarClient({ user }: { user: PublicUser | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUserOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shrink-0">
              <Image src="/nghm.png" alt="NGHM" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <div className="hidden sm:block">
              <p className="text-gray-900 font-bold text-sm leading-tight">NGHM</p>
              <p className="text-gray-400 text-xs leading-tight">UFES</p>
            </div>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {[...publicLinks, ...(user ? authLinks : [])].map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === l.href
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Lado direito */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-xl transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{user.name.split(' ')[0]}</span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold">Admin</span>
                  )}
                  <span className="text-gray-400 text-xs">▾</span>
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                    {user.role === 'admin' && (
                      <>
                        <Link href="/admin/dashboard" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                          <span>🏠</span> Dashboard Admin
                        </Link>
                        <Link href="/admin/usuarios" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                          <span>👥</span> Gerenciar Usuários
                        </Link>
                        <Link href="/admin/equipe" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                          <span>✏️</span> Editar Conteúdo
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <span>🚪</span> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login"
                className="text-teal-700 text-sm font-semibold px-4 py-2 rounded-xl border border-teal-200 hover:bg-teal-50 transition-all">
                Entrar
              </Link>
            )}
          </div>

          {/* Hamburger mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Menu"
          >
            <div className={`w-5 h-0.5 bg-current mb-1 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-current mb-1 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 pt-2">
            {[...publicLinks, ...(user ? authLinks : [])].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-all ${
                  pathname === l.href ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {user.name} {user.role === 'admin' && <span className="text-amber-600">(Admin)</span>}
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                      Dashboard Admin
                    </Link>
                  )}
                  <button onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
                    Sair
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-teal-700 border border-teal-200 hover:bg-teal-50 rounded-lg text-center mt-1">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {userOpen && <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />}
    </header>
  )
}
