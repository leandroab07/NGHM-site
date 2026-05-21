import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getEventos } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { Evento } from '@/lib/types'

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return false
  const payload = verifyToken(token)
  if (!payload) return false
  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  return !!user && (user.role === 'admin' || user.role === 'member')
}

export async function GET(req: NextRequest) {
  if (!await isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(await getEventos())
}

export async function POST(req: NextRequest) {
  if (!await isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Evento = await req.json()
  body.id = Date.now().toString()
  const { error } = await supabase.from('eventos').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Evento = await req.json()
  const { error } = await supabase.from('eventos').update(body).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  if (!await isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
