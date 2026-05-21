'use client'
import { useState } from 'react'
import type { LabProject, ProjectResponse } from '@/lib/types'

type MemberSummary = { username: string; name: string }

const emptyForm = (): Omit<LabProject, 'id' | 'createdBy' | 'created_at'> => ({
  titulo: '',
  descricao: '',
  status: 'em_andamento',
  visibility: 'all',
  assignedTo: [],
  anoInicio: new Date().getFullYear(),
})

export default function LabProjetosAdmin({
  initialData,
  members,
}: {
  initialData: LabProject[]
  members: MemberSummary[]
}) {
  const [projetos, setProjetos] = useState<LabProject[]>(initialData)
  const [form, setForm] = useState<Omit<LabProject, 'id' | 'createdBy' | 'created_at'>>(emptyForm())
  const [editing, setEditing] = useState<LabProject | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<{ project: LabProject; responses: ProjectResponse[] } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
    setDetail(null)
  }

  function openEdit(p: LabProject) {
    setEditing(p)
    setForm({
      titulo: p.titulo,
      descricao: p.descricao ?? '',
      status: p.status,
      visibility: p.visibility,
      assignedTo: p.assignedTo ?? [],
      anoInicio: p.anoInicio,
    })
    setShowForm(true)
    setDetail(null)
  }

  function toggleMember(username: string) {
    const cur = form.assignedTo ?? []
    setForm({
      ...form,
      assignedTo: cur.includes(username) ? cur.filter(u => u !== username) : [...cur, username],
    })
  }

  async function openDetail(p: LabProject) {
    setShowForm(false)
    setDetail(null)
    setLoadingDetail(true)
    const res = await fetch(`/api/project-responses?projetoId=${p.id}`)
    const responses: ProjectResponse[] = res.ok ? await res.json() : []
    setDetail({ project: p, responses })
    setLoadingDetail(false)
  }

  async function handleSave() {
    if (!form.titulo) return
    setSaving(true)
    try {
      const body = { ...form, assignedTo: form.assignedTo ?? [] }
      if (editing) {
        const res = await fetch('/api/admin/lab-projetos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editing.id }),
        })
        const updated = await res.json()
        setProjetos(prev => prev.map(p => p.id === editing.id ? updated : p))
      } else {
        const res = await fetch('/api/admin/lab-projetos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const created = await res.json()
        setProjetos(prev => [created, ...prev])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este projeto e todas as respostas?')) return
    await fetch('/api/admin/lab-projetos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setProjetos(prev => prev.filter(p => p.id !== id))
    if (detail?.project.id === id) setDetail(null)
  }

  const statusBadge = (s: string) => s === 'em_andamento'
    ? 'bg-green-100 text-green-700'
    : 'bg-gray-100 text-gray-500'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projetos Internos ({projetos.length})</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie projetos de equipe com controle de visibilidade e membros.</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          + Novo projeto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar projeto' : 'Novo projeto'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do projeto"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Descreva o projeto..."
                value={form.descricao ?? ''}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value as LabProject['status'] })}
                >
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano de início</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.anoInicio ?? ''}
                  onChange={e => setForm({ ...form, anoInicio: Number(e.target.value) || undefined })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.visibility}
                  onChange={e => setForm({ ...form, visibility: e.target.value as LabProject['visibility'] })}
                >
                  <option value="all">Todos os membros</option>
                  <option value="assigned">Só marcados e aceitos</option>
                </select>
              </div>
            </div>

            {/* Seleção de membros */}
            {members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membros atribuídos
                  {form.visibility === 'assigned' && (
                    <span className="ml-2 text-xs text-amber-600 font-normal">
                      — só membros marcados e que aceitarem verão este projeto
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {members.map(m => {
                    const checked = (form.assignedTo ?? []).includes(m.username)
                    return (
                      <button
                        key={m.username}
                        type="button"
                        onClick={() => toggleMember(m.username)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                          checked
                            ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !form.titulo}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
                {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar projeto'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista + Detalhe */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 space-y-3">
          {projetos.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
              Nenhum projeto interno criado ainda.
            </div>
          )}
          {projetos.map(p => (
            <div key={p.id}
              className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer ${
                detail?.project.id === p.id ? 'border-blue-300 shadow-sm' : 'border-gray-200'
              }`}
              onClick={() => openDetail(p)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                      {p.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.visibility === 'all'
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {p.visibility === 'all' ? 'Todos os membros' : 'Só marcados'}
                    </span>
                    {p.anoInicio && <span className="text-xs text-gray-400">{p.anoInicio}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.titulo}</h3>
                  {p.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.descricao}</p>}
                  {p.assignedTo?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{p.assignedTo.length} membro(s) atribuído(s)</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={e => { e.stopPropagation(); openEdit(p) }}
                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                    Editar
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg border border-red-100 hover:bg-red-50 transition-colors">
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Painel de detalhe */}
        {(detail || loadingDetail) && (
          <div className="lg:w-80 bg-white border border-gray-200 rounded-xl p-5 h-fit lg:sticky lg:top-6">
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-400 text-sm">Carregando…</div>
            ) : detail ? (
              <>
                <h4 className="font-bold text-gray-900 mb-1 text-sm">{detail.project.titulo}</h4>
                <p className="text-xs text-gray-500 mb-4">Respostas dos membros atribuídos</p>

                {(detail.project.assignedTo ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum membro atribuído.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.project.assignedTo.map(username => {
                      const resp = detail.responses.find(r => r.username === username)
                      const member = members.find(m => m.username === username)
                      return (
                        <li key={username} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-700 truncate">{member?.name ?? username}</span>
                          {resp ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              resp.resposta === 'aceito'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {resp.resposta === 'aceito' ? 'Aceitou' : 'Recusou'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Pendente</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
