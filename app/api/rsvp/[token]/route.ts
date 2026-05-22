import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { data } = await supabase
    .from('eventos')
    .select('id, titulo, data, hora, descricao, categoria')
    .eq('share_token', token)
    .single()
  if (!data) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await req.json()
  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const { data: evento } = await supabase
    .from('eventos')
    .select('id')
    .eq('share_token', token)
    .single()
  if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

  const rsvp = {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    evento_id: evento.id,
    name,
    confirmed_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('event_rsvps').insert(rsvp)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rsvp, { status: 201 })
}
