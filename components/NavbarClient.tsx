'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PublicUser } from '@/lib/types'

const links = [
  { href: '/', label: 'Início' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/publicacoes', label: 'Publicações' },
  { href: '/calendario', label: 'Calendário' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/ferramentas', label: 'Ferramentas' },
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
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-700 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border border-white/30 shrink-0">
              <Image src="/nghm.png" alt="NGHM" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">NGHM</p>
              <p className="text-blue-200 text-xs leading-tight">UFES</p>
            </div>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === l.href
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
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
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {initials(user.name)}
                  </div>
                  <span className="text-white text-sm font-medium">{user.name.split(' ')[0]}</span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-md font-semibold">Admin</span>
                  )}
                  <span className="text-blue-200 text-xs">▾</span>
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                    {user.role === 'admin' && (
                      <>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span>🏠</span> Dashboard Admin
                        </Link>
                        <Link
                          href="/admin/usuarios"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span>👥</span> Gerenciar Usuários
                        </Link>
                        <Link
                          href="/admin/equipe"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span>✏️</span> Editar Conteúdo
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span> Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-white/20 transition-all"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Hamburguer mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-blue-100 hover:bg-white/10"
            aria-label="Menu"
          >
            <div className={`w-5 h-0.5 bg-current mb-1 transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
            <div className={`w-5 h-0.5 bg-current mb-1 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-white/10 pt-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-all ${
                  pathname === l.href ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-blue-200">
                    {user.name} {user.role === 'admin' && <span className="text-amber-300">(Admin)</span>}
                  </div>
                  {user.role === 'admin' && (
                    <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-blue-100 hover:bg-white/10 rounded-lg">
                      Dashboard Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout() }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 rounded-lg"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg text-center mt-1"
                >
                  Entrar
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Fecha dropdown ao clicar fora */}
      {userOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
      )}
    </header>
  )
}
