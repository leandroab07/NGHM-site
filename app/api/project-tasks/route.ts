import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProjectTask } from '@/lib/types'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

async function canAccessProject(user: { username: string; role: string }, projetoId: string): Promise<boolean> {
  if (user.role === 'admin') return true
  const projects = await getLabProjects()
  const project = projects.find(p => p.id === projetoId)
  if (!project || !(project.assignedTo ?? []).includes(user.username)) return false
  const { data } = await supabase
    .from('project_responses')
    .select('resposta')
    .eq('projetoId', projetoId)
    .eq('username', user.username)
    .single()
  return data?.resposta === 'aceito'
}

// GET /api/project-tasks?projetoId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const projetoId = req.nextUrl.searchParams.get('projetoId')
  if (!projetoId) return NextResponse.json([])

  if (!await canAccessProject(user, projetoId))
    return NextResponse.json({ error: 'Sem acesso a este projeto' }, { status: 403 })

  const { data } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('projetoId', projetoId)
    .order('order', { ascending: true })
  return NextResponse.json(data ?? [])
}

// POST — create task
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body: Partial<ProjectTask> = await req.json()
  if (!body.projetoId || !body.titulo)
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  if (!await canAccessProject(user, body.projetoId))
    return NextResponse.json({ error: 'Sem acesso a este projeto' }, { status: 403 })

  const task: ProjectTask = {
    id: Date.now().toString(),
    projetoId: body.projetoId,
    titulo: body.titulo.trim(),
    descricao: body.descricao ?? '',
    status: body.status ?? 'todo',
    assignedTo: body.assignedTo ?? '',
    createdBy: user.username,
    order: body.order ?? 0,
  }

  const { error } = await supabase.from('project_tasks').insert(task)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(task, { status: 201 })
}

// PUT — update task fields
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body: Partial<ProjectTask> & { id: string } = await req.json()
  if (!body.id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data: existing } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', body.id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  if (!await canAccessProject(user, existing.projetoId))
    return NextResponse.json({ error: 'Sem acesso a este projeto' }, { status: 403 })

  const updated = { ...existing, ...body }
  const { error } = await supabase.from('project_tasks').update(updated).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(updated)
}

// DELETE — remove task
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data: existing } = await supabase
    .from('project_tasks')
    .select('projetoId')
    .eq('id', id)
    .single()
  if (!existing) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  if (!await canAccessProject(user, existing.projetoId))
    return NextResponse.json({ error: 'Sem acesso a este projeto' }, { status: 403 })

  const { error } = await supabase.from('project_tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
