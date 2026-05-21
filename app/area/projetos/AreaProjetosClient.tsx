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
  myProjects: initialMy,
  pendingIds: initialPendingIds,
  currentUsername,
}: {
  allProjects: LabProject[]
  myProjects: LabProject[]
  pendingIds: string[]
  currentUsername: string
}) {
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set(initialPendingIds))
  const [acceptedExtra, setAcceptedExtra] = useState<LabProject[]>([])
  const [declinedIds, setDeclinedIds] = useState<Set<string>>(new Set())
  const [responding, setResponding] = useState<string | null>(null)

  const myProjects = [
    ...initialMy,
    ...acceptedExtra.filter(p => !initialMy.some(m => m.id === p.id)),
  ]

  const visibleAll = allProjects.filter(p => {
    if (!declinedIds.has(p.id)) return true
    return p.visibility !== 'assigned'
  })

  async function respond(projeto: LabProject, resposta: 'aceito' | 'recusado') {
    setResponding(projeto.id)
    try {
      const res = await fetch('/api/project-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetoId: projeto.id, resposta }),
      })
      if (res.ok) {
        setPendingIds(prev => { const next = new Set(prev); next.delete(projeto.id); return next })
        if (resposta === 'aceito') {
          setAcceptedExtra(prev => [...prev, projeto])
        } else {
          setDeclinedIds(prev => new Set([...prev, projeto.id]))
        }
      }
    } finally {
      setResponding(null)
    }
  }

  const projects = tab === 'all' ? visibleAll : myProjects

  const tabs = [
    { key: 'all' as const, label: 'Todos os Projetos', count: visibleAll.length },
    { key: 'mine' as const, label: 'Meus Projetos', count: myProjects.length },
  ]

  return (
    <div>
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
            {t.key === 'all' && pendingIds.size > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                {pendingIds.size} pendente{pendingIds.size > 1 ? 's' : ''}
              </span>
            )}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          label={tab === 'all' ? 'Nenhum projeto disponível.' : 'Você ainda não aceitou nenhum projeto.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p, i) => {
            const isPending = pendingIds.has(p.id)
            const isResponding = responding === p.id
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border border-l-4 ${colors[i % colors.length]} p-5 transition-all ${
                  isPending
                    ? 'border-amber-300 shadow-sm ring-1 ring-amber-200'
                    : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                  {isPending && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      Aguardando resposta
                    </span>
                  )}
                  {p.anoInicio && (
                    <span className="text-xs text-gray-400">{p.anoInicio}</span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 leading-snug mb-2">{p.titulo}</h3>
                {p.descricao && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{p.descricao}</p>
                )}

                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={isResponding}
                      onClick={() => respond(p, 'aceito')}
                      className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                    >
                      {isResponding ? '…' : 'Participar'}
                    </button>
                    <button
                      disabled={isResponding}
                      onClick={() => respond(p, 'recusado')}
                      className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold py-2 rounded-xl border border-red-200 transition-colors"
                    >
                      {isResponding ? '…' : 'Recusar'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
