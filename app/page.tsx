import Link from 'next/link'
import { cookies } from 'next/headers'
import { getPublicacoes, getEventos } from '@/lib/data'
import { verifyToken } from '@/lib/auth'
import { catConfig } from '@/app/calendario/CalendarioClient'

export default async function HomePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('nghm-admin-token')?.value
  const isLoggedIn = token ? verifyToken(token) !== null : false

  const publicacoes = await getPublicacoes()
  const eventos = isLoggedIn ? await getEventos() : []

  const today = new Date().toISOString().split('T')[0]
  const upcomingEvents = eventos
    .filter(e => e.data >= today)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 3)
  const recentPubs = publicacoes.filter(p => p.categoria === 'artigo').slice(0, 3)

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white overflow-hidden">
        {/* Texture */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-xs sm:text-sm text-blue-200 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shrink-0" />
              Departamento de Ciências Biológicas — UFES
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
              Núcleo de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                Genética Humana
              </span>{' '}
              e Molecular
            </h1>
            <p className="text-base sm:text-lg text-blue-200/90 leading-relaxed mb-8 max-w-xl">
              Pesquisa translacional em genômica, epigenética e biologia molecular voltada à
              compreensão e ao combate de doenças humanas complexas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/projetos"
                className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 hover:-translate-y-px text-sm">
                Linhas de Pesquisa
              </Link>
              <Link href="/equipe"
                className="bg-white/8 hover:bg-white/15 text-white font-semibold px-6 py-3 rounded-lg border border-white/15 transition-all duration-200 hover:-translate-y-px text-sm backdrop-blur-sm">
                Nossa Equipe
              </Link>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-white/10">
              {[
                { value: '15+', label: 'Anos de pesquisa' },
                { value: '7',   label: 'Linhas de investigação' },
                { value: 'UFES', label: 'Vitória, Espírito Santo' },
                { value: 'CCiS', label: 'Centro de Ciências da Saúde' },
              ].map(s => (
                <div key={s.label} className="sm:px-8 first:pl-0 last:pr-0">
                  <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-blue-300/80 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Publicações recentes ────────────────────────────────── */}
      {recentPubs.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Produção Científica</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Publicações Recentes</h2>
              </div>
              <Link href="/publicacoes" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors hidden sm:flex items-center gap-1">
                Ver todas
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="space-y-3">
              {recentPubs.map((pub) => (
                <div key={pub.id} className="group bg-white border border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600 leading-none">{pub.ano}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2 text-sm sm:text-base leading-snug group-hover:text-blue-900 transition-colors">{pub.titulo}</h3>
                      <p className="text-gray-500 text-xs sm:text-sm mb-1 line-clamp-1">{pub.autores}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-blue-600 text-xs font-semibold">{pub.revista}</span>
                        {pub.doi && (
                          <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-400 hover:text-blue-500 transition-colors font-mono">
                            DOI: {pub.doi}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Agenda (só logados) ──────────────────────────────────── */}
      {isLoggedIn && (
        <section className="py-16 sm:py-20 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Uso Interno</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Agenda do Laboratório</h2>
              </div>
              <Link href="/calendario" className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors hidden sm:flex items-center gap-1">
                Calendário completo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">Nenhum evento agendado.</p>
                <Link href="/calendario" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                  Abrir calendário →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingEvents.map(e => {
                  const cfg = catConfig[e.categoria as keyof typeof catConfig]
                  return (
                    <Link key={e.id} href="/calendario"
                      className="group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: cfg?.hex }} />
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg?.hex + '20', color: cfg?.hex }}>
                            {cfg?.label}
                          </span>
                          {e.hora && <span className="text-xs text-gray-400 font-mono">{e.hora}</span>}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-snug group-hover:text-blue-900 transition-colors">{e.titulo}</h3>
                        <p className="text-xs text-gray-400">
                          {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                        </p>
                        {e.descricao && <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{e.descricao}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />
            <div className="relative">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-3">Colaboração</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Faça parte da nossa pesquisa</h2>
              <p className="text-blue-200/80 text-sm sm:text-base mb-8 max-w-lg mx-auto leading-relaxed">
                Interessado em colaborar com o NGHM ou participar de nossas linhas de investigação?
                Entre em contato com a coordenação do laboratório.
              </p>
              <a href="mailto:nghm@ufes.br"
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-7 py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-px text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                nghm@ufes.br
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
