'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LabProject, ProjectTask } from '@/lib/types'

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
  const [pdfGenerating, setPdfGenerating]  = useState<string | null>(null)

  const myProjects = [
    ...initialMy,
    ...acceptedExtra.filter(p => !initialMy.some(m => m.id === p.id)),
  ]

  const visibleAll = allProjects.filter(p =>
    !(declinedIds.has(p.id) && p.visibility === 'assigned')
  )

  async function generatePDF(projeto: LabProject, e: React.MouseEvent) {
    e.stopPropagation()
    if (pdfGenerating) return
    setPdfGenerating(projeto.id)
    try {
      const res = await fetch(`/api/project-tasks?projetoId=${projeto.id}`)
      const tasks: ProjectTask[] = res.ok ? await res.json() : []

      const todo       = tasks.filter(t => t.status === 'todo')
      const inProgress = tasks.filter(t => t.status === 'em_andamento')
      const done       = tasks.filter(t => t.status === 'concluido')
      const total      = tasks.length || 1

      // Build pie chart on canvas
      const canvas = document.createElement('canvas')
      canvas.width  = 240
      canvas.height = 240
      const ctx = canvas.getContext('2d')!
      const cx = 120, cy = 120, r = 100, inner = 55

      const slices = [
        { count: todo.length,       color: '#64748b' },
        { count: inProgress.length, color: '#3b82f6' },
        { count: done.length,       color: '#10b981' },
      ]

      let startAngle = -Math.PI / 2
      for (const slice of slices) {
        const sweep = (slice.count / total) * 2 * Math.PI
        if (sweep === 0) continue
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startAngle, startAngle + sweep)
        ctx.closePath()
        ctx.fillStyle = slice.color
        ctx.fill()
        startAngle += sweep
      }
      // donut hole
      ctx.beginPath()
      ctx.arc(cx, cy, inner, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      // center text
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(tasks.length), cx, cy - 10)
      ctx.font = '13px sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText('tarefas', cx, cy + 16)

      const chartImg = canvas.toDataURL('image/png')

      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pw = doc.internal.pageSize.getWidth()
      const margin = 48

      // Header bar
      doc.setFillColor(15, 118, 110)
      doc.rect(0, 0, pw, 72, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(projeto.titulo, margin, 30)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      if (projeto.descricao) {
        const lines = doc.splitTextToSize(projeto.descricao, pw - margin * 2) as string[]
        doc.text(lines.slice(0, 2), margin, 50)
      }

      let y = 100

      // Stats row
      const stats = [
        { label: 'A Fazer',     count: todo.length,       hex: '#64748b' },
        { label: 'Em Andamento', count: inProgress.length, hex: '#3b82f6' },
        { label: 'Concluídas',  count: done.length,        hex: '#10b981' },
      ]
      const boxW = (pw - margin * 2 - 20) / 3
      stats.forEach((s, i) => {
        const bx = margin + i * (boxW + 10)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(bx, y, boxW, 54, 6, 6, 'F')
        doc.setTextColor(...hexToRgb(s.hex) as [number,number,number])
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text(String(s.count), bx + boxW / 2, y + 26, { align: 'center' })
        doc.setTextColor(107, 114, 128)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(s.label, bx + boxW / 2, y + 42, { align: 'center' })
      })
      y += 70

      // Pie chart
      doc.addImage(chartImg, 'PNG', pw / 2 - 70, y, 140, 140)
      y += 155

      // Legend under chart
      const legend = [
        { label: 'A Fazer',      hex: '#64748b' },
        { label: 'Em Andamento', hex: '#3b82f6' },
        { label: 'Concluídas',   hex: '#10b981' },
      ]
      const legendX = pw / 2 - 120
      legend.forEach((l, i) => {
        const lx = legendX + i * 82
        doc.setFillColor(...hexToRgb(l.hex) as [number,number,number])
        doc.roundedRect(lx, y, 10, 10, 2, 2, 'F')
        doc.setTextColor(55, 65, 81)
        doc.setFontSize(9)
        doc.text(l.label, lx + 13, y + 9)
      })
      y += 28

      // Task sections
      const sections = [
        { title: 'A Fazer',      items: todo,       hex: '#64748b' },
        { title: 'Em Andamento', items: inProgress,  hex: '#3b82f6' },
        { title: 'Concluídas',   items: done,        hex: '#10b981' },
      ]

      for (const sec of sections) {
        if (sec.items.length === 0) continue
        y += 14
        if (y > 740) { doc.addPage(); y = 48 }

        doc.setFillColor(...hexToRgb(sec.hex) as [number,number,number])
        doc.rect(margin, y, 4, 16, 'F')
        doc.setTextColor(17, 24, 39)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text(sec.title, margin + 10, y + 12)
        y += 24

        for (const task of sec.items) {
          if (y > 760) { doc.addPage(); y = 48 }
          doc.setFillColor(248, 250, 252)
          const titleLines = doc.splitTextToSize(`• ${task.titulo}`, pw - margin * 2 - 12) as string[]
          const boxH = titleLines.length * 14 + (task.descricao ? 16 : 0) + 16
          doc.roundedRect(margin, y, pw - margin * 2, boxH, 4, 4, 'F')
          doc.setTextColor(17, 24, 39)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(titleLines, margin + 10, y + 14)
          if (task.descricao) {
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(107, 114, 128)
            doc.setFontSize(9)
            const descLines = doc.splitTextToSize(task.descricao, pw - margin * 2 - 12) as string[]
            doc.text(descLines.slice(0, 2), margin + 10, y + 14 + titleLines.length * 14)
          }
          y += boxH + 6
        }
      }

      // Footer
      doc.setTextColor(156, 163, 175)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} — NGHM`, margin, doc.internal.pageSize.getHeight() - 20)

      doc.save(`${projeto.titulo}.pdf`)
    } finally {
      setPdfGenerating(null)
    }
  }

  function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return [r, g, b]
  }

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

                {/* PDF button — only in "mine" tab */}
                {tab === 'mine' && isAccepted && (
                  <button
                    disabled={pdfGenerating === p.id}
                    onClick={e => generatePDF(p, e)}
                    className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-teal-300 hover:bg-teal-50 disabled:opacity-50 text-gray-500 hover:text-teal-700 text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    {pdfGenerating === p.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {pdfGenerating === p.id ? 'Gerando…' : 'Gerar relatório PDF'}
                  </button>
                )}

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
