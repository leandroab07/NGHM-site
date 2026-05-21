'use client'
import { useState, useEffect } from 'react'
import type { Evento, TaskResponse } from '@/lib/types'

const WEEKDAYS_LONG  = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const WEEKDAYS_SHORT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const catConfig = {
  prova:   { label: 'Prova / Avaliação', color: 'bg-red-500',    light: 'bg-red-50 text-red-700 border-red-200',      hex: '#ef4444' },
  reuniao: { label: 'Reunião',           color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700 border-blue-200',    hex: '#3b82f6' },
  prazo:   { label: 'Prazo / Entrega',   color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700 border-amber-200', hex: '#f59e0b' },
  aula:    { label: 'Aula',              color: 'bg-green-500',  light: 'bg-green-50 text-green-700 border-green-200', hex: '#22c55e' },
  evento:  { label: 'Evento',            color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200', hex: '#a855f7' },
  outro:   { label: 'Outro',             color: 'bg-gray-400',   light: 'bg-gray-50 text-gray-700 border-gray-200',    hex: '#9ca3af' },
} as const

type Cat = keyof typeof catConfig
type Holiday = { date: string; name: string }

const COL7 = { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' } as const

// ── Meus compromissos ──────────────────────────────────────────────────────

function MeusCompromissos({ eventos, currentUsername }: { eventos: Evento[]; currentUsername: string }) {
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null)
  const [selectedMode, setSelectedMode]     = useState<'criada' | 'aceita'>('criada')
  const [responses, setResponses]           = useState<TaskResponse[]>([])
  const [acceptedIds, setAcceptedIds]       = useState<Set<string>>(new Set())
  const [loadingId, setLoadingId]           = useState<string | null>(null)
  const [loadingMine, setLoadingMine]       = useState(true)

  useEffect(() => {
    fetch('/api/task-responses?mine=true')
      .then(r => r.ok ? r.json() : [])
      .then((data: TaskResponse[]) => {
        if (!Array.isArray(data)) return
        setAcceptedIds(new Set(
          data.filter(r => r.resposta === 'aceito').map(r => r.eventoId)
        ))
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false))
  }, [])

  const criadas  = eventos.filter(e => e.createdBy === currentUsername).sort((a, b) => a.data.localeCompare(b.data))
  const aceitas  = eventos.filter(e => acceptedIds.has(e.id)).sort((a, b) => a.data.localeCompare(b.data))
  const total    = criadas.length + aceitas.length

  async function openTask(e: Evento, mode: 'criada' | 'aceita') {
    setSelectedEvento(e)
    setSelectedMode(mode)
    setLoadingId(e.id)
    try {
      const res = await fetch(`/api/task-responses?eventoId=${e.id}`)
      const data = res.ok ? await res.json() : []
      setResponses(Array.isArray(data) ? data : [])
    } finally { setLoadingId(null) }
  }

  function fmtDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  function TaskCard({ e, mode }: { e: Evento; mode: 'criada' | 'aceita' }) {
    const cfg        = catConfig[e.categoria as Cat]
    const hex        = cfg?.hex ?? '#9ca3af'
    const isSelected = selectedEvento?.id === e.id
    return (
      <button
        onClick={() => openTask(e, mode)}
        className={`w-full text-left bg-white border rounded-2xl p-4 transition-all hover:shadow-md ${
          isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div style={{ width: 4, backgroundColor: hex, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: hex }}>
                {cfg?.label}
              </span>
              {mode === 'aceita' && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Aceita</span>
              )}
              {e.hora && <span className="text-xs text-gray-400">{e.hora}</span>}
              {loadingId === e.id && <span className="text-xs text-blue-400 animate-pulse">carregando...</span>}
            </div>
            <p className="font-bold text-gray-900">{e.titulo}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
            {e.descricao && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{e.descricao}</p>}
            {mode === 'criada' && (e.assignedTo ?? []).length > 0 && (
              <p className="text-xs text-teal-600 mt-1">
                {e.assignedTo!.length} membro{e.assignedTo!.length > 1 ? 's' : ''} marcado{e.assignedTo!.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <span className="text-gray-300 text-xl leading-none self-center shrink-0">›</span>
        </div>
      </button>
    )
  }

  const assigned     = selectedEvento?.assignedTo ?? []
  const accepted     = responses.filter(r => r.resposta === 'aceito')
  const declined     = responses.filter(r => r.resposta === 'recusado')
  const respondedSet = new Set(responses.map(r => r.username))
  const pending      = assigned.filter(u => !respondedSet.has(u))

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Lista */}
      <div className="w-full md:flex-1 min-w-0">
        {loadingMine ? (
          <div className="text-center py-16 text-gray-400">
            <p className="animate-pulse">Carregando...</p>
          </div>
        ) : total === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-4">📋</div>
            <p className="font-semibold text-gray-500 text-lg">Nenhum compromisso ainda.</p>
            <p className="text-gray-400 text-sm mt-1">Suas tarefas criadas e aceitas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {criadas.length > 0 && (
              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> Tarefas que criei ({criadas.length})
                </p>
                <div className="space-y-3">
                  {criadas.map(e => <TaskCard key={e.id} e={e} mode="criada" />)}
                </div>
              </section>
            )}
            {aceitas.length > 0 && (
              <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" /> Tarefas que aceitei ({aceitas.length})
                </p>
                <div className="space-y-3">
                  {aceitas.map(e => <TaskCard key={e.id} e={e} mode="aceita" />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Painel de detalhe */}
      <div className="w-full md:w-80 shrink-0">
        {selectedEvento ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4" style={{ backgroundColor: catConfig[selectedEvento.categoria as Cat]?.hex ?? '#9ca3af' }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                    {catConfig[selectedEvento.categoria as Cat]?.label}
                  </p>
                  <h3 className="font-bold text-white text-base leading-snug">{selectedEvento.titulo}</h3>
                  <p className="text-xs text-white/80 mt-1 capitalize">{fmtDate(selectedEvento.data)}</p>
                  {selectedEvento.hora && <p className="text-xs text-white/70 mt-0.5">{selectedEvento.hora}</p>}
                </div>
                <button
                  onClick={() => setSelectedEvento(null)}
                  className="text-white/70 hover:text-white w-6 h-6 flex items-center justify-center rounded text-lg leading-none shrink-0"
                >×</button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {selectedEvento.descricao && (
                <p className="text-sm text-gray-600 leading-relaxed">{selectedEvento.descricao}</p>
              )}

              {/* Tarefa aceita pelo usuário — mostra só detalhes */}
              {selectedMode === 'aceita' && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <span className="text-green-500 text-sm">✓</span>
                  <span className="text-sm font-semibold text-green-700">Você aceitou esta tarefa</span>
                </div>
              )}

              {/* Tarefa criada — mostra respostas dos membros */}
              {selectedMode === 'criada' && (
                <>
                  {assigned.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum membro marcado nesta tarefa.</p>
                  ) : (
                    <>
                      {accepted.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">✓ Aceitaram ({accepted.length})</p>
                          <ul className="space-y-1">
                            {accepted.map(r => (
                              <li key={r.username} className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />{r.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {declined.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">✕ Recusaram ({declined.length})</p>
                          <ul className="space-y-1">
                            {declined.map(r => (
                              <li key={r.username} className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />{r.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {pending.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">⏳ Aguardando ({pending.length})</p>
                          <ul className="space-y-1">
                            {pending.map(u => (
                              <li key={u} className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0" />@{u}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">Clique em uma tarefa para ver os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CalendarioClient({
  eventos: initialEventos,
  currentUsername,
}: {
  eventos: Evento[]
  currentUsername?: string
}) {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [tab,         setTab]         = useState<'calendario' | 'compromissos'>('calendario')
  const [current,     setCurrent]     = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [holidays,    setHolidays]    = useState<Record<string, string>>({})
  const [eventos]                     = useState<Evento[]>(initialEventos)

  const year  = current.getFullYear()
  const month = current.getMonth()

  useEffect(() => {
    async function fetchHolidays(y: number) {
      if (Object.keys(holidays).some(k => k.startsWith(`${y}-`))) return
      try {
        const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`)
        if (!res.ok) return
        const data: Holiday[] = await res.json()
        setHolidays(prev => {
          const next = { ...prev }
          data.forEach(h => { next[h.date] = h.name })
          return next
        })
      } catch { /* API indisponível */ }
    }
    fetchHolidays(year)
    if (month === 11) fetchHolidays(year + 1)
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth  = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  function dateKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const eventsForDay = (d: number) => eventos.filter(e => e.data === dateKey(d))
  const isToday      = (d: number) => dateKey(d) === todayStr

  const selEvents  = selectedDay ? eventos.filter(e => e.data === selectedDay) : []
  const selHoliday = selectedDay ? holidays[selectedDay] : null

  const upcoming = eventos
    .filter(e => e.data >= todayStr)
    .sort((a, b) => a.data.localeCompare(b.data) || (a.hora ?? '').localeCompare(b.hora ?? ''))
    .slice(0, 8)

  function fmtDay(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  function fmtShort(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div>
      {/* Tabs */}
      {!!currentUsername && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setTab('calendario')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'calendario' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Calendário
          </button>
          <button
            onClick={() => setTab('compromissos')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'compromissos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Meus compromissos
          </button>
        </div>
      )}

      {/* Meus compromissos */}
      {tab === 'compromissos' && currentUsername && (
        <MeusCompromissos eventos={eventos} currentUsername={currentUsername} />
      )}

      {/* Calendário */}
      {tab === 'calendario' && (
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ── Grid do calendário ─────────────────────────────────── */}
          <div className="w-full md:flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Navegação */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <button
                onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null) }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-500 transition-colors font-bold text-xl"
              >‹</button>
              <h2 className="flex-1 text-center text-base font-bold text-gray-900">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null) }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-500 transition-colors font-bold text-xl"
              >›</button>
              <button
                onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr) }}
                className="ml-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >Hoje</button>
            </div>

            {/* Cabeçalho dias da semana */}
            <div style={COL7} className="border-b border-gray-200 bg-gray-50">
              {WEEKDAYS_LONG.map((d, i) => (
                <div key={d} className={`py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${i >= 5 ? 'text-rose-400' : 'text-gray-400'}`}>
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
                </div>
              ))}
            </div>

            {/* Semanas */}
            {weeks.map((week, wi) => (
              <div key={wi} style={COL7} className={wi < weeks.length - 1 ? 'border-b border-gray-100' : ''}>
                {week.map((day, di) => {
                  const isWeekend = di >= 5
                  if (!day) {
                    return (
                      <div
                        key={`e-${wi}-${di}`}
                        className={`p-1 min-h-14 sm:min-h-20 md:min-h-24 ${di < 6 ? 'border-r border-gray-100' : ''} ${isWeekend ? 'bg-gray-50' : 'bg-gray-50/50'}`}
                      />
                    )
                  }

                  const key        = dateKey(day)
                  const dayEvts    = eventsForDay(day)
                  const holiday    = holidays[key]
                  const isSelected = key === selectedDay
                  const isPast     = key < todayStr

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={[
                        'p-1 min-h-14 sm:min-h-20 md:min-h-24 flex flex-col cursor-pointer transition-colors',
                        di < 6 ? 'border-r border-gray-100' : '',
                        isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                          : holiday ? 'bg-rose-50 hover:bg-rose-100'
                          : isWeekend ? 'bg-gray-50 hover:bg-gray-100'
                          : 'hover:bg-slate-50',
                        isPast && !isToday(day) ? 'opacity-40' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      <span className={[
                        'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-semibold rounded-full self-start',
                        isToday(day) ? 'bg-blue-600 text-white shadow-sm'
                          : holiday ? 'text-rose-600 font-bold'
                          : isWeekend ? 'text-rose-400'
                          : 'text-gray-800',
                      ].join(' ')}>
                        {day}
                      </span>

                      {holiday && (
                        <p className="hidden sm:block text-[9px] text-rose-500 font-semibold leading-tight mt-0.5 px-0.5 truncate">
                          🇧🇷 {holiday}
                        </p>
                      )}

                      {dayEvts.length > 0 && (
                        <div className="mt-auto space-y-0.5">
                          {/* Mobile: só bolinhas coloridas */}
                          <div className="flex flex-wrap gap-0.5 sm:hidden">
                            {dayEvts.slice(0, 3).map(e => {
                              const hex = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
                              return <span key={e.id} className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                            })}
                            {dayEvts.length > 3 && <span className="text-[9px] text-gray-400">+{dayEvts.length - 3}</span>}
                          </div>
                          {/* Desktop: chips com texto */}
                          <div className="hidden sm:block space-y-0.5">
                            {dayEvts.slice(0, 2).map(e => {
                              const hex = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
                              return (
                                <div key={e.id} style={{ backgroundColor: hex, color: '#fff' }} className="flex items-center gap-1 rounded px-1 py-0.5">
                                  <span className="text-[10px] font-semibold truncate leading-tight w-full">{e.titulo}</span>
                                </div>
                              )
                            })}
                            {dayEvts.length > 2 && <p className="text-[10px] text-gray-400 px-1">+{dayEvts.length - 2} mais</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ── Painel lateral ─────────────────────────────────────── */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-4">

            {/* Dia selecionado */}
            {selectedDay ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm capitalize flex-1 leading-snug">
                    {fmtDay(selectedDay)}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="ml-2 shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                  >×</button>
                </div>

                {selHoliday && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3">
                    <span>🇧🇷</span>
                    <span className="text-xs font-semibold text-rose-700">{selHoliday}</span>
                  </div>
                )}

                {selEvents.length === 0 && !selHoliday && (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhuma tarefa neste dia.</p>
                )}

                <div className="space-y-2">
                  {selEvents.map(e => {
                    const cfg = catConfig[e.categoria as Cat]
                    const hex = cfg?.hex ?? '#9ca3af'
                    return (
                      <div key={e.id} className="rounded-xl overflow-hidden border border-gray-100">
                        <div style={{ backgroundColor: hex }} className="px-3 py-1.5 flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wide flex-1">{cfg?.label}</span>
                          {e.hora && <span className="text-xs text-white/80 font-mono">{e.hora}</span>}
                        </div>
                        <div className="px-3 py-2">
                          <p className="font-semibold text-sm text-gray-900">{e.titulo}</p>
                          {e.descricao && <p className="text-xs mt-1 text-gray-500 leading-relaxed">{e.descricao}</p>}
                          {(e.assignedTo ?? []).length > 0 && (
                            <p className="text-xs text-teal-600 mt-1">
                              {e.assignedTo!.length} membro{e.assignedTo!.length > 1 ? 's' : ''} marcado{e.assignedTo!.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center hidden md:block">
                <p className="text-sm text-gray-400">Clique em um dia para ver as tarefas.</p>
              </div>
            )}

            {/* Próximas tarefas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Próximas Tarefas
              </h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma tarefa agendada.</p>
              ) : (
                <div className="space-y-1.5">
                  {upcoming.map(e => {
                    const cfg = catConfig[e.categoria as Cat]
                    const hex = cfg?.hex ?? '#9ca3af'
                    return (
                      <button
                        key={e.id}
                        onClick={() => { setSelectedDay(e.data); setCurrent(new Date(e.data + 'T12:00:00')) }}
                        className="w-full text-left rounded-lg overflow-hidden border border-gray-100 hover:shadow-sm transition-shadow flex items-stretch"
                      >
                        <span style={{ backgroundColor: hex }} className="w-1.5 shrink-0" />
                        <div className="flex-1 px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold truncate flex-1 text-gray-800">{e.titulo}</span>
                            <span className="text-[11px] text-gray-400 shrink-0">{fmtShort(e.data)}</span>
                          </div>
                          {e.hora && <p className="text-[11px] text-gray-400 mt-0.5">{e.hora}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Legenda */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Legenda</h3>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 shrink-0" />
                  <span className="text-xs text-rose-600 font-medium">Feriado nacional</span>
                </div>
                {Object.entries(catConfig).map(([k, cfg]) => (
                  <div key={k} className="flex items-center gap-2.5">
                    <span style={{ backgroundColor: cfg.hex }} className="w-3 h-3 rounded-full shrink-0" />
                    <span className="text-xs text-gray-600">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
