import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getPublicacoes, getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { Publicacao } from '@/lib/types'

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return false
  const payload = verifyToken(token)
  if (!payload) return false
  const users = await getUsers()
  return users.find(u => u.username === payload.sub)?.role === 'admin'
}

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('nghm-admin-token')?.value
  return !!token && !!verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(await getPublicacoes())
}

export async function POST(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Publicacao = await req.json()
  body.id = Date.now().toString()
  const { error } = await supabase.from('publicacoes').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: Publicacao = await req.json()
  const { error } = await supabase.from('publicacoes').update(body).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  const { error } = await supabase.from('publicacoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
