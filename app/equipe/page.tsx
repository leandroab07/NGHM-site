import { getEquipe } from '@/lib/data'
import type { Membro } from '@/lib/types'

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
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">Nossa Equipe</h1>
          <p className="text-blue-200 text-lg max-w-2xl">
            Pesquisadores, estudantes e colaboradores comprometidos com a ciência genômica de excelência.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {equipe.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-6xl mb-6">👥</div>
            <p className="text-2xl font-semibold text-gray-500">Nenhum membro cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grupos.map(({ cat, membros }) => (
              <div key={cat}>
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  {categoriaLabel[cat]}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {membros.length} membro{membros.length !== 1 ? 's' : ''}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {membros.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-3xl mb-4 shrink-0 overflow-hidden">
                        {m.foto
                          ? <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
                          : <span>{m.nome.charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <h3 className="font-bold text-gray-900 leading-snug">{m.nome}</h3>
                      <p className="text-sm text-gray-500 mt-1">{m.cargo}</p>
                      {m.bio && (
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed line-clamp-3">{m.bio}</p>
                      )}
                      {(m.email || m.lattes) && (
                        <div className="flex items-center gap-3 mt-4">
                          {m.email && (
                            <a href={`mailto:${m.email}`} className="text-xs text-blue-600 hover:underline">
                              Email
                            </a>
                          )}
                          {m.lattes && (
                            <a href={m.lattes} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">
                              Lattes
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
