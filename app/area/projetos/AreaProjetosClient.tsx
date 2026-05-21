'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LabProject } from '@/lib/types'

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function StatusPill({ status }: { status: string }) {
  return status === 'em_andamento' ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Em andamento
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Concluído
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-400">{message}</p>
    </div>
  )
}

const ACCENT_COLORS = [
  { from: 'from-blue-500', to: 'to-indigo-600' },
  { from: 'from-teal-500', to: 'to-emerald-600' },
  { from: 'from-violet-500', to: 'to-purple-600' },
  { from: 'from-amber-500', to: 'to-orange-600' },
  { from: 'from-rose-500', to: 'to-pink-600' },
  { from: 'from-cyan-500', to: 'to-blue-600' },
]

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
  const router = useRouter()
  const [tab, setTab]                     = useState<'all' | 'mine'>('all')
  const [pendingIds, setPendingIds]        = useState(new Set(initialPendingIds))
  const [acceptedExtra, setAcceptedExtra]  = useState<LabProject[]>([])
  const [declinedIds, setDeclinedIds]      = useState(new Set<string>())
  const [responding, setResponding]        = useState<string | null>(null)

  const myProjects = [
    ...initialMy,
    ...acceptedExtra.filter(p => !initialMy.some(m => m.id === p.id)),
  ]

  const visibleAll = allProjects.filter(p =>
    !(declinedIds.has(p.id) && p.visibility === 'assigned')
  )

  async function respond(projeto: LabProject, resposta: 'aceito' | 'recusado', e: React.MouseEvent) {
    e.stopPropagation()
    setResponding(projeto.id)
    try {
      const res = await fetch('/api/project-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetoId: projeto.id, resposta }),
      })
      if (res.ok) {
        setPendingIds(prev => { const n = new Set(prev); n.delete(projeto.id); return n })
        if (resposta === 'aceito') setAcceptedExtra(prev => [...prev, projeto])
        else setDeclinedIds(prev => new Set([...prev, projeto.id]))
      }
    } finally { setResponding(null) }
  }

  const projects = tab === 'all' ? visibleAll : myProjects
  const totalActive = visibleAll.filter(p => p.status === 'em_andamento').length

  return (
    <div>
      {/* Stats strip */}
      <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
        <div>
          <p className="text-2xl font-bold text-gray-900">{visibleAll.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">projetos totais</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-2xl font-bold text-emerald-600">{totalActive}</p>
          <p className="text-xs text-gray-500 mt-0.5">em andamento</p>
        </div>
        <div className="w-px h-8 bg-gray-200" />
        <div>
          <p className="text-2xl font-bold text-teal-600">{myProjects.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">meus projetos</p>
        </div>
        {pendingIds.size > 0 && (
          <>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingIds.size}</p>
                <p className="text-xs text-gray-500 mt-0.5">aguardando resposta</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {([
          { key: 'all' as const,  label: 'Todos os Projetos', count: visibleAll.length },
          { key: 'mine' as const, label: 'Meus Projetos',     count: myProjects.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.length === 0 ? (
          <EmptyState
            message={tab === 'all' ? 'Nenhum projeto disponível.' : 'Você ainda não aceitou nenhum projeto.'}
          />
        ) : projects.map((p, i) => {
          const accent     = ACCENT_COLORS[i % ACCENT_COLORS.length]
          const isPending  = pendingIds.has(p.id)
          const isAccepted = !isPending && myProjects.some(m => m.id === p.id)
          const isRsp      = responding === p.id
          const letter     = (p.titulo[0] ?? 'P').toUpperCase()

          return (
            <div
              key={p.id}
              onClick={() => { if (isAccepted) router.push(`/area/projetos/${p.id}`) }}
              className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                isPending
                  ? 'border-amber-300 ring-1 ring-amber-200'
                  : isAccepted
                    ? 'border-gray-200 hover:border-teal-300 hover:shadow-lg cursor-pointer group'
                    : 'border-gray-200'
              }`}
            >
              {/* Color bar + letter */}
              <div className={`h-2 bg-gradient-to-r ${accent.from} ${accent.to} ${isPending ? '!bg-amber-400 from-amber-400 to-amber-500' : ''}`} />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                    {letter}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={p.status} />
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Convite pendente
                      </span>
                    )}
                  </div>
                </div>

                {/* Title + desc */}
                <h3 className="font-bold text-gray-900 leading-snug mb-1.5 group-hover:text-teal-700 transition-colors">
                  {p.titulo}
                </h3>
                {p.descricao && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{p.descricao}</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {p.anoInicio ? (
                    <span className="text-xs text-gray-400 font-medium">{p.anoInicio}</span>
                  ) : <span />}
                  {isAccepted && (
                    <span className="text-xs font-semibold text-teal-600 group-hover:gap-2 flex items-center gap-1 transition-all">
                      Abrir quadro
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Pending buttons */}
                {isPending && (
                  <div className="flex gap-2 mt-4">
                    <button
                      disabled={isRsp}
                      onClick={e => respond(p, 'aceito', e)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                    >
                      {isRsp ? '…' : 'Participar'}
                    </button>
                    <button
                      disabled={isRsp}
                      onClick={e => respond(p, 'recusado', e)}
                      className="flex-1 border border-gray-200 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 text-gray-600 hover:text-red-600 text-sm font-bold py-2.5 rounded-xl transition-colors"
                    >
                      {isRsp ? '…' : 'Recusar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
