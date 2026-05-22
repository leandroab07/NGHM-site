import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RsvpForm from './RsvpForm'

export const dynamic = 'force-dynamic'

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

function fmtDate(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]}`
}

export default async function RsvpPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: evento } = await supabase
    .from('eventos')
    .select('id, titulo, data, hora, descricao, categoria')
    .eq('share_token', token)
    .single()

  if (!evento) notFound()

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-block w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{evento.titulo}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {fmtDate(evento.data)}{evento.hora ? ` · ${evento.hora}` : ''}
          </p>
          {evento.descricao && (
            <p className="text-gray-500 text-sm mt-2">{evento.descricao}</p>
          )}
        </div>

        <RsvpForm token={token} eventoId={evento.id} />

        <p className="text-center text-xs text-gray-400 mt-6">NGHM – UFES</p>
      </div>
    </main>
  )
}
