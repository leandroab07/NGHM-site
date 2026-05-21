import type { Metadata } from 'next'
import { getEquipe } from '@/lib/data'
import type { Membro } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Nossa Equipe',
  description:
    'Conheça os pesquisadores, estudantes de pós-graduação e graduação do Núcleo de Genética Humana e Molecular da UFES.',
  alternates: { canonical: 'https://nghm.vercel.app/equipe' },
}

const categoriaLabel: Record<Membro['categoria'], string> = {
  docentes:  'Docentes',
  posdoc:    'Pós-Doutorado',
  doutorado: 'Doutorado',
  mestrado:  'Mestrado',
  graduacao: 'Graduação',
}

const categoriaOrder: Membro['categoria'][] = ['docentes', 'posdoc', 'doutorado', 'mestrado', 'graduacao']

export default async function EquipePage() {
  const equipe = await getEquipe()

  const grupos = categoriaOrder
    .map(cat => ({ cat, membros: equipe.filter(m => m.categoria === cat) }))
    .filter(g => g.membros.length > 0)

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Nossa Equipe</h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Pesquisadores, estudantes e colaboradores comprometidos com a ciência genômica de excelência.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {equipe.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <svg className="w-16 h-16 mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-lg font-medium text-gray-400">Nenhum membro cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grupos.map(({ cat, membros }) => (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-7">
                  <h2 className="text-lg font-bold text-gray-900">{categoriaLabel[cat]}</h2>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {membros.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {membros.map(m => {
                    const initials = m.nome.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                    return (
                      <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full mb-4 shrink-0 overflow-hidden shadow-sm">
                          {m.foto
                            ? <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
                            : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                                <span className="text-xl font-bold text-white tracking-wide">{initials}</span>
                              </div>
                            )
                          }
                        </div>
                        <h3 className="font-semibold text-gray-900 leading-snug text-sm">{m.nome}</h3>
                        {m.cargo && <p className="text-xs text-gray-500 mt-1">{m.cargo}</p>}
                        {m.bio && (
                          <p className="text-xs text-gray-400 mt-3 leading-relaxed line-clamp-3">{m.bio}</p>
                        )}
                        {(m.email || m.lattes) && (
                          <div className="flex items-center gap-2 mt-5 w-full">
                            {m.email && (
                              <a href={`mailto:${m.email}`}
                                className="flex-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg py-1.5 transition-colors text-center">
                                Email
                              </a>
                            )}
                            {m.lattes && (
                              <a href={m.lattes} target="_blank" rel="noopener noreferrer"
                                className="flex-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg py-1.5 transition-colors text-center">
                                Lattes
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
