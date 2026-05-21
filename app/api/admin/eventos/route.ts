import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getEventos } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { Evento } from '@/lib/types'

async function getAuthorized(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  return user && (user.role === 'admin' || user.role === 'member') ? user : null
}

export async function GET(req: NextRequest) {
  if (!await getAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(await getEventos())
}

export async function POST(req: NextRequest) {
  const user = await getAuthorized(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Evento = await req.json()
  body.id = Date.now().toString()
  body.createdBy = user.username
  body.assignedTo = body.assignedTo ?? []
  const { error } = await supabase.from('eventos').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await getAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Evento = await req.json()
  body.assignedTo = body.assignedTo ?? []
  const { error } = await supabase.from('eventos').update(body).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  if (!await getAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('task_responses').delete().eq('eventoId', id)
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
