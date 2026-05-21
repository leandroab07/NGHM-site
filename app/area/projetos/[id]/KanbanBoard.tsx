'use client'
import { useState, useRef, useEffect } from 'react'
import type { ProjectTask, LabProject } from '@/lib/types'

type Member = { username: string; name: string }

const BOARD_COLS = [
  { id: 'todo' as const,         label: 'A Fazer',      dot: 'bg-slate-400',   cardAccent: 'border-l-slate-300',   dropRing: 'ring-slate-300'   },
  { id: 'em_andamento' as const, label: 'Em Andamento', dot: 'bg-blue-500',    cardAccent: 'border-l-blue-400',    dropRing: 'ring-blue-300'    },
  { id: 'concluido' as const,    label: 'Concluído',    dot: 'bg-emerald-500', cardAccent: 'border-l-emerald-400', dropRing: 'ring-emerald-300' },
]
type BoardCol = (typeof BOARD_COLS)[number]['id']

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-5 h-5 text-[8px]' : 'w-8 h-8 text-xs'
  return (
    <div title={name} className={`${cls} rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white`}>
      {initials(name)}
    </div>
  )
}

function GripIcon() {
  return (
    <svg className="w-3 h-3 text-gray-300" viewBox="0 0 12 16" fill="currentColor">
      <circle cx="3" cy="3" r="1.2"/><circle cx="3" cy="8" r="1.2"/><circle cx="3" cy="13" r="1.2"/>
      <circle cx="9" cy="3" r="1.2"/><circle cx="9" cy="8" r="1.2"/><circle cx="9" cy="13" r="1.2"/>
    </svg>
  )
}

function AssigneeCheckboxes({ members, value, onChange }: {
  members: Member[]; value: string[]; onChange: (v: string[]) => void
}) {
  function toggle(u: string) {
    onChange(value.includes(u) ? value.filter(x => x !== u) : [...value, u])
  }
  if (members.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {members.map(m => {
        const checked = value.includes(m.username)
        return (
          <button key={m.username} type="button" onClick={() => toggle(m.username)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${
              checked ? 'bg-teal-50 border-teal-400 text-teal-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            {checked && <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
            {m.name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}

export default function KanbanBoard({
  tasks: initialTasks,
  members,
  projeto,
  currentUsername,
  isAdmin = false,
}: {
  tasks: ProjectTask[]
  members: Member[]
  projeto: LabProject
  currentUsername: string
  isAdmin?: boolean
}) {
  const [tasks, setTasks]             = useState<ProjectTask[]>(initialTasks)
  const [adding, setAdding]           = useState<BoardCol | null>(null)
  const [newTitle, setNewTitle]       = useState('')
  const [newAssigned, setNewAssigned] = useState<string[]>([])
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selected, setSelected]       = useState<ProjectTask | null>(null)
  const [editForm, setEditForm]       = useState<Partial<ProjectTask> & { assignedTo: string[] }>({ assignedTo: [] })
  const [saving, setSaving]           = useState(false)
  const [dragging, setDragging]       = useState<string | null>(null)
  const [dragOver, setDragOver]       = useState<BoardCol | null>(null)
  const [confirming, setConfirming]   = useState<string | null>(null)
  const [finalizing, setFinalizing]   = useState<string | null>(null)

  const addFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adding === null) return
    function handleMouseDown(e: MouseEvent) {
      if (addFormRef.current && !addFormRef.current.contains(e.target as Node)) {
        setAdding(null); setNewTitle(''); setNewAssigned([])
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [adding])

  // Tasks shown on the board (not finalized)
  const boardTasks = tasks.filter(t => t.status !== 'finalizado')
  // Summary sections
  const todoTasks  = tasks.filter(t => t.status === 'todo')
  const doingTasks = tasks.filter(t => t.status === 'em_andamento')
  const doneTasks  = tasks.filter(t => t.status === 'finalizado')

  function colTasks(col: BoardCol) {
    return boardTasks.filter(t => t.status === col).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  // ── Create ───────────────────────────────────────────────────────────────────
  async function createTask(col: BoardCol) {
    if (!newTitle.trim()) return
    setCreating(true); setCreateError(null)
    try {
      const res = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          titulo: newTitle.trim(),
          status: col,
          assignedTo: newAssigned,
          order: colTasks(col).length,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTasks(prev => [...prev, data as ProjectTask])
        setNewTitle(''); setNewAssigned([]); setAdding(null)
      } else {
        setCreateError(data?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setCreateError('Falha na conexão. Verifique se a tabela project_tasks existe no Supabase.')
    } finally { setCreating(false) }
  }

  // ── Move (reversible) ────────────────────────────────────────────────────────
  async function moveTask(taskId: string, newStatus: BoardCol) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    })
  }

  // ── Complete → Concluído column (reversible) ─────────────────────────────────
  async function completeTask(taskId: string) {
    setConfirming(null)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'concluido' } : t))
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: 'concluido' }),
    })
  }

  // ── Finalize → permanent, leaves board, appears in summary ──────────────────
  async function finalizeTask(taskId: string) {
    setFinalizing(null)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'finalizado' } : t))
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: 'finalizado' }),
    })
  }

  // ── Save edit ────────────────────────────────────────────────────────────────
  async function saveEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/project-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...editForm }),
      })
      if (res.ok) {
        const updated: ProjectTask = await res.json()
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
        setSelected(null)
      }
    } finally { setSaving(false) }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function deleteTask(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (selected?.id === taskId) setSelected(null)
    await fetch('/api/project-tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId }),
    })
  }

  // ── Drag & drop ──────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, id: string) {
    setDragging(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id)
  }
  function onDragOver(e: React.DragEvent, col: BoardCol) { e.preventDefault(); setDragOver(col) }
  function onDrop(e: React.DragEvent, col: BoardCol) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragging
    if (id) { const t = tasks.find(t => t.id === id); if (t && t.status !== col) moveTask(id, col) }
    setDragging(null); setDragOver(null)
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {createError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div className="flex-1"><p className="font-semibold">Erro ao criar tarefa</p><p className="text-red-600 mt-0.5">{createError}</p></div>
          <button onClick={() => setCreateError(null)} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
        </div>
      )}

      {/* Members bar */}
      {members.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membros</span>
          <div className="flex -space-x-2">
            {members.slice(0, 8).map(m => <div key={m.username}><Avatar name={m.name} size="md"/></div>)}
            {members.length > 8 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 ring-2 ring-white">
                +{members.length - 8}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map(m => (
              <span key={m.username} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                {m.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kanban board — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {BOARD_COLS.map(col => {
          const cards = colTasks(col.id)
          const isOver = dragOver === col.id
          const colIdx = BOARD_COLS.findIndex(c => c.id === col.id)
          return (
            <div
              key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              className={`rounded-2xl bg-gray-50 border transition-all duration-150 ${
                isOver ? `border-gray-300 ring-2 ${col.dropRing} ring-offset-1` : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="text-xs font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAdding(col.id); setNewTitle(''); setNewAssigned([]); setCreateError(null) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white border border-transparent hover:border-teal-200 text-xl leading-none transition-all"
                >+</button>
              </div>

              <div className="p-3 space-y-2 min-h-32">
                {cards.map(task => {
                  const assignees  = members.filter(m => (task.assignedTo ?? []).includes(m.username))
                  const isOther    = colIdx < BOARD_COLS.length - 1
                  const isPrev     = colIdx > 0
                  const isConfirm  = confirming === task.id
                  const isFinalize = finalizing === task.id
                  const isConcluido = col.id === 'concluido'

                  if (isFinalize) return (
                    <div key={task.id} className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4">
                      <p className="text-sm font-semibold text-emerald-800 mb-1">Finalizar esta tarefa?</p>
                      <p className="text-xs text-emerald-600 mb-3 leading-relaxed">
                        "{task.titulo}" será registrada permanentemente em Concluídas e sairá do quadro.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => finalizeTask(task.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                          Confirmar
                        </button>
                        <button onClick={() => setFinalizing(null)}
                          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )

                  if (isConfirm) return (
                    <div key={task.id} className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
                      <p className="text-sm font-semibold text-blue-800 mb-1">Mover para Concluído?</p>
                      <p className="text-xs text-blue-600 mb-3 leading-relaxed">
                        "{task.titulo}" ficará em Concluído (pode voltar ou finalizar depois).
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => completeTask(task.id)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                          Mover
                        </button>
                        <button onClick={() => setConfirming(null)}
                          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => onDragStart(e, task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      onClick={() => {
                        setSelected(task)
                        setEditForm({
                          titulo: task.titulo,
                          descricao: task.descricao ?? '',
                          assignedTo: task.assignedTo ?? [],
                          status: task.status,
                        })
                      }}
                      className={`bg-white rounded-xl border border-l-4 ${col.cardAccent} border-gray-200 p-3.5 cursor-pointer group hover:shadow-md hover:border-gray-300 transition-all select-none ${
                        dragging === task.id ? 'opacity-30 scale-95' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0"><GripIcon/></div>
                        <p className={`text-sm font-medium leading-snug flex-1 ${isConcluido ? 'text-gray-500' : 'text-gray-900'}`}>
                          {task.titulo}
                        </p>
                      </div>

                      {task.descricao && (
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2 ml-5">{task.descricao}</p>
                      )}

                      {assignees.length > 0 && (
                        <div className="flex -space-x-1.5 mt-2.5 ml-5">
                          {assignees.map(a => <Avatar key={a.username} name={a.name} size="sm"/>)}
                          {assignees.length === 1 && (
                            <span className="text-xs text-gray-500 ml-2 self-center">{assignees[0].name.split(' ')[0]}</span>
                          )}
                        </div>
                      )}

                      {/* Actions row */}
                      <div
                        className="flex items-center justify-between mt-3 ml-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex gap-1">
                          {isPrev && (
                            <button onClick={() => moveTask(task.id, BOARD_COLS[colIdx - 1].id)}
                              title={`Mover para ${BOARD_COLS[colIdx - 1].label}`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs transition-colors">←</button>
                          )}
                          {isOther && (
                            <button onClick={() => moveTask(task.id, BOARD_COLS[colIdx + 1].id)}
                              title={`Mover para ${BOARD_COLS[colIdx + 1].label}`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs transition-colors">→</button>
                          )}
                          {/* ✓ Mover para Concluído — só em A Fazer e Em Andamento */}
                          {!isConcluido && (
                            <button onClick={() => setConfirming(task.id)} title="Mover para Concluído"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                            </button>
                          )}
                          {/* Finalizar — só na coluna Concluído */}
                          {isConcluido && (
                            <button onClick={() => setFinalizing(task.id)} title="Finalizar permanentemente"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors border border-emerald-200">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                              </svg>
                              Finalizar
                            </button>
                          )}
                        </div>
                        <button onClick={() => deleteTask(task.id)} title="Remover"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {isOver && cards.length === 0 && (
                  <div className="h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-medium">Soltar aqui</span>
                  </div>
                )}

                {/* Inline add form */}
                {adding === col.id ? (
                  <div ref={addFormRef} className="bg-white rounded-xl border-2 border-teal-400 p-3 shadow-sm">
                    <textarea
                      autoFocus rows={2}
                      className="w-full text-sm resize-none focus:outline-none placeholder-gray-400 text-gray-900 leading-snug"
                      placeholder="Título da tarefa…"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createTask(col.id) }
                        if (e.key === 'Escape') { setAdding(null); setNewTitle(''); setNewAssigned([]) }
                      }}
                    />
                    {members.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-1">Responsáveis:</p>
                        <AssigneeCheckboxes members={members} value={newAssigned} onChange={setNewAssigned}/>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => createTask(col.id)} disabled={creating || !newTitle.trim()}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        {creating ? '…' : 'Adicionar'}
                      </button>
                      <button onClick={() => { setAdding(null); setNewTitle(''); setNewAssigned([]) }}
                        className="text-gray-500 hover:text-gray-700 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAdding(col.id); setNewTitle(''); setNewAssigned([]); setCreateError(null) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-all group/add"
                  >
                    <span className="w-4 h-4 rounded-md bg-gray-100 group-hover/add:bg-teal-100 flex items-center justify-center text-gray-400 group-hover/add:text-teal-600 transition-colors font-bold text-sm leading-none">+</span>
                    Adicionar tarefa
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Summary list ──────────────────────────────────────────────────────── */}
      <div className="mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Resumo das tarefas</h2>
          <div className="flex gap-4 text-xs text-gray-500">
            <span><span className="font-bold text-slate-600">{todoTasks.length}</span> a fazer</span>
            <span><span className="font-bold text-blue-600">{doingTasks.length}</span> em andamento</span>
            <span><span className="font-bold text-emerald-600">{doneTasks.length}</span> finalizadas</span>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Nenhuma tarefa criada ainda.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[
              { label: 'A Fazer',      items: todoTasks,  dot: 'bg-slate-400',   text: 'text-slate-600'  },
              { label: 'Em Andamento', items: doingTasks, dot: 'bg-blue-500',    text: 'text-blue-600'   },
              { label: 'Concluídas',   items: doneTasks,  dot: 'bg-emerald-500', text: 'text-emerald-600'},
            ].map(section => (
              <div key={section.label} className="px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${section.dot}`}/>
                  <span className={`text-xs font-bold uppercase tracking-wide ${section.text}`}>{section.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-semibold">{section.items.length}</span>
                </div>
                {section.items.length === 0 ? (
                  <p className="text-xs text-gray-400 ml-4">Nenhuma.</p>
                ) : (
                  <ul className="space-y-2">
                    {section.items.map(task => {
                      const assignees = members.filter(m => (task.assignedTo ?? []).includes(m.username))
                      return (
                        <li key={task.id} className="flex items-start gap-3 ml-4 group/item">
                          {section.label === 'Concluídas' ? (
                            <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0"/>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug ${section.label === 'Concluídas' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.titulo}
                            </p>
                            {task.descricao && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.descricao}</p>
                            )}
                          </div>
                          {assignees.length > 0 && (
                            <div className="flex -space-x-1 shrink-0">
                              {assignees.map(a => <Avatar key={a.username} name={a.name} size="sm"/>)}
                            </div>
                          )}
                          {/* Admin actions on summary items */}
                          {isAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => {
                                  setSelected(task)
                                  setEditForm({
                                    titulo: task.titulo,
                                    descricao: task.descricao ?? '',
                                    assignedTo: task.assignedTo ?? [],
                                    status: task.status,
                                  })
                                }}
                                title="Editar"
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                title="Apagar"
                                className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ──────────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}/>
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Editar tarefa</h3>
                <p className="text-xs text-gray-400 mt-0.5">Criado por @{selected.createdBy}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  value={editForm.titulo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Detalhes da tarefa…"
                  value={editForm.descricao ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editForm.status ?? selected.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ProjectTask['status'] }))}>
                  <option value="todo">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluído (no quadro)</option>
                  <option value="finalizado">Finalizado (apenas resumo)</option>
                </select>
              </div>
              {members.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Responsáveis</label>
                  <AssigneeCheckboxes members={members} value={editForm.assignedTo ?? []} onChange={v => setEditForm(f => ({ ...f, assignedTo: v }))}/>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => deleteTask(selected.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Remover
              </button>
              <div className="flex gap-2">
                <button onClick={() => setSelected(null)} className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={saveEdit} disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
