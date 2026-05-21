'use client'
import { useState } from 'react'
import type { PublicUser } from '@/lib/types'

const empty = { username: '', password: '', role: 'member' as 'admin' | 'member', name: '', email: '' }

const roleLabels = { admin: 'Administrador', member: 'Membro do Lab' }
const roleBadge = {
  admin: 'bg-amber-100 text-amber-700',
  member: 'bg-blue-100 text-blue-700',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function UsuariosAdmin({ initialData }: { initialData: PublicUser[] }) {
  const [users, setUsers] = useState<PublicUser[]>(initialData)
  const [editing, setEditing] = useState<PublicUser | null>(null)
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openNew() { setEditing(null); setForm(empty); setError(''); setShowForm(true) }
  function openEdit(u: PublicUser) {
    setEditing(u)
    setForm({ username: u.username, password: '', role: u.role, name: u.name, email: u.email || '' })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, id: editing.id }),
        })
        if (!res.ok) { setError((await res.json()).error || 'Erro'); return }
        const updated = await res.json()
        setUsers(users.map(u => u.id === editing.id ? updated : u))
      } else {
        if (!form.password) { setError('Senha obrigatória'); return }
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { setError((await res.json()).error || 'Erro'); return }
        const created = await res.json()
        setUsers([...users, created])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este usuário?')) return
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { alert((await res.json()).error); return }
    setUsers(users.filter(u => u.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Usuários ({users.length})</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie quem pode acessar o painel administrativo.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Editar usuário' : 'Novo usuário'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário (login) *</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                disabled={!!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha {editing ? '(deixe em branco para manter)' : '*'}
              </label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? '••••••••' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value as 'admin' | 'member' })}
              >
                <option value="admin">Administrador — acesso total ao painel</option>
                <option value="member">Membro do Lab — acesso básico</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2">{error}</div>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.name || !form.username}
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

      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials(u.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">@{u.username}</p>
                {u.email && <p className="text-xs text-gray-400">{u.email}</p>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openEdit(u)}
                className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
