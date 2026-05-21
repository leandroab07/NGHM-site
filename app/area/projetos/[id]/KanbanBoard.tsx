'use client'
import { useState } from 'react'
import type { ProjectTask, LabProject } from '@/lib/types'

type Member = { username: string; name: string }

const COLUMNS = [
  { id: 'todo' as const,         label: 'A Fazer',       bg: 'bg-slate-50',  border: 'border-slate-200', dot: 'bg-slate-400',  ring: 'ring-slate-300'  },
  { id: 'em_andamento' as const, label: 'Em Andamento',  bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-500',   ring: 'ring-blue-300'   },
  { id: 'concluido' as const,    label: 'Concluído',     bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500',  ring: 'ring-green-300'  },
]

type ColId = (typeof COLUMNS)[number]['id']

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function KanbanBoard({
  projeto,
  tasks: initialTasks,
  members,
  currentUsername,
}: {
  projeto: LabProject
  tasks: ProjectTask[]
  members: Member[]
  currentUsername: string
}) {
  const [tasks, setTasks]         = useState<ProjectTask[]>(initialTasks)
  const [adding, setAdding]       = useState<ColId | null>(null)
  const [newTitle, setNewTitle]   = useState('')
  const [creating, setCreating]   = useState(false)
  const [selected, setSelected]   = useState<ProjectTask | null>(null)
  const [editForm, setEditForm]   = useState<Partial<ProjectTask>>({})
  const [saving, setSaving]       = useState(false)
  const [dragging, setDragging]   = useState<string | null>(null)
  const [dragOver, setDragOver]   = useState<ColId | null>(null)

  function colTasks(col: ColId) {
    return tasks.filter(t => t.status === col).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async function createTask(col: ColId) {
    if (!newTitle.trim()) return
    setCreating(true)
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
      if (res.ok) {
        const created: ProjectTask = await res.json()
        setTasks(prev => [...prev, created])
        setNewTitle('')
        setAdding(null)
      }
    } finally { setCreating(false) }
  }

  // ── Move ────────────────────────────────────────────────────────────────────
  async function moveTask(taskId: string, newStatus: ColId) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch('/api/project-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus }),
    })
  }

  // ── Save edit ───────────────────────────────────────────────────────────────
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

  // ── Delete ──────────────────────────────────────────────────────────────────
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

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, taskId: string) {
    setDragging(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }
  function onDragOver(e: React.DragEvent, col: ColId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(col)
  }
  function onDrop(e: React.DragEvent, col: ColId) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragging
    if (id) {
      const task = tasks.find(t => t.id === id)
      if (task && task.status !== col) moveTask(id, col)
    }
    setDragging(null)
    setDragOver(null)
  }

  const colIndex = (col: ColId) => COLUMNS.findIndex(c => c.id === col)

  return (
    <>
      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const cards   = colTasks(col.id)
          const isOver  = dragOver === col.id
          return (
            <div
              key={col.id}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              className={`rounded-2xl border-2 transition-all duration-150 ${col.bg} ${
                isOver ? `${col.border} ring-2 ${col.ring} ring-offset-2` : 'border-transparent'
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-gray-800">{col.label}</span>
                  <span className="text-xs font-semibold text-gray-400 bg-white rounded-full px-2 py-0.5 border border-gray-200 min-w-[1.5rem] text-center">
                    {cards.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAdding(col.id); setNewTitle('') }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-200 text-xl leading-none transition-all"
                >
                  +
                </button>
              </div>

              {/* Cards */}
              <div className="px-3 pb-3 space-y-2 min-h-24">
                {cards.map(task => {
                  const assignee  = members.find(m => m.username === task.assignedTo)
                  const idx       = colIndex(col.id)
                  const isDragging = dragging === task.id
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => onDragStart(e, task.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      onClick={() => { setSelected(task); setEditForm({ titulo: task.titulo, descricao: task.descricao ?? '', assignedTo: task.assignedTo ?? '', status: task.status }) }}
                      className={`bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer select-none group hover:shadow-md hover:border-gray-300 transition-all ${
                        isDragging ? 'opacity-30 ring-2 ring-blue-400 scale-95' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 leading-snug">{task.titulo}</p>
                      {task.descricao && (
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{task.descricao}</p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        {assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                              {initials(assignee.name)}
                            </div>
                            <span className="text-xs text-gray-500 truncate max-w-[6rem]">
                              {assignee.name.split(' ')[0]}
                            </span>
                          </div>
                        ) : <span />}

                        <div
                          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={e => e.stopPropagation()}
                        >
                          {idx > 0 && (
                            <button
                              title={`Mover para ${COLUMNS[idx - 1].label}`}
                              onClick={() => moveTask(task.id, COLUMNS[idx - 1].id)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-xs font-bold"
                            >
                              ←
                            </button>
                          )}
                          {idx < COLUMNS.length - 1 && (
                            <button
                              title={`Mover para ${COLUMNS[idx + 1].label}`}
                              onClick={() => moveTask(task.id, COLUMNS[idx + 1].id)}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-xs font-bold"
                            >
                              →
                            </button>
                          )}
                          <button
                            title="Remover"
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Drop placeholder when dragging over empty column */}
                {isOver && cards.length === 0 && (
                  <div className="h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Soltar aqui</span>
                  </div>
                )}

                {/* Inline add form */}
                {adding === col.id ? (
                  <div className="bg-white rounded-xl border-2 border-blue-400 p-3 shadow-sm">
                    <textarea
                      autoFocus
                      rows={2}
                      className="w-full text-sm resize-none focus:outline-none placeholder-gray-400 text-gray-900"
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
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
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
                    onClick={() => { setAdding(col.id); setNewTitle('') }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                  >
                    + Adicionar tarefa
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar tarefa</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editForm.titulo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Detalhes da tarefa…"
                  value={editForm.descricao ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.status ?? selected.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as ColId }))}
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Atribuído a</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editForm.assignedTo ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Ninguém</option>
                    {members.map(m => (
                      <option key={m.username} value={m.username}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-gray-400 pt-1">
                Criado por <span className="font-medium text-gray-500">@{selected.createdBy}</span>
                {selected.created_at && (
                  <> · {new Date(selected.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => deleteTask(selected.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                Remover tarefa
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
