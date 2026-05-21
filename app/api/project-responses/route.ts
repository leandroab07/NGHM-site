import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProjectResponse } from '@/lib/types'

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get('nghm-admin-token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  const users = await getUsers()
  return users.find(u => u.username === payload.sub) ?? null
}

// GET ?projetoId=xxx → respostas do projeto (admin)
// GET ?mine=true     → respostas do usuário atual
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const projetoId = req.nextUrl.searchParams.get('projetoId')
  const mine      = req.nextUrl.searchParams.get('mine')

  if (mine === 'true') {
    const { data } = await supabase.from('project_responses').select('*').eq('username', user.username)
    return NextResponse.json(data ?? [])
  }

  if (!projetoId) return NextResponse.json([])
  const { data } = await supabase.from('project_responses').select('*').eq('projetoId', projetoId)
  return NextResponse.json(data ?? [])
}

// POST { projetoId, resposta: 'aceito'|'recusado' }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { projetoId, resposta } = await req.json()
  if (!projetoId || !resposta) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const response: ProjectResponse = {
    id: `${projetoId}_${user.username}`,
    projetoId,
    username: user.username,
    name: user.name,
    resposta,
    respondidoEm: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('project_responses')
    .upsert(response, { onConflict: 'projetoId,username' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(response)
}
