'use client'
import { useState, useEffect } from 'react'
import type { PersonalTask, ProjectTask } from '@/lib/types'

type Member = { username: string; name: string }
type ProjectEntry = ProjectTask & { projetoNome: string }
type DisplayCol = 'todo' | 'em_andamento' | 'done'

function toCol(status: string): DisplayCol {
  if (status === 'todo') return 'todo'
  if (status === 'em_andamento') return 'em_andamento'
  return 'done'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const SECTIONS: { key: DisplayCol; label: string }[] = [
  { key: 'todo',         label: 'A Fazer'      },
  { key: 'em_andamento', label: 'Em Andamento'  },
  { key: 'done',         label: 'Concluídas'    },
]

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
  )
}

function StatusDot({ col }: { col: DisplayCol }) {
  if (col === 'done') return (
    <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0">
      <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  )
  if (col === 'em_andamento') return (
    <div className="w-4 h-4 rounded-full border border-blue-400 bg-blue-50 shrink-0"/>
  )
  return <div className="w-4 h-4 rounded-full border border-gray-300 bg-white shrink-0"/>
}

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
  initialProjectTasks: ProjectEntry[]
}) {
  const [selectedMember, setSelectedMember] = useState<Member>({ username: currentUsername, name: currentName })
  const [personal, setPersonal]             = useState<PersonalTask[]>(initialPersonalTasks)
  const [project, setProject]               = useState<ProjectEntry[]>(initialProjectTasks)
  const [loading, setLoading]               = useState(false)
  const [dismissed, setDismissed]           = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`nghm-hidden-ptasks-${currentUsername}`)
      if (raw) setDismissed(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [currentUsername])

  function dismissProject(id: string) {
    const next = new Set([...dismissed, id])
    setDismissed(next)
    try { localStorage.setItem(`nghm-hidden-ptasks-${currentUsername}`, JSON.stringify([...next])) } catch {}
  }

  const [adding, setAdding]           = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [newStatus, setNewStatus]     = useState<PersonalTask['status']>('todo')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editing, setEditing]     = useState<PersonalTask | null>(null)
  const [editForm, setEditForm]   = useState<Partial<PersonalTask>>({})
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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
    setCreating(true); setCreateError(null)
    try {
      const res = await fetch('/api/personal-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTitle.trim(), descricao: newDesc, status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        setPersonal(prev => [...prev, data as PersonalTask])
        setNewTitle(''); setNewDesc(''); setNewStatus('todo'); setAdding(false)
      } else {
        setCreateError(data?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setCreateError('Falha na conexão. Verifique se a tabela personal_tasks existe no Supabase.')
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

  async function deletePersonal(id: string) {
    setPersonal(prev => prev.filter(t => t.id !== id))
    if (editing?.id === id) setEditing(null)
    await fetch('/api/personal-tasks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/personal-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...editForm }),
      })
      const data = await res.json()
      if (res.ok) {
        setPersonal(prev => prev.map(t => t.id === data.id ? data : t))
        setEditing(null)
      } else {
        setSaveError(data?.error ?? `Erro ${res.status}`)
      }
    } catch {
      setSaveError('Falha na conexão.')
    } finally { setSaving(false) }
  }

  const visibleProject = project.filter(t => !dismissed.has(t.id))
  const total = personal.length + visibleProject.length

  return (
    <div className="space-y-6">
      {/* Admin: member picker */}
      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Membro</p>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const active = m.username === selectedMember.username
              return (
                <button key={m.username} onClick={() => switchMember(m)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    active ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}>
                  <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                    {active ? <span className="text-white">{initials(m.name)}</span> : initials(m.name)}
                  </div>
                  {m.name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isOwn ? 'Minhas Tarefas' : `Tarefas — ${selectedMember.name.split(' ')[0]}`}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} {total !== 1 ? 'itens' : 'item'}
          </p>
        </div>
        {isOwn && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Adicionar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Carregando…
        </div>
      ) : total === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-14 text-center">
          <p className="text-sm text-gray-400">Nenhuma tarefa registrada.</p>
          {isOwn && (
            <button onClick={() => setAdding(true)} className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors">
              Adicionar tarefa
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {SECTIONS.map(sec => {
            const persInSec = personal.filter(t => toCol(t.status) === sec.key)
            const projInSec = visibleProject.filter(t => toCol(t.status) === sec.key)
            const secTotal  = persInSec.length + projInSec.length

            return (
              <div key={sec.key}>
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{sec.label}</span>
                  <span className="text-xs text-gray-400">({secTotal})</span>
                </div>

                {secTotal === 0 ? (
                  <div className="px-5 py-3 text-sm text-gray-400">—</div>
                ) : (
                  <>
                    {/* Project task rows */}
                    {projInSec.map(task => (
                      <div key={`proj-${task.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0">
                        <StatusDot col={sec.key}/>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${sec.key === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.titulo}
                          </p>
                          {task.descricao && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.descricao}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 max-w-[140px] truncate">{task.projetoNome}</span>
                        <button
                          onClick={() => dismissProject(task.id)}
                          title="Remover da lista"
                          className="shrink-0 text-red-400 hover:text-red-600 transition-colors p-1 rounded">
                          <TrashIcon/>
                        </button>
                      </div>
                    ))}

                    {/* Personal task rows */}
                    {persInSec.map(task => (
                      <div key={`pers-${task.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors border-t border-gray-100 first:border-t-0">
                        {/* Clickable dot cycles status for own tasks */}
                        {isOwn ? (
                          <button
                            title={sec.key === 'todo' ? 'Iniciar' : sec.key === 'em_andamento' ? 'Concluir' : 'Reabrir'}
                            onClick={() => movePersonal(task.id, sec.key === 'todo' ? 'em_andamento' : sec.key === 'em_andamento' ? 'concluido' : 'todo')}
                            className="shrink-0 hover:opacity-70 transition-opacity">
                            <StatusDot col={sec.key}/>
                          </button>
                        ) : (
                          <StatusDot col={sec.key}/>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${sec.key === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.titulo}
                          </p>
                          {task.descricao && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.descricao}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">Pessoal</span>
                        {(isOwn || isAdmin) && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => { setEditing(task); setEditForm({ titulo: task.titulo, descricao: task.descricao ?? '', status: task.status }) }}
                              title="Editar"
                              className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded">
                              <PencilIcon/>
                            </button>
                            <button
                              onClick={() => deletePersonal(task.id)}
                              title="Excluir"
                              className="text-red-400 hover:text-red-600 transition-colors p-1 rounded">
                              <TrashIcon/>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add task modal ────────────────────────────────────────────────── */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAdding(false); setCreateError(null) }}/>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nova tarefa pessoal</h3>
              <button onClick={() => { setAdding(false); setCreateError(null) }} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input autoFocus
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  placeholder="Descrição da tarefa"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createTask() }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Observação <span className="font-normal normal-case text-gray-400">(opcional)</span>
                </label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  value={newStatus} onChange={e => setNewStatus(e.target.value as PersonalTask['status'])}>
                  <option value="todo">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                </select>
              </div>
              {createError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{createError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => { setAdding(false); setCreateError(null) }} className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancelar</button>
              <button onClick={createTask} disabled={creating || !newTitle.trim()}
                className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                {creating ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(null)}/>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Editar tarefa</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-xl">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  value={editForm.titulo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Observação</label>
                <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                  value={editForm.descricao ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  value={editForm.status ?? editing.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value as PersonalTask['status'] }))}>
                  <option value="todo">A Fazer</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluido">Concluída</option>
                </select>
              </div>
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{saveError}</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => deletePersonal(editing.id)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
                <TrashIcon/>
                Excluir
              </button>
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="text-sm text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancelar</button>
                <button onClick={saveEdit} disabled={saving}
                  className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
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
