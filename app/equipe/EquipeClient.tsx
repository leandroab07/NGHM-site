'use client'
import { useState } from 'react'
import type { Membro } from '@/lib/types'

const categoriaLabel: Record<Membro['categoria'], string> = {
  docentes: 'Docentes', posdoc: 'Pós-Doutorado', doutorado: 'Doutorado',
  mestrado: 'Mestrado', graduacao: 'Graduação',
}
const categoriaOrder: Membro['categoria'][] = ['docentes', 'posdoc', 'doutorado', 'mestrado', 'graduacao']

function allEmails(m: Membro): string[] {
  const arr = [...(m.emails ?? [])]
  if (m.email && !arr.includes(m.email)) arr.unshift(m.email)
  return arr.filter(Boolean)
}

type EditForm = {
  foto: string; bio: string; cargo: string
  categoria: Membro['categoria']; lattes: string
  emails: string[]; telefones: string[]
}

function toForm(m: Membro): EditForm {
  return {
    foto:      m.foto      ?? '',
    bio:       m.bio       ?? '',
    cargo:     m.cargo,
    categoria: m.categoria,
    lattes:    m.lattes    ?? '',
    emails:    allEmails(m),
    telefones: m.telefones ?? [],
  }
}

function ArrayField({
  label, values, onChange, placeholder, type = 'text',
}: {
  label: string; values: string[]; placeholder: string
  onChange: (v: string[]) => void; type?: string
}) {
  function update(i: number, val: string) {
    const next = [...values]; next[i] = val; onChange(next)
  }
  function remove(i: number) { onChange(values.filter((_, idx) => idx !== i)) }
  function add() { onChange([...values, '']) }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button type="button" onClick={add}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium">
          + Adicionar
        </button>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              type={type}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={placeholder}
              value={v}
              onChange={e => update(i, e.target.value)}
            />
            <button type="button" onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 px-2 transition-colors text-lg leading-none">
              ×
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <p className="text-xs text-gray-400 italic">Nenhum cadastrado.</p>
        )}
      </div>
    </div>
  )
}

export default function EquipeClient({
  initialEquipe,
  currentUsername,
  isAdmin,
}: {
  initialEquipe: Membro[]
  currentUsername?: string
  isAdmin?: boolean
}) {
  const [equipe, setEquipe] = useState<Membro[]>(initialEquipe)
  const [editTarget, setEditTarget] = useState<Membro | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const grupos = categoriaOrder
    .map(cat => ({ cat, membros: equipe.filter(m => m.categoria === cat) }))
    .filter(g => g.membros.length > 0)

  function openEdit(m: Membro) {
    setEditTarget(m)
    setForm(toForm(m))
    setSaveError(null)
  }

  function closeEdit() { setEditTarget(null); setForm(null); setSaveError(null) }

  async function handleSave() {
    if (!form || !editTarget) return
    setSaving(true)
    setSaveError(null)
    try {
      const isSelf = !isAdmin && !!currentUsername && editTarget.username === currentUsername
      const url    = isSelf ? '/api/equipe/me' : '/api/admin/equipe'
      const payload = isSelf
        ? form
        : { ...form, id: editTarget.id, nome: editTarget.nome, username: editTarget.username }

      const res     = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        setEquipe(prev => prev.map(m => m.id === editTarget.id ? { ...m, ...json } : m))
        closeEdit()
      } else {
        setSaveError(json?.error ?? `Erro ${res.status}`)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {equipe.length === 0 ? (
        <div className="text-center py-24 text-gray-300">
          <svg className="w-16 h-16 mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-400">Nenhum membro cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {grupos.map(({ cat, membros }) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-7">
                <h2 className="text-lg font-bold text-gray-900">{categoriaLabel[cat]}</h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{membros.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {membros.map(m => {
                  const initials   = m.nome.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                  const emails     = allEmails(m)
                  const telefones  = m.telefones ?? []
                  const canEdit    = isAdmin || (!!currentUsername && m.username === currentUsername)

                  return (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col items-center text-center relative">
                      {canEdit && (
                        <button
                          onClick={() => openEdit(m)}
                          title="Editar perfil"
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}

                      {/* Avatar */}
                      <div className="w-20 h-20 rounded-full mb-4 shrink-0 overflow-hidden shadow-sm">
                        {m.foto
                          ? <img src={m.foto} alt={m.nome} className="w-full h-full object-cover" />
                          : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-teal-600 flex items-center justify-center">
                              <span className="text-xl font-bold text-white tracking-wide">{initials}</span>
                            </div>
                          )
                        }
                      </div>

                      <h3 className="font-semibold text-gray-900 leading-snug text-sm">{m.nome}</h3>
                      {m.cargo && <p className="text-xs text-gray-500 mt-1">{m.cargo}</p>}
                      {m.bio && <p className="text-xs text-gray-400 mt-3 leading-relaxed line-clamp-3">{m.bio}</p>}

                      {/* Contatos */}
                      {(emails.length > 0 || telefones.length > 0 || m.lattes) && (
                        <div className="mt-4 w-full space-y-1.5">
                          {emails.map(email => (
                            <a key={email} href={`mailto:${email}`}
                              className="flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg px-3 py-1.5 transition-colors w-full justify-center truncate">
                              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              <span className="truncate">{email}</span>
                            </a>
                          ))}
                          {telefones.map(tel => (
                            <a key={tel} href={`tel:${tel.replace(/\s/g, '')}`}
                              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors w-full justify-center">
                              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              {tel}
                            </a>
                          ))}
                          {m.lattes && (
                            <a href={m.lattes} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg px-3 py-1.5 transition-colors w-full justify-center">
                              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              Lattes
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edição */}
      {editTarget && form && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Editar perfil</h3>
                <p className="text-xs text-gray-400">{editTarget.nome}</p>
              </div>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">×</button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto (URL da imagem)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                  value={form.foto}
                  onChange={e => setForm({ ...form, foto: e.target.value })}
                />
                {form.foto && (
                  <img src={form.foto} alt="preview" className="w-16 h-16 rounded-full object-cover mt-2 border border-gray-200" />
                )}
              </div>

              {/* Cargo + Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.cargo}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                  <select
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value as Membro['categoria'] })}
                  >
                    {(Object.entries(categoriaLabel) as [Membro['categoria'], string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mini-bio</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descreva sua pesquisa..."
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              {/* E-mails */}
              <ArrayField
                label="E-mails"
                values={form.emails}
                placeholder="nome@exemplo.com"
                type="email"
                onChange={emails => setForm({ ...form, emails })}
              />

              {/* Telefones */}
              <ArrayField
                label="Telefones / WhatsApp"
                values={form.telefones}
                placeholder="(27) 99999-9999"
                type="tel"
                onChange={telefones => setForm({ ...form, telefones })}
              />

              {/* Lattes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Lattes</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://lattes.cnpq.br/..."
                  value={form.lattes}
                  onChange={e => setForm({ ...form, lattes: e.target.value })}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {saveError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                >
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </button>
                <button
                  onClick={closeEdit}
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
