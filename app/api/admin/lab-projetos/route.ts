import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { LabProject } from '@/lib/types'

async function getAdmin(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  const user = users.find(u => u.username === payload.sub)
  return user?.role === 'admin' ? user : null
}

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get('nghm-admin-token')?.value
  return !!token && !!verifyToken(token)
}

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  return NextResponse.json(await getLabProjects())
}

export async function POST(req: NextRequest) {
  const user = await getAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: LabProject = await req.json()
  body.id = Date.now().toString()
  body.createdBy = user.username
  body.assignedTo = body.assignedTo ?? []

  // Admin is always automatically part of their own project
  if (!body.assignedTo.includes(user.username)) {
    body.assignedTo = [user.username, ...body.assignedTo]
  }

  const { error } = await supabase.from('lab_projects').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-accept for the admin who created the project
  await supabase.from('project_responses').insert({
    id: `${body.id}_${user.username}`,
    projetoId: body.id,
    username: user.username,
    name: user.name,
    resposta: 'aceito',
    respondidoEm: new Date().toISOString(),
  })

  return NextResponse.json(body, { status: 201 })
}

export async function PUT(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body: LabProject = await req.json()
  body.assignedTo = body.assignedTo ?? []
  const { error } = await supabase.from('lab_projects').update(body).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  if (!await getAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await req.json()
  await supabase.from('project_responses').delete().eq('projetoId', id)
  const { error } = await supabase.from('lab_projects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
