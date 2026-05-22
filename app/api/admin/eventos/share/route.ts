import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'

async function getAdmin(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  return user?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const { eventoId } = await req.json()

  const { data: existing } = await supabase
    .from('eventos')
    .select('share_token')
    .eq('id', eventoId)
    .single()
  if (existing?.share_token) return NextResponse.json({ token: existing.share_token })

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const { error } = await supabase.from('eventos').update({ share_token: token }).eq('id', eventoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token })
}

export async function GET(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  const eventoId = req.nextUrl.searchParams.get('eventoId')
  if (!eventoId) return NextResponse.json({ error: 'eventoId obrigatório' }, { status: 400 })
  const { data } = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('evento_id', eventoId)
    .order('confirmed_at', { ascending: true })
  return NextResponse.json(data ?? [])
}
