'use client'
import { useState } from 'react'
import type { Evento } from '@/lib/types'
import { catConfig } from '@/app/calendario/CalendarioClient'

type Cat = keyof typeof catConfig

const empty: Omit<Evento, 'id'> = {
  titulo: '',
  data: new Date().toISOString().split('T')[0],
  hora: '',
  descricao: '',
  categoria: 'outro',
}

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function EventosAdmin({ initialData }: { initialData: Evento[] }) {
  const [eventos, setEventos] = useState<Evento[]>(
    [...initialData].sort((a, b) => a.data.localeCompare(b.data))
  )
  const [editing, setEditing] = useState<Evento | null>(null)
  const [form, setForm] = useState<Omit<Evento, 'id'>>(empty)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
    setTimeout(() => document.getElementById('form-titulo')?.focus(), 50)
  }

  function openEdit(e: Evento) {
    setEditing(e)
    setForm({ titulo: e.titulo, data: e.data, hora: e.hora ?? '', descricao: e.descricao ?? '', categoria: e.categoria })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titulo || !form.data) return
    setSaving(true)
    try {
      const body = { ...form, hora: form.hora || undefined, descricao: form.descricao || undefined }
      if (editing) {
        const res = await fetch('/api/admin/eventos', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, id: editing.id }),
        })
        const updated = await res.json()
        setEventos(prev => prev.map(e => e.id === editing.id ? updated : e).sort((a, b) => a.data.localeCompare(b.data)))
      } else {
        const res = await fetch('/api/admin/eventos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const created = await res.json()
        setEventos(prev => [...prev, created].sort((a, b) => a.data.localeCompare(b.data)))
      }
      setShowForm(false)
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

  const today = new Date().toISOString().split('T')[0]
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                      form.categoria === key
                        ? `${cfg.light} border-current`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
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
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.titulo || !form.data}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
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
            {proximos.map(e => <EventoItem key={e.id} e={e} onEdit={openEdit} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {passados.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Passadas
          </h3>
          <div className="space-y-2 opacity-60">
            {passados.reverse().map(e => <EventoItem key={e.id} e={e} onEdit={openEdit} onDelete={handleDelete} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function EventoItem({ e, onEdit, onDelete }: { e: Evento; onEdit: (e: Evento) => void; onDelete: (id: string) => void }) {
  const cfg = catConfig[e.categoria as Cat]
  function fmtDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-1 self-stretch rounded-full ${cfg?.color}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{e.titulo}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg?.light}`}>{cfg?.label}</span>
            <span className="text-xs text-gray-400">{fmtDate(e.data)}{e.hora ? ` · ${e.hora}` : ''}</span>
          </div>
          {e.descricao && <p className="text-xs text-gray-400 mt-1 truncate">{e.descricao}</p>}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button onClick={() => onEdit(e)} className="text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
          Editar
        </button>
        <button onClick={() => onDelete(e.id)} className="text-sm text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
          Remover
        </button>
      </div>
    </div>
  )
}
