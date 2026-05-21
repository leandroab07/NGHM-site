import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET /api/tasks/pending — eventos assigned to current user with no response yet
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Fetch all events and filter in JS — avoids Supabase text[] contains quirks
  const { data: allEventos } = await supabase.from('eventos').select('*')
  const eventos = (allEventos ?? []).filter(
    (e: { assignedTo?: string[] }) =>
      Array.isArray(e.assignedTo) && e.assignedTo.includes(user.username)
  )

  if (eventos.length === 0) return NextResponse.json([])

  const eventoIds = eventos.map((e: { id: string }) => e.id)
  const { data: responses } = await supabase
    .from('task_responses')
    .select('eventoId')
    .eq('username', user.username)
    .in('eventoId', eventoIds)

  const respondedIds = new Set((responses ?? []).map((r: { eventoId: string }) => r.eventoId))
  const pending = eventos.filter((e: { id: string }) => !respondedIds.has(e.id))

  return NextResponse.json(pending)
}
