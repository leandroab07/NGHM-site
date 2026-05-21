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
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-teal-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-purple-500 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              Universidade Federal do Espírito Santo
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Núcleo de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-300">
                Genética Humana
              </span>{' '}
              e Molecular
            </h1>
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl">
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
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all backdrop-blur-sm hover:-translate-y-0.5"
              >
                Publicações
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Recent Publications */}
      {recentPubs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Publicações Recentes</h2>
                <p className="text-gray-500">Produção científica do nosso laboratório</p>
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
      {isLoggedIn && <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Agenda do Laboratório</h2>
              <p className="text-gray-500">Próximas tarefas e eventos agendados</p>
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
      <section className="py-16 bg-gradient-to-r from-blue-700 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Faça parte da nossa pesquisa</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Interessado em colaborar ou participar do NGHM? Entre em contato conosco.
          </p>
          <a
            href="mailto:nghm@ufes.br"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Entre em Contato
          </a>
        </div>
      </section>
    </>
  )
}
