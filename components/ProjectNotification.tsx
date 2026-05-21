'use client'
import { useState, useEffect } from 'react'
import type { LabProject } from '@/lib/types'

export default function ProjectNotification() {
  const [pending, setPending] = useState<LabProject[]>([])
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('nghm-proj-notif-dismissed') === '1' } catch { return false }
  })
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects/pending')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setPending(data) })
      .catch(() => {})
  }, [])

  async function respond(projetoId: string, resposta: 'aceito' | 'recusado') {
    setResponding(projetoId)
    try {
      await fetch('/api/project-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projetoId, resposta }),
      })
      setPending(prev => prev.filter(p => p.id !== projetoId))
    } finally {
      setResponding(null)
    }
  }

  if (pending.length === 0 || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-white border-t sm:border border-teal-200 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-teal-50 border-b border-teal-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-teal-900">
            {pending.length === 1
              ? '1 convite de projeto aguardando'
              : `${pending.length} convites de projeto aguardando`}
          </span>
        </div>
        <button
          onClick={() => {
            setDismissed(true)
            try { sessionStorage.setItem('nghm-proj-notif-dismissed', '1') } catch {}
          }}
          className="text-teal-400 hover:text-teal-600 text-xl leading-none w-6 h-6 flex items-center justify-center rounded"
        >
          ×
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {pending.map(p => {
          const isLoading = responding === p.id
          return (
            <div key={p.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  Projeto
                </span>
                {p.anoInicio && <span className="text-xs text-gray-400">{p.anoInicio}</span>}
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{p.titulo}</p>
              {p.descricao && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{p.descricao}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  disabled={isLoading}
                  onClick={() => respond(p.id, 'aceito')}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  {isLoading ? '…' : 'Participar'}
                </button>
                <button
                  disabled={isLoading}
                  onClick={() => respond(p.id, 'recusado')}
                  className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold py-2 rounded-xl border border-red-200 transition-colors"
                >
                  {isLoading ? '…' : 'Recusar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
