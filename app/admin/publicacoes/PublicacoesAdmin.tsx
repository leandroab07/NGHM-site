'use client'
import { useState } from 'react'
import type { Publicacao } from '@/lib/types'

const empty: Omit<Publicacao, 'id'> = {
  titulo: '', autores: '', revista: '', ano: new Date().getFullYear(), doi: '', resumo: '', categoria: 'artigo',
}

const catLabels: Record<Publicacao['categoria'], string> = {
  artigo: 'Artigo', tese: 'Tese', dissertacao: 'Dissertação', livro: 'Livro', capitulo: 'Capítulo de Livro',
}

export default function PublicacoesAdmin({ initialData }: { initialData: Publicacao[] }) {
  const [items, setItems] = useState<Publicacao[]>(initialData)
  const [editing, setEditing] = useState<Publicacao | null>(null)
  const [form, setForm] = useState<Omit<Publicacao, 'id'>>(empty)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(null); setForm(empty); setShowForm(true) }
  function openEdit(p: Publicacao) {
    setEditing(p)
    setForm({ titulo: p.titulo, autores: p.autores, revista: p.revista, ano: p.ano, doi: p.doi || '', resumo: p.resumo || '', categoria: p.categoria })
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/admin/publicacoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editing.id }) })
        const updated = await res.json()
        setItems(items.map(i => i.id === editing.id ? updated : i))
      } else {
        const res = await fetch('/api/admin/publicacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        const created = await res.json()
        setItems([...items, created])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta publicação?')) return
    await fetch('/api/admin/publicacoes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Publicações ({items.length})</h2>
        <button onClick={openNew} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          + Adicionar publicação
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-purple-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar publicação' : 'Nova publicação'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Autores *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Sobrenome A, Sobrenome B, ..." value={form.autores} onChange={e => setForm({ ...form, autores: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revista / Instituição *</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.revista} onChange={e => setForm({ ...form, revista: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as Publicacao['categoria'] })}>
                {Object.entries(catLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano *</label>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" value={form.ano} onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
              <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="10.xxxx/..." value={form.doi} onChange={e => setForm({ ...form, doi: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumo</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" value={form.resumo} onChange={e => setForm({ ...form, resumo: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving || !form.titulo || !form.autores} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
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
            <div className="text-4xl mb-3">📄</div>
            <p>Nenhuma publicação cadastrada.</p>
          </div>
        )}
        {items.sort((a, b) => b.ano - a.ano).map(p => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{catLabels[p.categoria]}</span>
                <span className="text-xs text-gray-400">{p.ano}</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm line-clamp-2">{p.titulo}</p>
              <p className="text-xs text-gray-500 mt-0.5">{p.autores}</p>
              <p className="text-xs text-purple-600 mt-0.5">{p.revista}</p>
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
