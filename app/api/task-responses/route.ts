import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { TaskResponse } from '@/lib/types'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET /api/task-responses?eventoId=xxx
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const eventoId = req.nextUrl.searchParams.get('eventoId')
  if (!eventoId) return NextResponse.json([])
  const { data } = await supabase
    .from('task_responses')
    .select('*')
    .eq('eventoId', eventoId)
  return NextResponse.json(data ?? [])
}

// POST /api/task-responses  { eventoId, resposta: 'aceito'|'recusado' }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { eventoId, resposta } = await req.json()
  if (!eventoId || !resposta) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const response: TaskResponse = {
    id: `${eventoId}_${user.username}`,
    eventoId,
    username: user.username,
    name: user.name,
    resposta,
    respondidoEm: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('task_responses')
    .upsert(response, { onConflict: 'eventoId,username' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(response)
}
