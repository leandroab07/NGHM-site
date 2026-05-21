'use client'
import { useState, useEffect } from 'react'
import type { Evento } from '@/lib/types'
import { catConfig } from '@/app/calendario/CalendarioClient'

type Cat = keyof typeof catConfig

export default function TaskNotification() {
  const [pending, setPending] = useState<Evento[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/tasks/pending')
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setPending(data) })
      .catch(() => {})
  }, [])

  async function respond(eventoId: string, resposta: 'aceito' | 'recusado') {
    setResponding(eventoId)
    try {
      await fetch('/api/task-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventoId, resposta }),
      })
      setPending(prev => prev.filter(e => e.id !== eventoId))
    } finally {
      setResponding(null)
    }
  }

  if (pending.length === 0 || dismissed) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-white border-t sm:border border-blue-200 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-blue-900">
            {pending.length === 1 ? '1 tarefa aguardando sua resposta' : `${pending.length} tarefas aguardando resposta`}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 text-xl leading-none w-6 h-6 flex items-center justify-center rounded"
        >
          ×
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {pending.map(e => {
          const cfg = catConfig[e.categoria as Cat]
          const hex = cfg?.hex ?? '#9ca3af'
          const isLoading = responding === e.id
          return (
            <div key={e.id} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: hex }}
                >
                  {cfg?.label}
                </span>
                {e.hora && <span className="text-xs text-gray-400">{e.hora}</span>}
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{e.titulo}</p>
              <p className="text-xs text-gray-400 mb-3">
                {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              {e.descricao && (
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{e.descricao}</p>
              )}
              <div className="flex gap-2">
                <button
                  disabled={isLoading}
                  onClick={() => respond(e.id, 'aceito')}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
                >
                  {isLoading ? '...' : 'Aceitar'}
                </button>
                <button
                  disabled={isLoading}
                  onClick={() => respond(e.id, 'recusado')}
                  className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-sm font-semibold py-2 rounded-xl border border-red-200 transition-colors"
                >
                  {isLoading ? '...' : 'Recusar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
