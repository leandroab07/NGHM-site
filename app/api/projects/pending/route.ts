import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, getLabProjects } from '@/lib/data'
import { supabase } from '@/lib/supabase'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET /api/projects/pending — projetos atribuídos ao usuário sem resposta
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const allProjects = await getLabProjects()
  const assigned = allProjects.filter(
    p => Array.isArray(p.assignedTo) && p.assignedTo.includes(user.username)
  )

  if (assigned.length === 0) return NextResponse.json([])

  const ids = assigned.map(p => p.id)
  const { data: responses } = await supabase
    .from('project_responses')
    .select('projetoId')
    .eq('username', user.username)
    .in('projetoId', ids)

  const respondedIds = new Set((responses ?? []).map((r: { projetoId: string }) => r.projetoId))
  return NextResponse.json(assigned.filter(p => !respondedIds.has(p.id)))
}
