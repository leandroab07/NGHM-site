'use client'
import { useState } from 'react'
import type { LabProject } from '@/lib/types'

const statusBadge = (s: string) =>
  s === 'em_andamento' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'

const statusLabel = (s: string) =>
  s === 'em_andamento' ? 'Em andamento' : 'Concluído'

const colors = [
  'border-l-blue-500', 'border-l-teal-500', 'border-l-purple-500',
  'border-l-amber-500', 'border-l-rose-500', 'border-l-indigo-500',
]

function ProjectCard({ projeto, index }: { projeto: LabProject; index: number }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors[index % colors.length]} p-5 hover:shadow-md hover:border-gray-300 transition-all`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(projeto.status)}`}>
          {statusLabel(projeto.status)}
        </span>
        {projeto.anoInicio && (
          <span className="text-xs text-gray-400">{projeto.anoInicio}</span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 leading-snug mb-2">{projeto.titulo}</h3>
      {projeto.descricao && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{projeto.descricao}</p>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-20 text-gray-300">
      <svg className="w-14 h-14 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-base font-medium text-gray-400">{label}</p>
    </div>
  )
}

export default function AreaProjetosClient({
  allProjects,
  myProjects,
}: {
  allProjects: LabProject[]
  myProjects: LabProject[]
  currentUsername: string
}) {
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  const tabs = [
    { key: 'all' as const, label: 'Todos os Projetos', count: allProjects.length },
    { key: 'mine' as const, label: 'Meus Projetos', count: myProjects.length },
  ]

  const projects = tab === 'all' ? allProjects : myProjects

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          label={tab === 'all' ? 'Nenhum projeto disponível.' : 'Você ainda não aceitou nenhum projeto.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} projeto={p} index={i} />
          ))}
        </div>
      )}

      {tab === 'mine' && myProjects.length === 0 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Projetos em que você foi adicionado e aceitou aparecerão aqui.
        </p>
      )}
    </div>
  )
}
