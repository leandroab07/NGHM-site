import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getEquipe } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { Membro } from '@/lib/types'

function isAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get('nghm-admin-token')?.value
  return !!token && !!verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(await getEquipe())
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Membro = await req.json()
  body.id = Date.now().toString()
  const { error } = await supabase.from('equipe').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Membro = await req.json()
  const { error } = await supabase.from('equipe').update(body).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  const { error } = await supabase.from('equipe').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
