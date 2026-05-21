'use client'
import { useState, useEffect } from 'react'
import type { Evento } from '@/lib/types'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const catConfig = {
  prova:   { label: 'Prova / Avaliação', color: 'bg-red-500',    light: 'bg-red-50 text-red-700 border-red-200',     hex: '#ef4444' },
  reuniao: { label: 'Reunião',           color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700 border-blue-200',   hex: '#3b82f6' },
  prazo:   { label: 'Prazo / Entrega',   color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700 border-amber-200',hex: '#f59e0b' },
  aula:    { label: 'Aula',              color: 'bg-green-500',  light: 'bg-green-50 text-green-700 border-green-200',hex: '#22c55e' },
  evento:  { label: 'Evento',            color: 'bg-purple-500', light: 'bg-purple-50 text-purple-700 border-purple-200',hex: '#a855f7' },
  outro:   { label: 'Outro',             color: 'bg-gray-400',   light: 'bg-gray-50 text-gray-700 border-gray-200',   hex: '#9ca3af' },
} as const

type Cat = keyof typeof catConfig
type Holiday = { date: string; name: string }

const COL7 = { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' } as const

export default function CalendarioClient({ eventos: initialEventos }: { eventos: Evento[] }) {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

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
        const res  = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`)
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

  // Monta as semanas
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Seg = 0
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
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  }
  function fmtShort(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

      {/* ── Calendário ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Navegação */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelectedDay(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-500 transition-colors font-bold text-xl"
          >
            ‹
          </button>
          <h2 className="flex-1 text-center text-lg font-bold text-gray-900">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelectedDay(null) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-200 text-gray-500 transition-colors font-bold text-xl"
          >
            ›
          </button>
          <button
            onClick={() => {
              setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))
              setSelectedDay(todayStr)
            }}
            className="ml-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Cabeçalho: dias da semana */}
        <div style={COL7} className="border-b border-gray-200 bg-gray-50">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={[
                'py-2.5 text-center text-xs font-semibold uppercase tracking-wider',
                i >= 5 ? 'text-rose-400' : 'text-gray-400',
              ].join(' ')}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Semanas */}
        {weeks.map((week, wi) => (
          <div
            key={wi}
            style={COL7}
            className={wi < weeks.length - 1 ? 'border-b border-gray-100' : ''}
          >
            {week.map((day, di) => {
              const isWeekend = di >= 5

              if (!day) {
                return (
                  <div
                    key={`e-${wi}-${di}`}
                    style={{ minHeight: '6rem' }}
                    className={[
                      'p-1.5',
                      di < 6 ? 'border-r border-gray-100' : '',
                      isWeekend ? 'bg-gray-50' : 'bg-gray-50/50',
                    ].join(' ')}
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
                  style={{ minHeight: '6rem' }}
                  className={[
                    'p-1.5 flex flex-col cursor-pointer transition-colors',
                    di < 6 ? 'border-r border-gray-100' : '',
                    isSelected
                      ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                      : holiday
                      ? 'bg-rose-50 hover:bg-rose-100'
                      : isWeekend
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'hover:bg-slate-50',
                    isPast && !isToday(day) ? 'opacity-40' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Número */}
                  <span className={[
                    'w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full self-start',
                    isToday(day)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : holiday
                      ? 'text-rose-600 font-bold'
                      : isWeekend
                      ? 'text-rose-400'
                      : 'text-gray-800',
                  ].join(' ')}>
                    {day}
                  </span>

                  {/* Feriado */}
                  {holiday && (
                    <p className="text-[9px] text-rose-500 font-semibold leading-tight mt-0.5 px-0.5 truncate">
                      🇧🇷 {holiday}
                    </p>
                  )}

                  {/* Chips de eventos */}
                  {dayEvts.length > 0 && (
                    <div className="mt-auto space-y-0.5">
                      {dayEvts.slice(0, 2).map(e => {
                        const cfg = catConfig[e.categoria as Cat]
                        const hex = cfg?.hex ?? '#9ca3af'
                        return (
                          <div
                            key={e.id}
                            style={{ backgroundColor: hex, color: '#fff' }}
                            className="flex items-center gap-1 rounded px-1 py-0.5"
                          >
                            <span className="text-[10px] font-semibold truncate leading-tight w-full">{e.titulo}</span>
                          </div>
                        )
                      })}
                      {dayEvts.length > 2 && (
                        <p className="text-[10px] text-gray-400 px-1">+{dayEvts.length - 2} mais</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Painel lateral ─────────────────────────────────────── */}
      <div style={{ width: '18rem', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

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
              >
                ×
              </button>
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
                      {e.descricao && (
                        <p className="text-xs mt-1 text-gray-500 leading-relaxed">{e.descricao}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm text-center">
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
                    onClick={() => {
                      setSelectedDay(e.data)
                      setCurrent(new Date(e.data + 'T12:00:00'))
                    }}
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
          <div className="space-y-2">
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
  )
}
