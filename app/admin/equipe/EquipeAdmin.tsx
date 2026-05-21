'use client'
import { useState } from 'react'
import type { Membro } from '@/lib/types'

const empty: Omit<Membro, 'id'> = {
  nome: '', cargo: '', categoria: 'graduacao', lattes: '', email: '', bio: '',
}

const categoriaLabels: Record<Membro['categoria'], string> = {
  docentes: 'Docentes', posdoc: 'Pós-Doutorado', doutorado: 'Doutorado',
  mestrado: 'Mestrado', graduacao: 'Graduação',
}

export default function EquipeAdmin({ initialData }: { initialData: Membro[] }) {
  const [membros, setMembros] = useState<Membro[]>(initialData)
  const [editing, setEditing] = useState<Membro | null>(null)
  const [form, setForm] = useState<Omit<Membro, 'id'>>(empty)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  function openEdit(m: Membro) {
    setEditing(m)
    setForm({ nome: m.nome, cargo: m.cargo, categoria: m.categoria, lattes: m.lattes || '', email: m.email || '', bio: m.bio || '' })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/admin/equipe', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) })
        const updated = await res.json()
        setMembros(membros.map(m => m.id === editing.id ? updated : m))
      } else {
        const res = await fetch('/api/admin/equipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const created = await res.json()
        setMembros([...membros, created])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este membro?')) return
    await fetch('/api/admin/equipe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setMembros(membros.filter(m => m.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Equipe ({membros.length})</h2>
        <button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          + Adicionar membro
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar membro' : 'Novo membro'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Membro['categoria'] })}>
                {(Object.entries(categoriaLabels)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Lattes</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.lattes} onChange={e => setForm({ ...form, lattes: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mini-bio</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving || !form.nome || !form.cargo} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {membros.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">👥</div>
            <p>Nenhum membro cadastrado.</p>
          </div>
        )}
        {membros.map(m => (
          <div key={m.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{m.nome}</p>
              <p className="text-sm text-gray-500">{m.cargo} · {categoriaLabels[m.categoria]}</p>
              {m.email && <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(m)} className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                Editar
              </button>
              <button onClick={() => handleDelete(m.id)} className="text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
