'use client'
import { useState, useEffect } from 'react'
import type { Evento, TaskResponse, EventRsvp } from '@/lib/types'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export const catConfig = {
  prova:   { label: 'Prova / Avaliação', hex: '#ef4444' },
  reuniao: { label: 'Reunião',           hex: '#3b82f6' },
  prazo:   { label: 'Prazo / Entrega',   hex: '#f59e0b' },
  aula:    { label: 'Aula',              hex: '#22c55e' },
  evento:  { label: 'Evento',            hex: '#a855f7' },
  outro:   { label: 'Outro',             hex: '#9ca3af' },
} as const
type Cat = keyof typeof catConfig
type Holiday = { date: string; name: string }

const COL7 = { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' } as const

// ── Chevron icons ──────────────────────────────────────────────────────────
function ChevL() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
}
function ChevR() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
}

// ── Meus Compromissos ──────────────────────────────────────────────────────
function MeusCompromissos({ eventos, currentUsername }: { eventos: Evento[]; currentUsername: string }) {
  const [selected, setSelected]       = useState<Evento | null>(null)
  const [mode, setMode]               = useState<'criada' | 'aceita'>('criada')
  const [responses, setResponses]     = useState<TaskResponse[]>([])
  const [rsvps, setRsvps]             = useState<EventRsvp[]>([])
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set())
  const [loadingId, setLoadingId]     = useState<string | null>(null)
  const [loadingMine, setLoadingMine] = useState(true)

  useEffect(() => {
    fetch('/api/task-responses?mine=true')
      .then(r => r.ok ? r.json() : [])
      .then((data: TaskResponse[]) => {
        if (!Array.isArray(data)) return
        setAcceptedIds(new Set(data.filter(r => r.resposta === 'aceito').map(r => r.eventoId)))
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false))
  }, [])

  const criadas = eventos.filter(e => e.createdBy === currentUsername).sort((a, b) => a.data.localeCompare(b.data))
  const aceitas = eventos.filter(e => acceptedIds.has(e.id)).sort((a, b) => a.data.localeCompare(b.data))

  async function openEvento(e: Evento, m: 'criada' | 'aceita') {
    setSelected(e); setMode(m); setLoadingId(e.id); setRsvps([])
    try {
      const [taskRes, rsvpRes] = await Promise.all([
        fetch(`/api/task-responses?eventoId=${e.id}`),
        m === 'criada' ? fetch(`/api/admin/eventos/share?eventoId=${e.id}`) : Promise.resolve(null),
      ])
      setResponses(taskRes.ok ? await taskRes.json() : [])
      if (rsvpRes?.ok) setRsvps(await rsvpRes.json())
    } finally { setLoadingId(null) }
  }

  function fmtDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  const assigned     = selected?.assignedTo ?? []
  const accepted     = responses.filter(r => r.resposta === 'aceito')
  const declined     = responses.filter(r => r.resposta === 'recusado')
  const respondedSet = new Set(responses.map(r => r.username))
  const pending      = assigned.filter(u => !respondedSet.has(u))

  function EventRow({ e, m }: { e: Evento; m: 'criada' | 'aceita' }) {
    const hex  = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
    const isSel = selected?.id === e.id
    return (
      <button onClick={() => openEvento(e, m)}
        className={`w-full text-left flex items-stretch rounded-xl border overflow-hidden transition-all hover:shadow-sm ${
          isSel ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300'
        }`}>
        <div className="w-1 shrink-0" style={{ backgroundColor: hex }}/>
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {catConfig[e.categoria as Cat]?.label}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              {e.hora ? ` · ${e.hora}` : ''}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{e.titulo}</p>
          {e.descricao && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{e.descricao}</p>}
          {m === 'criada' && (e.assignedTo ?? []).length > 0 && (
            <p className="text-xs text-gray-400 mt-1">{e.assignedTo!.length} membro{e.assignedTo!.length > 1 ? 's' : ''} marcado{e.assignedTo!.length > 1 ? 's' : ''}</p>
          )}
        </div>
        {loadingId === e.id && (
          <div className="flex items-center pr-3 text-gray-300">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* Lista */}
      <div className="w-full md:flex-1 min-w-0 space-y-6">
        {loadingMine ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-400 gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Carregando…
          </div>
        ) : criadas.length === 0 && aceitas.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-16 text-center">
            <p className="text-sm text-gray-400">Nenhum compromisso registrado.</p>
          </div>
        ) : (
          <>
            {criadas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tarefas que criei ({criadas.length})
                </p>
                <div className="space-y-2">
                  {criadas.map(e => <EventRow key={e.id} e={e} m="criada"/>)}
                </div>
              </div>
            )}
            {aceitas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tarefas que aceitei ({aceitas.length})
                </p>
                <div className="space-y-2">
                  {aceitas.map(e => <EventRow key={e.id} e={e} m="aceita"/>)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Painel de detalhe */}
      <div className="w-full md:w-72 shrink-0">
        {selected ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-1 self-stretch rounded-full shrink-0 mt-1" style={{ backgroundColor: catConfig[selected.categoria as Cat]?.hex ?? '#9ca3af' }}/>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    {catConfig[selected.categoria as Cat]?.label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{selected.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{fmtDate(selected.data)}</p>
                  {selected.hora && <p className="text-xs text-gray-400">{selected.hora}</p>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-600 shrink-0 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center">×</button>
            </div>

            <div className="p-5 space-y-4">
              {selected.descricao && (
                <p className="text-sm text-gray-600 leading-relaxed">{selected.descricao}</p>
              )}
              {mode === 'aceita' && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                  Você aceitou esta tarefa
                </div>
              )}
              {mode === 'criada' && (
                <div className="space-y-3">
                  {(accepted.length > 0 || rsvps.length > 0) && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                        Aceitaram ({accepted.length + rsvps.length})
                      </p>
                      {accepted.map(r => (
                        <div key={r.username} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"/>
                          {r.name}
                        </div>
                      ))}
                      {rsvps.map(r => (
                        <div key={r.id} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"/>
                          <span>{r.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">via link</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {declined.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Recusaram ({declined.length})</p>
                      {declined.map(r => (
                        <div key={r.username} className="flex items-center gap-2 py-1 text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"/>
                          {r.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {pending.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Aguardando ({pending.length})</p>
                      {pending.map(u => (
                        <div key={u} className="flex items-center gap-2 py-1 text-sm text-gray-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0"/>
                          @{u}
                        </div>
                      ))}
                    </div>
                  )}
                  {accepted.length === 0 && rsvps.length === 0 && declined.length === 0 && pending.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhuma confirmação ainda.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex border border-dashed border-gray-200 rounded-xl p-6 items-center justify-center text-center">
            <p className="text-xs text-gray-400">Clique em uma tarefa para ver os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function CalendarioClient({ eventos: initialEventos, currentUsername }: {
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
      } catch { /* indisponível */ }
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
    .slice(0, 7)

  function fmtDay(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  function fmtShort(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div>
      {/* Tabs — underline style */}
      {!!currentUsername && (
        <div className="flex gap-6 border-b border-gray-200 mb-7">
          {(['calendario', 'compromissos'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'calendario' ? 'Calendário' : 'Meus compromissos'}
            </button>
          ))}
        </div>
      )}

      {/* Meus Compromissos */}
      {tab === 'compromissos' && currentUsername && (
        <MeusCompromissos eventos={eventos} currentUsername={currentUsername}/>
      )}

      {/* Calendário */}
      {tab === 'calendario' && (
        <div className="flex flex-col md:flex-row gap-5 items-start">

          {/* ── Grade ──────────────────────────────────────────────── */}
          <div className="w-full md:flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Navegação */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <button
                onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null) }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevL/>
              </button>
              <h2 className="flex-1 text-center text-sm font-semibold text-gray-900 tracking-wide">
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null) }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevR/>
              </button>
              <button
                onClick={() => { setCurrent(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(todayStr) }}
                className="ml-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Hoje
              </button>
            </div>

            {/* Dias da semana */}
            <div style={COL7} className="border-b border-gray-100">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${i >= 5 ? 'text-rose-400' : 'text-gray-400'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Semanas */}
            {weeks.map((week, wi) => (
              <div key={wi} style={COL7} className={wi < weeks.length - 1 ? 'border-b border-gray-100' : ''}>
                {week.map((day, di) => {
                  const isWknd = di >= 5
                  if (!day) return (
                    <div key={`e-${wi}-${di}`}
                      className={`min-h-16 sm:min-h-24 ${di < 6 ? 'border-r border-gray-100' : ''} bg-gray-50/60`}/>
                  )

                  const key        = dateKey(day)
                  const dayEvts    = eventsForDay(day)
                  const holiday    = holidays[key]
                  const isSelected = key === selectedDay
                  const isPast     = key < todayStr
                  const isTod      = isToday(day)

                  return (
                    <div key={key} onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={[
                        'min-h-16 sm:min-h-24 p-1.5 flex flex-col cursor-pointer transition-colors',
                        di < 6 ? 'border-r border-gray-100' : '',
                        isSelected ? 'bg-gray-900' : holiday ? 'bg-rose-50 hover:bg-rose-100/60' : isWknd ? 'bg-gray-50/70 hover:bg-gray-100/60' : 'hover:bg-gray-50',
                        isPast && !isTod ? 'opacity-50' : '',
                      ].filter(Boolean).join(' ')}>

                      {/* Day number */}
                      <span className={[
                        'w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-xs sm:text-sm font-semibold rounded-full self-start transition-colors',
                        isTod && !isSelected ? 'bg-gray-900 text-white'
                          : isSelected ? 'bg-white text-gray-900'
                          : holiday ? 'text-rose-500'
                          : isWknd ? 'text-rose-400'
                          : 'text-gray-700',
                      ].join(' ')}>
                        {day}
                      </span>

                      {/* Holiday label */}
                      {holiday && !isSelected && (
                        <p className="hidden sm:block text-[9px] text-rose-400 font-medium leading-tight mt-0.5 px-0.5 truncate">
                          {holiday}
                        </p>
                      )}

                      {/* Events */}
                      {dayEvts.length > 0 && (
                        <div className="mt-auto space-y-0.5">
                          {/* Mobile dots */}
                          <div className="flex flex-wrap gap-0.5 sm:hidden mt-1">
                            {dayEvts.slice(0, 3).map(e => (
                              <span key={e.id} className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: catConfig[e.categoria as Cat]?.hex ?? '#9ca3af' }}/>
                            ))}
                            {dayEvts.length > 3 && <span className="text-[9px] text-gray-400 ml-0.5">+{dayEvts.length - 3}</span>}
                          </div>
                          {/* Desktop chips */}
                          <div className="hidden sm:block space-y-0.5">
                            {dayEvts.slice(0, 2).map(e => {
                              const hex = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
                              return (
                                <div key={e.id} className={`flex items-center gap-1 rounded px-1.5 py-0.5 ${isSelected ? 'bg-white/15' : 'bg-gray-50'}`}
                                  style={{ borderLeft: `2px solid ${hex}` }}>
                                  <span className={`text-[10px] font-medium truncate leading-tight ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                    {e.titulo}
                                  </span>
                                </div>
                              )
                            })}
                            {dayEvts.length > 2 && (
                              <p className={`text-[10px] px-1.5 ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                                +{dayEvts.length - 2}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────── */}
          <div className="w-full md:w-64 shrink-0 space-y-4">

            {/* Dia selecionado */}
            {selectedDay ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 capitalize leading-snug">
                    {fmtDay(selectedDay)}
                  </p>
                  <button onClick={() => setSelectedDay(null)}
                    className="text-gray-300 hover:text-gray-600 transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center ml-2 shrink-0">
                    ×
                  </button>
                </div>

                {selHoliday && (
                  <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                    <span>🇧🇷</span>{selHoliday}
                  </div>
                )}

                {selEvents.length === 0 && !selHoliday ? (
                  <p className="text-xs text-gray-400 text-center py-6">Nenhum evento neste dia.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {selEvents.map(e => {
                      const hex = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
                      return (
                        <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                          <div className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: hex }}/>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-gray-800 leading-snug">{e.titulo}</p>
                              {e.hora && <span className="text-xs text-gray-400 shrink-0 font-mono">{e.hora}</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{catConfig[e.categoria as Cat]?.label}</p>
                            {e.descricao && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{e.descricao}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex border border-dashed border-gray-200 rounded-xl px-4 py-5 items-center justify-center text-center">
                <p className="text-xs text-gray-400">Clique em um dia para ver os eventos.</p>
              </div>
            )}

            {/* Próximos eventos */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Próximos eventos</p>
              </div>
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-5">Nenhum evento agendado.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcoming.map(e => {
                    const hex = catConfig[e.categoria as Cat]?.hex ?? '#9ca3af'
                    return (
                      <button key={e.id}
                        onClick={() => { setSelectedDay(e.data); setCurrent(new Date(e.data + 'T12:00:00')) }}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: hex }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{e.titulo}</p>
                          {e.hora && <p className="text-[10px] text-gray-400 mt-0.5">{e.hora}</p>}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">{fmtShort(e.data)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Legenda */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Legenda</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300 shrink-0"/>
                  <span className="text-xs text-gray-500">Feriado nacional</span>
                </div>
                {Object.entries(catConfig).map(([k, cfg]) => (
                  <div key={k} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }}/>
                    <span className="text-xs text-gray-500">{cfg.label}</span>
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
