'use client'
import { useState } from 'react'
import type { Evento, EventRsvp } from '@/lib/types'

type MemberSummary = { username: string; name: string }
import { catConfig } from '@/app/calendario/CalendarioClient'

type Cat = keyof typeof catConfig

const emptyForm = (): Omit<Evento, 'id'> => ({
  titulo: '',
  data: new Date().toISOString().split('T')[0],
  hora: '',
  descricao: '',
  categoria: 'outro',
  assignedTo: [],
})

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EventosAdmin({ initialData, members }: { initialData: Evento[]; members: MemberSummary[] }) {
  const [eventos, setEventos] = useState<Evento[]>(
    [...initialData].sort((a, b) => a.data.localeCompare(b.data))
  )
  const [editing, setEditing]         = useState<Evento | null>(null)
  const [form, setForm]               = useState<Omit<Evento, 'id'>>(emptyForm())
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [generateLink, setGenerateLink] = useState(false)
  const [newLink, setNewLink]         = useState<string | null>(null)
  const [linkCopied, setLinkCopied]   = useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setGenerateLink(false)
    setNewLink(null)
    setShowForm(true)
    setTimeout(() => document.getElementById('form-titulo')?.focus(), 50)
  }

  function openEdit(e: Evento) {
    setEditing(e)
    setForm({
      titulo: e.titulo,
      data: e.data,
      hora: e.hora ?? '',
      descricao: e.descricao ?? '',
      categoria: e.categoria,
      assignedTo: e.assignedTo ?? [],
    })
    setShowForm(true)
  }

  function toggleMember(username: string) {
    const current = form.assignedTo ?? []
    setForm({
      ...form,
      assignedTo: current.includes(username)
        ? current.filter(u => u !== username)
        : [...current, username],
    })
  }

  async function handleSave() {
    if (!form.titulo || !form.data) return
    setSaving(true)
    setNewLink(null)
    try {
      const body = {
        ...form,
        hora: form.hora || undefined,
        descricao: form.descricao || undefined,
        assignedTo: form.assignedTo ?? [],
      }
      if (editing) {
        const res = await fetch('/api/admin/eventos', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editing.id }),
        })
        const updated = await res.json()
        setEventos(prev => prev.map(e => e.id === editing.id ? updated : e).sort((a, b) => a.data.localeCompare(b.data)))
        setShowForm(false)
      } else {
        const res = await fetch('/api/admin/eventos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const created = await res.json()
        setEventos(prev => [...prev, created].sort((a, b) => a.data.localeCompare(b.data)))
        if (generateLink) {
          const shareRes = await fetch('/api/admin/eventos/share', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventoId: created.id }),
          })
          const shareData = await shareRes.json()
          const url = `${window.location.origin}/rsvp/${shareData.token}`
          setNewLink(url)
          setEventos(prev => prev.map(e => e.id === created.id ? { ...e, share_token: shareData.token } : e))
        } else {
          setShowForm(false)
        }
      }
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta tarefa?')) return
    await fetch('/api/admin/eventos', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  function handleTokenGenerated(id: string, token: string) {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, share_token: token } : e))
  }

  const today    = new Date().toISOString().split('T')[0]
  const proximos = eventos.filter(e => e.data >= today)
  const passados = eventos.filter(e => e.data < today)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Calendário — Tarefas ({eventos.length})</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie tarefas, provas, reuniões e eventos do laboratório.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Nova tarefa
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar tarefa' : 'Nova tarefa'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                id="form-titulo"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Aplicar prova — Turma Medicina"
                value={form.titulo}
                onChange={e => setForm({ ...form, titulo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(catConfig) as [Cat, typeof catConfig[Cat]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, categoria: key })}
                    style={form.categoria === key ? { borderColor: cfg.hex, color: cfg.hex, backgroundColor: cfg.hex + '18' } : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      form.categoria === key
                        ? 'border-current'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.hex }} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário (opcional)</label>
                <input
                  type="time"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.hora}
                  onChange={e => setForm({ ...form, hora: e.target.value })}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Detalhes adicionais sobre a tarefa..."
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            {members.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marcar membros (opcional)
                  <span className="ml-1 text-xs font-normal text-gray-400">— receberão notificação para aceitar ou recusar</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {members.map(m => {
                    const selected = (form.assignedTo ?? []).includes(m.username)
                    return (
                      <button
                        key={m.username}
                        type="button"
                        onClick={() => toggleMember(m.username)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all text-left ${
                          selected
                            ? 'border-teal-400 bg-teal-50 text-teal-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${
                          selected ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300'
                        }`}>
                          {selected && '✓'}
                        </span>
                        <span className="truncate">{m.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {!editing && (
            <div className="md:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={generateLink}
                  onChange={e => setGenerateLink(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Gerar link de confirmação de presença</span>
              </label>
            </div>
          )}

          {newLink && (
            <div className="md:col-span-2 bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-teal-800">Tarefa criada! Compartilhe o link:</p>
              <div className="flex gap-2">
                <input readOnly value={newLink} className="flex-1 text-xs bg-white border border-teal-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none" />
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(newLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                  className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-white border border-teal-200 text-teal-700 hover:bg-teal-50'}`}
                >
                  {linkCopied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-teal-600 hover:underline">Fechar formulário</button>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.titulo || !form.data}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {!newLink && (
              <button
                onClick={() => setShowForm(false)}
                className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {eventos.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-medium">Nenhuma tarefa agendada.</p>
          <p className="text-sm mt-1">Clique em "+ Nova tarefa" para começar.</p>
        </div>
      )}

      {proximos.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Próximas
          </h3>
          <div className="space-y-2">
            {proximos.map(e => <EventoItem key={e.id} e={e} onEdit={openEdit} onDelete={handleDelete} onTokenGenerated={handleTokenGenerated} />)}
          </div>
        </section>
      )}

      {passados.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Passadas
          </h3>
          <div className="space-y-2 opacity-60">
            {passados.reverse().map(e => <EventoItem key={e.id} e={e} onEdit={openEdit} onDelete={handleDelete} onTokenGenerated={handleTokenGenerated} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function EventoItem({
  e, onEdit, onDelete, onTokenGenerated,
}: {
  e: Evento
  onEdit: (e: Evento) => void
  onDelete: (id: string) => void
  onTokenGenerated: (id: string, token: string) => void
}) {
  const cfg = catConfig[e.categoria as Cat]
  const [open, setOpen]       = useState(false)
  const [sharing, setSharing] = useState(false)
  const [token, setToken]     = useState<string | null>(e.share_token ?? null)
  const [rsvps, setRsvps]     = useState<EventRsvp[] | null>(null)
  const [copied, setCopied]   = useState(false)

  function fmtDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  async function generateLink() {
    setSharing(true)
    try {
      const res = await fetch('/api/admin/eventos/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId: e.id }),
      })
      const data = await res.json()
      setToken(data.token)
      onTokenGenerated(e.id, data.token)
      loadRsvps(data.token)
    } finally { setSharing(false) }
  }

  async function loadRsvps(tok?: string) {
    const res = await fetch(`/api/admin/eventos/share?eventoId=${e.id}`)
    if (res.ok) setRsvps(await res.json())
  }

  function handleToggle() {
    if (!open && token && rsvps === null) loadRsvps()
    setOpen(v => !v)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/rsvp/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: cfg?.hex }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{e.titulo}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: (cfg?.hex ?? '#9ca3af') + '18', color: cfg?.hex ?? '#9ca3af' }}>{cfg?.label}</span>
              <span className="text-xs text-gray-400">{fmtDate(e.data)}{e.hora ? ` · ${e.hora}` : ''}</span>
              {e.assignedTo && e.assignedTo.length > 0 && (
                <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {e.assignedTo.length} marcado{e.assignedTo.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {e.descricao && <p className="text-xs text-gray-400 mt-1 truncate">{e.descricao}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleToggle}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${open ? 'bg-gray-100 text-gray-700' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}
          >
            {open ? '▲' : '👥'} Presença
          </button>
          <button onClick={() => onEdit(e)} className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
            Editar
          </button>
          <button onClick={() => onDelete(e.id)} className="text-sm text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
            Remover
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
          {!token ? (
            <button
              onClick={generateLink}
              disabled={sharing}
              className="text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
            >
              {sharing ? 'Gerando...' : '🔗 Gerar link de confirmação de presença'}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Link compartilhável</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/rsvp/${token}`}
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">
                    Confirmações{rsvps !== null ? ` (${rsvps.length})` : ''}
                  </p>
                  <button onClick={() => loadRsvps()} className="text-xs text-blue-600 hover:underline">
                    Atualizar
                  </button>
                </div>
                {rsvps === null ? (
                  <p className="text-sm text-gray-400">Carregando...</p>
                ) : rsvps.length === 0 ? (
                  <p className="text-sm text-gray-400">Nenhuma confirmação ainda.</p>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {rsvps.map(r => (
                      <div key={r.id} className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm font-medium text-gray-800">{r.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.confirmed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
