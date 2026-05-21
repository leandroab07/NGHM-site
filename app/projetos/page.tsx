import type { Metadata } from 'next'
import { getProjetos } from '@/lib/data'
import type { Projeto } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Projetos de Pesquisa',
  description:
    'Linhas de pesquisa do NGHM-UFES: oncologia translacional, genética do câncer, bioinformática, seguimento farmacoterapêutico em oncologia e genética da COVID longa.',
  alternates: { canonical: 'https://nghm.vercel.app/projetos' },
}

const statusConfig = {
  em_andamento: { label: 'Em andamento', class: 'bg-green-100 text-green-700' },
  concluido:    { label: 'Concluído',    class: 'bg-gray-100 text-gray-600' },
}

const areaColors = [
  'border-l-blue-500',
  'border-l-teal-500',
  'border-l-purple-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-indigo-500',
  'border-l-green-500',
]

export default async function ProjetosPage() {
  const projetos = await getProjetos()

  const emAndamento = projetos.filter(p => p.status === 'em_andamento')
  const concluidos  = projetos.filter(p => p.status === 'concluido')

  return (
    <>
      <section className="bg-white border-b border-gray-100 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Projetos de Pesquisa</h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
            Linhas de investigação científica em andamento e concluídas pelo NGHM.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {projetos.length === 0 ? (
          <div className="text-center py-24 text-gray-300">
            <svg className="w-14 h-14 mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-lg font-medium text-gray-400">Nenhum projeto cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {emAndamento.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Linhas de Pesquisa Ativas
                    <span className="ml-2 text-sm font-normal text-gray-400">{emAndamento.length} linha{emAndamento.length !== 1 ? 's' : ''}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {emAndamento.map((p, i) => (
                    <ProjetoCard key={p.id} projeto={p} colorClass={areaColors[i % areaColors.length]} />
                  ))}
                </div>
              </section>
            )}

            {concluidos.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Projetos Concluídos
                    <span className="ml-2 text-sm font-normal text-gray-400">{concluidos.length} projeto{concluidos.length !== 1 ? 's' : ''}</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 opacity-80">
                  {concluidos.map((p, i) => (
                    <ProjetoCard key={p.id} projeto={p} colorClass={areaColors[i % areaColors.length]} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Coordenadora */}
        {projetos.length > 0 && (
          <div className="mt-14 bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
              DM
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Coordenadora</p>
              <h3 className="text-lg font-bold text-gray-900 mb-0.5">Débora Dummer Meira</h3>
              <p className="text-sm text-gray-500 mb-3">Núcleo de Genética Humana e Molecular — UFES</p>
              <a
                href="mailto:debora.meira@ufes.br"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                debora.meira@ufes.br
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ProjetoCard({ projeto, colorClass }: { projeto: Projeto; colorClass: string }) {
  const status = statusConfig[projeto.status]
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${colorClass} shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${status.class}`}>
          {status.label}
        </span>
        <span className="text-xs text-gray-400 shrink-0">
          {projeto.anoInicio}{projeto.anoFim ? ` — ${projeto.anoFim}` : ''}
        </span>
      </div>

      <h3 className="font-bold text-gray-900 text-base leading-snug mb-3 flex-1">
        {projeto.titulo}
      </h3>

      {projeto.descricao && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-4 mb-4">
          {projeto.descricao}
        </p>
      )}

      {projeto.financiamento && (
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">Financiamento:</span>
          <span className="text-xs font-medium text-gray-600">{projeto.financiamento}</span>
        </div>
      )}

      {projeto.pesquisadores && projeto.pesquisadores.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1">
          {projeto.pesquisadores.map(p => (
            <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
