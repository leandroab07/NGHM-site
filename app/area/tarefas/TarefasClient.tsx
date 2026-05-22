'use client'
import { useState } from 'react'
import type { PersonalTask, ProjectTask } from '@/lib/types'

type Member = { username: string; name: string }
type ProjectTaskEntry = ProjectTask & { projetoNome: string }

type DisplayCol = 'todo' | 'em_andamento' | 'done'

function toCol(status: string): DisplayCol {
  if (status === 'todo') return 'todo'
  if (status === 'em_andamento') return 'em_andamento'
  return 'done'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const COLS: { key: DisplayCol; label: string; dot: string }[] = [
  { key: 'todo',         label: 'A Fazer',      dot: 'bg-slate-400'   },
  { key: 'em_andamento', label: 'Em Andamento',  dot: 'bg-blue-500'    },
  { key: 'done',         label: 'Concluídas',    dot: 'bg-emerald-500' },
]

export default function TarefasClient({
  isAdmin,
  currentUsername,
  currentName,
  members,
  initialPersonalTasks,
  initialProjectTasks,
}: {
  isAdmin: boolean
  currentUsername: string
  currentName: string
  members: Member[]
  initialPersonalTasks: PersonalTask[]
  initialProjectTasks: ProjectTaskEntry[]
}) {
  const [selectedMember, setSelectedMember] = useState<Member>({ username: currentUsername, name: currentName })
  const [personal, setPersonal]             = useState<PersonalTask[]>(initialPersonalTasks)
  const [project, setProject]               = useState<ProjectTaskEntry[]>(initialProjectTasks)
  const [loading, setLoading]               = useState(false)

  // Add form
  const [adding, setAdding]       = useState(false)
  const [newTitle, setNewTitle]   = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [newStatus, setNewStatus] = useState<PersonalTask['status']>('todo')
  const [creating, setCreating]   = useState(false)

  // Edit form
  const [editing, setEditing]   = useState<PersonalTask | null>(null)
  const [editForm, setEditForm] = useState<Partial<PersonalTask>>({})
  const [saving, setSaving]     = useState(false)

  const isOwn = selectedMember.username === currentUsername

  async function switchMember(m: Member) {
    if (m.username === selectedMember.username) return
    setSelectedMember(m)
    setLoading(true)
    try {
      const res = await fetch(`/api/member-tasks?username=${encodeURIComponent(m.username)}`)
      if (res.ok) {
        const data = await res.json()
        setPersonal(data.personal ?? [])
        setProject(data.projectTasks ?? [])
      }
    } finally { setLoading(false) }
  }

  async function createTask() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/personal-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTitle.trim(), descricao: newDesc, status: newStatus }),
      })
      if (res.ok) {
        const task: PersonalTask = await res.json()
        setPersonal(prev => [...prev, task])
        setNewTitle(''); setNewDesc(''); setNewStatus('todo'); setAdding(false)
      }
    } finally { setCreating(false) }
  }

  async function movePersonal(id: string, status: PersonalTask['status']) {
    setPersonal(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch('/api/personal-tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch('/api/personal-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...editForm }),
      })
      if (res.ok) {
        const updated: PersonalTask = await res.json()
        setPersonal(prev => prev.map(t => t.id === updated.id ? updated : t))
        setEditing(null)
      }
    } finally { setSaving(false) }
  }

  async function deletePersonal(id: string) {
    setPersonal(prev => prev.filter(t => t.id !== id))
    if (editing?.id === id) setEditing(null)
    await fetch('/api/personal-tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  function colPersonal(col: DisplayCol) {
    return personal.filter(t => toCol(t.status) === col)
  }
  function colProject(col: DisplayCol) {
    return project.filter(t => toCol(t.status) === col)
  }

  const total = personal.length + project.length

  return (
    <div>
      {/* Admin: member picker */}
      {isAdmin && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Visualizar membro</p>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const active = m.username === selectedMember.username
              return (
                <button key={m.username} onClick={() => switchMember(m)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-teal-300 hover:text-teal-700'
                  }`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {initials(m.name)}
                  </div>
                  {m.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isOwn ? 'Minhas Tarefas' : `Tarefas — ${selectedMember.name.split(' ')[0]}`}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} tarefa{total !== 1 ? 's' : ''} · {personal.length} pessoal{personal.length !== 1 ? 'is' : ''} · {project.length} de projeto{project.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isOwn && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Adicionar tarefa
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Carregando tarefas…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COLS.map(col => {
            const pers = colPersonal(col.key)
            const proj = colProject(col.key)
            const colTotal = pers.length + proj.length
            return (
              <div key={col.key} className="bg-gray-50 rounded-2xl border border-gray-200 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`}/>
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto text-xs font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{colTotal}</span>
                </div>

                <div className="p-3 space-y-2 flex-1 min-h-24">
                  {/* Project tasks — read only, shows project badge */}
                  {proj.map(task => (
                    <div key={`proj-${task.id}`} className="bg-white rounded-xl border-l-4 border-l-blue-400 border border-gray-200 p-3.5">
                      <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full mb-1.5">
                        {task.projetoNome}
                      </span>
                      <p className={`text-sm font-medium leading-snug ${col.key === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.titulo}
                      </p>
                      {task.descricao && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.descricao}</p>
                      )}
                    </div>
                  ))}

                  {/* Personal tasks — editable */}
                  {pers.map(task => (
                    <div key={`pers-${task.id}`} className="bg-white rounded-xl border-l-4 border-l-teal-400 border border-gray-200 p-3.5 group">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                          Pessoal
                        </span>
                        {(isOwn || isAdmin) && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditing(task); setEditForm({ titulo: task.titulo, descricao: task.descricao ?? '', status: task.status }) }}
                              className="p-1 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors"
                              title="Editar">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => deletePersonal(task.id)}
                              className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                              title="Excluir">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                      <p className={`text-sm font-medium leading-snug ${col.key === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.titulo}
                      </p>
                      {task.descricao && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{task.descricao}</p>
                      )}
                      {/* Move buttons — only for own tasks, not in done column */}
                      {isOwn && col.key !== 'done' && (
                        <div className="flex gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.key === 'todo' && (
                            <button onClick={() => movePersonal(task.id, 'em_andamento')}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
                              Iniciar →
                            </button>
                          )}
                          {col.key === 'em_andamento' && (
                            <>
                              <button onClick={() => movePersonal(task.id, 'todo')}
                                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                                ← Voltar
                              </button>
                              <button onClick={() => movePersonal(task.id, 'concluido')}
                                className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                                Concluir →
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {colTotal === 0 && (
                    <p className="text-xs text-gray-400 text-center py-5">Nenhuma tarefa.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add task modal ─────────────────────────────────────────────────────── */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAdding(false)}/>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nova tarefa pessoal</h3>
              <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="O que precisa ser feito?"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createTask() }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição <span className="font-normal normal-case text-gray-400">(opcional)</span></label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  placeholder="Detalhes…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status inicial</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={newStatus} onChange={e => setNewStatus(e.target.value as PersonalTask['status'])}>
                  <option value="todo">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Cancelar</button>
              <button onClick={createTask} disabled={creating || !newTitle.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                {creating ? 'Criando…' : 'Criar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit personal task modal ─────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)}/>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Editar tarefa</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editForm.titulo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Descrição</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  value={editForm.descricao ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editForm.status ?? editing.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as PersonalTask['status'] }))}>
                  <option value="todo">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => deletePersonal(editing.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Excluir
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Cancelar</button>
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
