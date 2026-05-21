'use client'
import { useState } from 'react'
import type { ProjectTask, LabProject } from '@/lib/types'

type Member = { username: string; name: string }

const COLUMNS = [
  {
    id: 'todo' as const,
    label: 'A Fazer',
    dot: 'bg-slate-400',
    cardAccent: 'border-l-slate-300',
    dropRing: 'ring-slate-300',
  },
  {
    id: 'em_andamento' as const,
    label: 'Em Andamento',
    dot: 'bg-blue-500',
    cardAccent: 'border-l-blue-400',
    dropRing: 'ring-blue-300',
  },
  {
    id: 'concluido' as const,
    label: 'Concluído',
    dot: 'bg-emerald-500',
    cardAccent: 'border-l-emerald-400',
    dropRing: 'ring-emerald-300',
  },
]

type ColId = (typeof COLUMNS)[number]['id']

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white`}>
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

export default function KanbanBoard({
  tasks: initialTasks,
  members,
  projeto,
  currentUsername,
}: {
  tasks: ProjectTask[]
  members: Member[]
  projeto: LabProject
  currentUsername: string
}) {
  const [tasks, setTasks]       = useState<ProjectTask[]>(initialTasks)
  const [adding, setAdding]     = useState<ColId | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ProjectTask | null>(null)
  const [editForm, setEditForm] = useState<Partial<ProjectTask>>({})
  const [saving, setSaving]     = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<ColId | null>(null)

  function colTasks(col: ColId) {
    return tasks.filter(t => t.status === col).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
  const colIdx = (col: ColId) => COLUMNS.findIndex(c => c.id === col)

  // ── Create ───────────────────────────────────────────────────────────────────
  async function createTask(col: ColId) {
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/project-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          titulo: newTitle.trim(),
          status: col,
          order: colTasks(col).length,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setTasks(prev => [...prev, data as ProjectTask])
        setNewTitle('')
        setAdding(null)
      } else {
        setCreateError(data?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setCreateError('Falha na conexão. Verifique se a tabela project_tasks foi criada no Supabase.')
    } finally { setCreating(false) }
  }

  // ── Move ─────────────────────────────────────────────────────────────────────
  async function moveTask(taskId: string, newStatus: ColId) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus }),
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
    if (!confirm('Remover esta tarefa?')) return
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
    setDragging(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }
  function onDragOver(e: React.DragEvent, col: ColId) {
    e.preventDefault()
    setDragOver(col)
  }
  function onDrop(e: React.DragEvent, col: ColId) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragging
    if (id) {
      const t = tasks.find(t => t.id === id)
      if (t && t.status !== col) moveTask(id, col)
    }
    setDragging(null); setDragOver(null)
  }

  // ── Members at the top ───────────────────────────────────────────────────────
  const MAX_AVATARS = 6

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {createError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Erro ao criar tarefa</p>
            <p className="text-red-600 mt-0.5">{createError}</p>
          </div>
          <button onClick={() => setCreateError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Members bar */}
      {members.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membros</span>
          <div className="flex -space-x-2">
            {members.slice(0, MAX_AVATARS).map(m => (
              <div key={m.username} title={m.name}>
                <Avatar name={m.name} size="md" />
              </div>
            ))}
            {members.length > MAX_AVATARS && (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 ring-2 ring-white border border-gray-200">
                +{members.length - MAX_AVATARS}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 ml-2">
            {members.slice(0, MAX_AVATARS).map(m => (
              <span key={m.username} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                {m.name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(col => {
          const cards = colTasks(col.id)
          const isOver = dragOver === col.id
          return (
            <div
              key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              className={`rounded-2xl bg-gray-50 border transition-all duration-150 ${
                isOver
                  ? `border-gray-300 ring-2 ${col.dropRing} ring-offset-1`
                  : 'border-gray-200'
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="text-xs font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full min-w-[1.5rem] text-center">
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAdding(col.id); setNewTitle(''); setCreateError(null) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-teal-600 hover:bg-white border border-transparent hover:border-teal-200 text-xl leading-none transition-all"
                  title="Adicionar tarefa"
                >
                  +
                </button>
              </div>

              {/* Cards list */}
              <div className="p-3 space-y-2 min-h-32">
                {cards.map(task => {
                  const assignee  = members.find(m => m.username === task.assignedTo)
                  const idx       = colIdx(col.id)
                  const isDragging = dragging === task.id
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
                          assignedTo: task.assignedTo ?? '',
                          status: task.status,
                        })
                      }}
                      className={`bg-white rounded-xl border border-l-4 ${col.cardAccent} border-gray-200 p-3.5 cursor-pointer group hover:shadow-md hover:border-gray-300 transition-all select-none ${
                        isDragging ? 'opacity-30 scale-95 shadow-lg' : ''
                      }`}
                    >
                      {/* Card top: grip + title */}
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0">
                          <GripIcon />
                        </div>
                        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.titulo}</p>
                      </div>

                      {task.descricao && (
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2 ml-5">{task.descricao}</p>
                      )}

                      {/* Card footer: assignee + actions */}
                      <div className="flex items-center justify-between mt-3 ml-5">
                        {assignee ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={assignee.name} size="sm" />
                            <span className="text-xs text-gray-500">{assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : <span />}

                        <div
                          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          {idx > 0 && (
                            <button
                              title={`→ ${COLUMNS[idx - 1].label}`}
                              onClick={() => moveTask(task.id, COLUMNS[idx - 1].id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-xs"
                            >←</button>
                          )}
                          {idx < COLUMNS.length - 1 && (
                            <button
                              title={`→ ${COLUMNS[idx + 1].label}`}
                              onClick={() => moveTask(task.id, COLUMNS[idx + 1].id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-xs"
                            >→</button>
                          )}
                          <button
                            title="Remover"
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Empty drop zone when dragging */}
                {isOver && cards.length === 0 && (
                  <div className="h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-400 font-medium">Soltar aqui</span>
                  </div>
                )}

                {/* Add task form / button */}
                {adding === col.id ? (
                  <div className="bg-white rounded-xl border-2 border-teal-400 p-3 shadow-sm">
                    <textarea
                      autoFocus
                      rows={2}
                      className="w-full text-sm resize-none focus:outline-none placeholder-gray-400 text-gray-900 leading-snug"
                      placeholder="Título da tarefa…"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); createTask(col.id) }
                        if (e.key === 'Escape') { setAdding(null); setNewTitle('') }
                      }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => createTask(col.id)}
                        disabled={creating || !newTitle.trim()}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {creating ? '…' : 'Adicionar'}
                      </button>
                      <button
                        onClick={() => { setAdding(null); setNewTitle('') }}
                        className="text-gray-500 hover:text-gray-700 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAdding(col.id); setNewTitle(''); setCreateError(null) }}
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

      {/* ── Edit modal ──────────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Editar tarefa</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Criado por @{selected.createdBy}
                  {selected.created_at && (
                    <> · {new Date(selected.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 font-medium"
                  value={editForm.titulo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none text-gray-700"
                  placeholder="Detalhes da tarefa…"
                  value={editForm.descricao ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editForm.status ?? selected.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ColId }))}
                  >
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Atribuído a</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={editForm.assignedTo ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Ninguém</option>
                    {members.map(m => <option key={m.username} value={m.username}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => deleteTask(selected.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Remover
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >Cancelar</button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
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
