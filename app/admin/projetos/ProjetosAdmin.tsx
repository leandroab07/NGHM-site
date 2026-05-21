'use client'
import { useState } from 'react'
import type { Projeto } from '@/lib/types'

const empty: Omit<Projeto, 'id'> = {
  titulo: '', descricao: '', status: 'em_andamento',
  anoInicio: new Date().getFullYear(), anoFim: undefined,
  financiamento: '', pesquisadores: [],
}

export default function ProjetosAdmin({ initialData }: { initialData: Projeto[] }) {
  const [items, setItems] = useState<Projeto[]>(initialData)
  const [editing, setEditing] = useState<Projeto | null>(null)
  const [form, setForm] = useState<Omit<Projeto, 'id'>>(empty)
  const [pesquisadoresStr, setPesquisadoresStr] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null); setForm(empty); setPesquisadoresStr(''); setShowForm(true)
  }
  function openEdit(p: Projeto) {
    setEditing(p)
    setForm({ titulo: p.titulo, descricao: p.descricao, status: p.status, anoInicio: p.anoInicio, anoFim: p.anoFim, financiamento: p.financiamento || '', pesquisadores: p.pesquisadores || [] })
    setPesquisadoresStr((p.pesquisadores || []).join('\n'))
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = { ...form, pesquisadores: pesquisadoresStr.split('\n').map(s => s.trim()).filter(Boolean) }
    try {
      if (editing) {
        const res = await fetch('/api/admin/projetos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editing.id }) })
        const updated = await res.json()
        setItems(items.map(i => i.id === editing.id ? updated : i))
      } else {
        const res = await fetch('/api/admin/projetos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const created = await res.json()
        setItems([...items, created])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este projeto?')) return
    await fetch('/api/admin/projetos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Projetos ({items.length})</h2>
        <button onClick={openNew} className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          + Novo projeto
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-amber-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar projeto' : 'Novo projeto'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Projeto['status'] })}>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Financiamento</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.financiamento} onChange={e => setForm({ ...form, financiamento: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano de início *</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.anoInicio} onChange={e => setForm({ ...form, anoInicio: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano de término</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" value={form.anoFim || ''} onChange={e => setForm({ ...form, anoFim: e.target.value ? Number(e.target.value) : undefined })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisadores (um por linha)</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" value={pesquisadoresStr} onChange={e => setPesquisadoresStr(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving || !form.titulo || !form.descricao} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">🔭</div>
            <p>Nenhum projeto cadastrado.</p>
          </div>
        )}
        {items.map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'em_andamento' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {p.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                </span>
                <span className="text-xs text-gray-400">{p.anoInicio}{p.anoFim ? ` — ${p.anoFim}` : ''}</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.titulo}</p>
              {p.financiamento && <p className="text-xs text-gray-400 mt-0.5">{p.financiamento}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(p)} className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                Editar
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
