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
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs sm:text-sm text-blue-100 mb-5 sm:mb-6">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shrink-0" />
              Universidade Federal do Espírito Santo
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight mb-5 sm:mb-6">
              Núcleo de{' '}
              <span className="text-teal-300">Genética Humana</span>{' '}
              e Molecular
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 leading-relaxed mb-7 sm:mb-8 max-w-2xl">
              Pesquisa de ponta em genômica, epigenética e biologia molecular para compreender e combater
              doenças humanas. Vinculado ao Departamento de Ciências Biológicas da UFES.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/projetos"
                className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Ver Projetos
              </Link>
              <Link
                href="/publicacoes"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all hover:-translate-y-0.5"
              >
                Publicações
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Publications */}
      {recentPubs.length > 0 && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 sm:mb-10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Publicações Recentes</h2>
                <p className="text-gray-500 text-sm sm:text-base">Produção científica do nosso laboratório</p>
              </div>
              <Link href="/publicacoes" className="text-blue-600 hover:text-blue-700 font-medium text-sm hidden sm:block">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-4">
              {recentPubs.map((pub) => (
                <div key={pub.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {pub.ano}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{pub.titulo}</h3>
                      <p className="text-gray-500 text-sm mb-1">{pub.autores}</p>
                      <p className="text-blue-600 text-sm font-medium">{pub.revista}</p>
                      {pub.doi && (
                        <a
                          href={`https://doi.org/${pub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-blue-500 mt-1 inline-block"
                        >
                          DOI: {pub.doi}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events — visível apenas para usuários logados */}
      {isLoggedIn && <section className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Agenda do Laboratório</h2>
              <p className="text-gray-500 text-sm sm:text-base">Próximas tarefas e eventos agendados</p>
            </div>
            <Link href="/calendario" className="text-blue-600 hover:text-blue-700 font-medium text-sm hidden sm:block">
              Ver calendário completo →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-400">Nenhum evento agendado.</p>
              <Link href="/calendario" className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                Ver calendário →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingEvents.map(e => {
                const cfg = catConfig[e.categoria as keyof typeof catConfig]
                return (
                  <Link key={e.id} href="/calendario" className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden">
                    <div className={`h-1.5 ${cfg?.color}`} />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg?.light}`}>{cfg?.label}</span>
                        {e.hora && <span className="text-xs text-gray-400">{e.hora}</span>}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{e.titulo}</h3>
                      <p className="text-xs text-gray-400">
                        {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                      </p>
                      {e.descricao && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{e.descricao}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>}

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Faça parte da nossa pesquisa</h2>
          <p className="text-gray-500 text-base sm:text-lg mb-7 sm:mb-8 max-w-2xl mx-auto">
            Interessado em colaborar ou participar do NGHM? Entre em contato conosco.
          </p>
          <a
            href="mailto:nghm@ufes.br"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            Entre em Contato
          </a>
        </div>
      </section>
    </>
  )
}
