import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { PersonalTask } from '@/lib/types'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET /api/personal-tasks?username=xxx (admin can query any user)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const target = req.nextUrl.searchParams.get('username') ?? user.username
  if (target !== user.username && user.role !== 'admin')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { data } = await supabase
    .from('personal_tasks')
    .select('*')
    .eq('username', target)
    .order('order', { ascending: true })
  return NextResponse.json(data ?? [])
}

// POST — create (always for authenticated user)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body: Partial<PersonalTask> = await req.json()
  if (!body.titulo?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const task: PersonalTask = {
    id: Date.now().toString(),
    username: user.username,
    titulo: body.titulo.trim(),
    descricao: body.descricao ?? '',
    status: body.status ?? 'todo',
    order: body.order ?? 0,
  }

  const { error } = await supabase.from('personal_tasks').insert(task)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(task, { status: 201 })
}

// PUT — update
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body: Partial<PersonalTask> & { id: string } = await req.json()
  if (!body.id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data: existing } = await supabase.from('personal_tasks').select('*').eq('id', body.id).single()
  if (!existing) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  if (existing.username !== user.username && user.role !== 'admin')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const updated = { ...existing, ...body }
  const { error } = await supabase.from('personal_tasks').update(updated).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}

// DELETE
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data: existing } = await supabase.from('personal_tasks').select('username').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })

  if (existing.username !== user.username && user.role !== 'admin')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { error } = await supabase.from('personal_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
