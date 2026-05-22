'use client'
import { useState } from 'react'

export default function RsvpForm({ token, eventoId: _ }: { token: string; eventoId: string }) {
  const [name, setName]       = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setStatus('loading')
    setError('')
    try {
      const res = await fetch(`/api/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Erro ao confirmar presença')
        setStatus('error')
      } else {
        setStatus('done')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900">Presença confirmada!</p>
        <p className="text-sm text-gray-500 mt-1">Obrigado, <span className="font-medium">{name}</span>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome completo</label>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex: Maria Silva"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          disabled={status === 'loading'}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!name.trim() || status === 'loading'}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {status === 'loading' ? 'Confirmando...' : 'Confirmar presença'}
      </button>
    </form>
  )
}
