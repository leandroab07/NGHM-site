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

// GET /api/member-tasks?username=xxx
// Returns { personal: PersonalTask[], projectTasks: (ProjectTask & { projetoNome: string })[] }
export async function GET(req: NextRequest) {
  const currentUser = await getCurrentUser(req)
  if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const target = req.nextUrl.searchParams.get('username') ?? currentUser.username
  if (target !== currentUser.username && currentUser.role !== 'admin')
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const [personalRes, projectTasksRes, projects, acceptedRes] = await Promise.all([
    supabase.from('personal_tasks').select('*').eq('username', target).order('order', { ascending: true }),
    supabase.from('project_tasks').select('*').order('order', { ascending: true }),
    getLabProjects(),
    supabase.from('project_responses').select('projetoId').eq('username', target).eq('resposta', 'aceito'),
  ])

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.titulo]))
  const acceptedIds = new Set((acceptedRes.data ?? []).map((r: { projetoId: string }) => r.projetoId))

  // Show ALL tasks from accepted projects (not just ones explicitly assigned to the member)
  const myProjectTasks = (projectTasksRes.data ?? [])
    .filter((t: ProjectTask) => acceptedIds.has(t.projetoId))
    .map((t: ProjectTask) => ({ ...t, projetoNome: projectMap[t.projetoId] ?? 'Projeto' }))

  return NextResponse.json({
    personal: personalRes.data ?? [],
    projectTasks: myProjectTasks,
  })
}
