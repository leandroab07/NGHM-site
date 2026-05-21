import type { Metadata } from 'next'
import { getPublicacoes } from '@/lib/data'
import type { Publicacao } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Publicações Científicas',
  description:
    'Produção científica do NGHM-UFES: artigos em revistas internacionais, teses, dissertações e livros em genética humana, oncologia e bioinformática.',
  alternates: { canonical: 'https://nghm.vercel.app/publicacoes' },
}

const categoriaLabel: Record<Publicacao['categoria'], string> = {
  artigo:       'Artigo',
  tese:         'Tese',
  dissertacao:  'Dissertação',
  livro:        'Livro',
  capitulo:     'Capítulo de livro',
}

const categoriaBadge: Record<Publicacao['categoria'], string> = {
  artigo:      'bg-blue-100 text-blue-700',
  tese:        'bg-purple-100 text-purple-700',
  dissertacao: 'bg-indigo-100 text-indigo-700',
  livro:       'bg-amber-100 text-amber-700',
  capitulo:    'bg-orange-100 text-orange-700',
}

const categoriaOrder: Publicacao['categoria'][] = ['artigo', 'tese', 'dissertacao', 'livro', 'capitulo']

export default async function PublicacoesPage() {
  const publicacoes = await getPublicacoes()

  const porCategoria = categoriaOrder
    .map(cat => ({ cat, items: publicacoes.filter(p => p.categoria === cat) }))
    .filter(g => g.items.length > 0)

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Publicações Científicas</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Produção científica do Núcleo de Genética Humana e Molecular.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {publicacoes.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-600 mb-2">Nenhuma publicação cadastrada</p>
            <p className="text-sm text-gray-400">Adicione publicações pelo painel administrativo.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {porCategoria.map(({ cat, items }) => (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-lg font-bold text-gray-900">{categoriaLabel[cat]}</h2>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {items.map(pub => (
                    <article
                      key={pub.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3 flex-wrap mb-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${categoriaBadge[pub.categoria]}`}>
                          {categoriaLabel[pub.categoria]}
                        </span>
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                          {pub.ano}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-gray-900 leading-snug mb-1">
                        {pub.titulo}
                      </h3>

                      <p className="text-sm text-gray-500 mb-1">{pub.autores}</p>

                      <p className="text-sm text-gray-400 italic">{pub.revista}</p>

                      {pub.resumo && (
                        <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-3">
                          {pub.resumo}
                        </p>
                      )}

                      {pub.doi && (
                        <div className="mt-4">
                          <a
                            href={pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Ver publicação (DOI)
                          </a>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
